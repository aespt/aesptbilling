'use client';

import { Autocomplete, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface EntitySelectorProps<T> {
  options: T[];
  getOptionLabel: (option: T) => string;
  value: T | null;
  onChange: (value: T | null) => void;
  onAddClick: () => void;
  label: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function EntitySelector<T>({
  options,
  getOptionLabel,
  value,
  onChange,
  onAddClick,
  label,
  error = false,
  helperText,
  disabled = false,
  placeholder
}: EntitySelectorProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <Autocomplete
        options={options}
        getOptionLabel={getOptionLabel}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={error}
            helperText={helperText}
            fullWidth
            placeholder={placeholder}
          />
        )}
        className="flex-grow"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onAddClick}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md h-[56px] min-w-[56px] flex items-center justify-center"
        disabled={disabled}
      >
        <AddIcon />
      </button>
    </div>
  );
} 