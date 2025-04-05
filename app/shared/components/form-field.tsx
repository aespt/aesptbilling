'use client';

import { TextField, type TextFieldProps } from '@mui/material';

interface FormFieldProps extends Omit<TextFieldProps, 'onChange'> {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  label: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  fullWidth?: boolean;
  placeholder?: string;
}

export default function FormField({
  name,
  value,
  onChange,
  label,
  error = false,
  helperText,
  required = false,
  disabled = false,
  type = 'text',
  multiline = false,
  rows = 1,
  min,
  max,
  step,
  fullWidth = true,
  placeholder,
  ...rest
}: FormFieldProps) {
  const inputProps: { inputProps?: { min?: number; max?: number; step?: number } } = {};

  if (type === 'number') {
    inputProps.inputProps = {
      min,
      max,
      step,
    };
  }

  return (
    <TextField
      name={name}
      value={value}
      onChange={onChange}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      type={type}
      multiline={multiline}
      rows={rows}
      fullWidth={fullWidth}
      placeholder={placeholder}
      InputProps={inputProps.inputProps ? { inputProps: inputProps.inputProps } : undefined}
      {...rest}
    />
  );
}
