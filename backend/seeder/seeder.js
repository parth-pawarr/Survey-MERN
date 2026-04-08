'use strict';
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * seeder.js — Entry point for survey data seeding.
 *
 * Usage:
 *   node seeder.js             → Live insert into MongoDB
 *   node seeder.js --dry-run   → Generate JSON file only, no DB writes
 *   node seeder.js --count=100 → Override TOTAL_DOCS at runtime
 */

const path = require('path');
const fs = require('fs');

// Load .env: seeder's own .env takes priority, falls back to parent backend .env
const localEnv = path.resolve(__dirname, '.env');
const parentEnv = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: fs.existsSync(localEnv) ? localEnv : parentEnv });

const mongoose = require('mongoose');
const { generateFullDocument } = require('./generator');
const { validate } = require('./validator');
const { SEED_CONFIG } = require('./config');

// ─── CLI ARG PARSING ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const OFFLINE = args.includes('--offline'); // skip DB entirely; uses mock surveyorId

// Allow overriding count: node seeder.js --count=100
const countArg = args.find((a) => a.startsWith('--count='));
const TOTAL_DOCS = countArg
    ? Math.max(1, parseInt(countArg.split('=')[1], 10))
    : SEED_CONFIG.TOTAL_DOCS;

const BATCH_SIZE = SEED_CONFIG.BATCH_SIZE;
const OUTPUT_FILE = path.resolve(__dirname, SEED_CONFIG.OUTPUT_FILE);

// ─── LOGGING ──────────────────────────────────────────────────────────────────

function log(msg) { console.log(`[SEEDER]    ${msg}`); }
function warn(msg) { console.warn(`[VALIDATOR] ${msg}`); }
function err(msg) { console.error(`[ERROR]     ${msg}`); }

// ─── DB CONNECTION ────────────────────────────────────────────────────────────

async function connectDB() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not set in .env');
    log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
    });
    log('Connected to MongoDB.');
}

// ─── FETCH SURVEYOR IDS ───────────────────────────────────────────────────────

async function fetchSurveyorIds() {
    const db = mongoose.connection.db;
    const users = await db
        .collection('users')
        .find({ role: 'surveyor', isActive: { $ne: false } }, { projection: { _id: 1 } })
        .toArray();

    if (users.length === 0) {
        throw new Error(
            'No active surveyors found in the "users" collection. ' +
            'Run setup-admin.js first and create at least one surveyor account.'
        );
    }

    const ids = users.map((u) => u._id);
    log(`Fetched ${ids.length} surveyor ID(s): ${ids.map((id) => id.toString()).join(', ')}`);
    return ids;
}

// ─── FETCH VILLAGES ───────────────────────────────────────────────────────────

async function fetchVillages() {
    const db = mongoose.connection.db;
    const docs = await db
        .collection('villages')
        .find({}, { projection: { name: 1 } })
        .toArray();

    if (docs.length === 0) {
        // Fall back to config list if DB has no villages yet
        const { VILLAGES } = require('./config');
        log(`No villages found in DB — using ${VILLAGES.length} built-in village names.`);
        return VILLAGES;
    }

    const names = docs.map((v) => v.name);
    log(`Fetched ${names.length} village(s) from DB: ${names.slice(0, 5).join(', ')}${names.length > 5 ? '...' : ''}`);
    return names;
}

// ─── DOCUMENT GENERATION ─────────────────────────────────────────────────────

function generateDocuments(surveyorIds, villages) {
    log(`Generating ${TOTAL_DOCS} document(s)...`);

    const valid = [];
    const invalid = [];

    for (let i = 0; i < TOTAL_DOCS; i++) {
        const doc = generateFullDocument(surveyorIds, i, villages);
        const result = validate(doc);

        if (result.valid) {
            valid.push(doc);
        } else {
            invalid.push({ index: i, errors: result.errors });
            result.errors.forEach((e) => warn(`doc#${i}: ${e}`));
        }
    }

    log(`Generation complete — Valid: ${valid.length} | Invalid (skipped): ${invalid.length}`);
    return { valid, invalid };
}

