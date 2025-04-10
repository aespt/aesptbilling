'use client';

import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, TextField } from '@mui/material';

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
  placeholder,
}: EntitySelectorProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <Autocomplete
        options={options}
        getOptionLabel={getOptionLabel}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            error={error}
            helperText={helperText}
            fullWidth
            placeholder={placeholder}
          />
        )}
        className="grow"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onAddClick}
        className="flex h-[56px] min-w-[56px] items-center justify-center rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
        disabled={disabled}
      >
        <AddIcon />
      </button>
    </div>
  );
}
