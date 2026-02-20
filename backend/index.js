require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');

const app = express();

// Security & Logging
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' })); // Frontend URL
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// DB Connection
connectDB();

// Basic route test
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/villages', require('./routes/villages'));

// Health check (keep this last)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