// ─── DRY RUN ──────────────────────────────────────────────────────────────────

function writeDryRunOutput(docs) {
    // Convert ObjectIds to strings for clean JSON output
    const serialisable = docs.map((doc) => ({
        ...doc,
        surveyorId: doc.surveyorId.toString(),
    }));
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(serialisable, null, 2), 'utf-8');
    log(`Dry-run complete. ${docs.length} document(s) written to: ${OUTPUT_FILE}`);
    log('No data was inserted into MongoDB.');
}

// ─── LIVE INSERT ──────────────────────────────────────────────────────────────

async function insertBatches(docs) {
    const collection = mongoose.connection.db.collection('householdSurveys');
    const totalBatches = Math.ceil(docs.length / BATCH_SIZE);

    let totalInserted = 0;
    let totalFailed = 0;

    for (let b = 0; b < totalBatches; b++) {
        const start = b * BATCH_SIZE;
        const batch = docs.slice(start, start + BATCH_SIZE);

        try {
            const result = await collection.insertMany(batch, { ordered: false });
            const inserted = result.insertedCount;
            totalInserted += inserted;
            log(`Batch ${b + 1}/${totalBatches}: inserted ${inserted}/${batch.length}`);
        } catch (insertErr) {
            // ordered: false means partial success is possible
            const inserted = insertErr.result?.insertedCount ?? 0;
            const failed = batch.length - inserted;
            totalInserted += inserted;
            totalFailed += failed;
            err(`Batch ${b + 1}/${totalBatches}: inserted ${inserted}, failed ${failed}`);
            if (insertErr.writeErrors) {
                insertErr.writeErrors.slice(0, 3).forEach((we) =>
                    err(`  Write error [${we.index}]: ${we.errmsg}`)
                );
                if (insertErr.writeErrors.length > 3) {
                    err(`  ...and ${insertErr.writeErrors.length - 3} more write error(s)`);
                }
            }
        }
    }

    return { totalInserted, totalFailed };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    const startTime = Date.now();

    try {
        let surveyorIds;
        let villages;

        if (OFFLINE && DRY_RUN) {
            // Offline dry-run: use a mock ObjectId — no DB connection needed
            log('OFFLINE mode: skipping DB connection. Using mock surveyorId and built-in villages.');
            surveyorIds = [new mongoose.Types.ObjectId()];
            const { VILLAGES } = require('./config');
            villages = VILLAGES;
        } else {
            // ── Connect to MongoDB ─────────────────────────────────────────────────
            await connectDB();
            surveyorIds = await fetchSurveyorIds();
            villages = await fetchVillages();
        }

        // ── Generate & validate ───────────────────────────────────────────────────
        const { valid, invalid } = generateDocuments(surveyorIds, villages);

        if (valid.length === 0) {
            log('No valid documents generated. Aborting.');
            process.exit(1);
        }

        // ── Dry-run mode: write to JSON, skip DB ──────────────────────────────────
        if (DRY_RUN) {
            writeDryRunOutput(valid);
        } else if (!OFFLINE) {
            // ── Live insert (requires active DB connection) ───────────────────────────
            log(`Inserting ${valid.length} document(s) in batches of ${BATCH_SIZE}...`);
            const { totalInserted, totalFailed } = await insertBatches(valid);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            log('─'.repeat(60));
            log(`Summary:`);
            log(`  Total requested : ${TOTAL_DOCS}`);
            log(`  Generated valid  : ${valid.length}`);
            log(`  Skipped (invalid): ${invalid.length}`);
            log(`  Inserted         : ${totalInserted}`);
            log(`  Failed (DB error): ${totalFailed}`);
            log(`  Time elapsed     : ${elapsed}s`);
            log('─'.repeat(60));
        }

    } catch (e) {
        err(e.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            log('Disconnected from MongoDB.');
        }
    }
}

main();
