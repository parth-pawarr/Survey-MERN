"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompactInputProps {
  label: string;
  id: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  error?: string;
}

export function CompactInput({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  maxLength,
  min,
  max,
  error,
}: CompactInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          let val = e.target.value;
          if (maxLength && val.length > maxLength) return;

          if (type === "number") {
            // Prevent negative sign and other non-numeric chars for positive-only fields
            // Allow empty string so user can clear the field
            if (val !== "" && !/^\d+$/.test(val)) return;

            // Validate min if provided
            if (min !== undefined && val !== "" && Number(val) < min) {
              // Optionally we could just return, or set it to min
              // But if the user types '0' and min is 1, they might be typing '05'
              // So for now, we'll just prevent negative values at the input level
            }
          }

          onChange(val);
        }}
        placeholder={placeholder}
        className="h-8 text-sm"
        maxLength={maxLength}
        min={min}
        max={max}
        inputMode={type === "number" ? "numeric" : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface PhoneInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
}

export function PhoneInput({
  label,
  id,
  value,
  onChange,
  required = false,
  error,
}: PhoneInputProps) {
  const isValid = value.length === 0 || value.length === 10;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          onChange(digits);
        }}
        placeholder="Enter 10-digit number"
        className={`h-8 text-sm ${error || (!isValid && value.length > 0) ? "border-destructive" : ""}`}
        maxLength={10}
      />
      {error ? (
        <p className="text-[10px] leading-tight text-destructive">{error}</p>
      ) : !isValid && value.length > 0 ? (
        <p className="text-[10px] leading-tight text-destructive">
          Phone number must be exactly 10 digits
        </p>
      ) : null}
    </div>
  );
}

interface CompactRadioGroupProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
}

export function CompactRadioGroup({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
}: CompactRadioGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((opt) => (
          <div key={opt} className="flex items-center gap-1.5">
            <RadioGroupItem value={opt} id={`radio-${label}-${opt}`} />
            <Label htmlFor={`radio-${label}-${opt}`} className="text-xs font-normal cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-[10px] leading-tight text-destructive">{error}</p>}
    </div>
  );
}

interface CompactDropdownProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function CompactDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  required = false,
  error,
}: CompactDropdownProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`h-8 text-sm w-full ${error ? "border-destructive text-destructive" : ""}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[10px] leading-tight text-destructive">{error}</p>}
    </div>
  );
}

interface CompactCheckboxGroupProps {
  label: string;
  selected: string[];
  onChange: (val: string[]) => void;
  options: string[];
  required?: boolean;
  error?: string;
}

export function CompactCheckboxGroup({
  label,
  selected,
  onChange,
  options,
  required = false,
  error,
}: CompactCheckboxGroupProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-1.5 text-xs cursor-pointer rounded border p-1.5 ${error ? "border-destructive" : ""}`}
          >
            <Checkbox
              checked={selected.includes(opt)}
              onCheckedChange={() => toggle(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
      {error && <p className="text-[10px] leading-tight text-destructive">{error}</p>}
    </div>
  );
}

interface AgeGenderRowProps {
  age: string | number;
  onAgeChange: (v: string) => void;
  gender: string;
  onGenderChange: (v: string) => void;
  ageId: string;
  genderOptions: string[];
  required?: boolean;
  min?: number;
  max?: number;
  ageError?: string;
  genderError?: string;
}

export function AgeGenderRow({
  age,
  onAgeChange,
  gender,
  onGenderChange,
  ageId,
  genderOptions,
  required = false,
  min,
  max,
  ageError,
  genderError,
}: AgeGenderRowProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <CompactInput
        label="Age"
        id={ageId}
        value={age}
        onChange={onAgeChange}
        type="number"
        placeholder="Age"
        maxLength={3}
        min={min}
        max={max}
        required={required}
        error={ageError}
      />
      <CompactDropdown
        label="Gender"
        value={gender}
        onChange={onGenderChange}
        options={genderOptions}
        placeholder="Gender"
        required={required}
        error={genderError}
      />
    </div>
  );
}
