'use client';

import SearchIcon from '@mui/icons-material/Search';
import { TextField, InputAdornment, Autocomplete } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type * as DayJS from 'dayjs';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface FilterOptions {
  dateFrom: DayJS.Dayjs | null;
  dateTo: DayJS.Dayjs | null;
  purchaseEntryNumber: string;
  supplier: Supplier | null;
  purchaseType: string | null;
}

interface PurchaseEntryFiltersProps {
  tempFilters: FilterOptions;
  handleFilterChange: (
    key: keyof FilterOptions,
    value: Supplier | DayJS.Dayjs | string | null
  ) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  suppliers: Supplier[];
  loadingDropdowns: boolean;
  purchaseTypeOptions: string[];
}

export default function PurchaseEntryFilters({
  tempFilters,
  handleFilterChange,
  handleApplyFilters,
  handleResetFilters,
  suppliers,
  loadingDropdowns,
  purchaseTypeOptions,
}: PurchaseEntryFiltersProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="flex h-full flex-col">
        {/* Content wrapper */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-black/70">Filter Purchase Entries</h1>
          </div>

          {/* Filter fields */}
          <div className="space-y-6 p-6">
            {/* Date From Filter */}
            <div className="space-y-1">
              <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">
                Date From
              </label>
              <DatePicker
                value={tempFilters.dateFrom}
                onChange={newValue => handleFilterChange('dateFrom', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    className: 'bg-white rounded',
                  },
                }}
              />
            </div>

            {/* Date To Filter */}
            <div className="space-y-1">
              <label htmlFor="dateTo" className="text-sm font-medium text-gray-700">
                Date To
              </label>
              <DatePicker
                value={tempFilters.dateTo}
                onChange={newValue => handleFilterChange('dateTo', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    className: 'bg-white rounded',
                  },
                }}
              />
            </div>

            {/* Purchase Entry Number Filter */}
            <div className="space-y-1">
              <label htmlFor="purchaseEntryNumber" className="text-sm font-medium text-gray-700">
                Purchase Entry Number
              </label>
              <TextField
                fullWidth
                size="small"
                value={tempFilters.purchaseEntryNumber}
                onChange={e => handleFilterChange('purchaseEntryNumber', e.target.value)}
                placeholder="Search by purchase entry number"
                className="rounded bg-white"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            {/* Supplier Filter - Autocomplete */}
            <div className="space-y-1">
              <label htmlFor="supplier" className="text-sm font-medium text-gray-700">
                Supplier
              </label>
              <Autocomplete
                options={suppliers}
                loading={loadingDropdowns}
                getOptionLabel={option => option.name}
                value={tempFilters.supplier}
                onChange={(_, newValue) => handleFilterChange('supplier', newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Select a supplier"
                    size="small"
                    className="rounded bg-white"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" className="text-gray-400" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </div>

            {/* Purchase Type Filter */}
            <div className="space-y-1">
              <label htmlFor="purchaseType" className="text-sm font-medium text-gray-700">
                Purchase Type
              </label>
              <Autocomplete
                options={purchaseTypeOptions}
                value={tempFilters.purchaseType}
                onChange={(_, newValue) => handleFilterChange('purchaseType', newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Select purchase type"
                    size="small"
                    className="rounded bg-white"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Buttons - Fixed at bottom */}
        <div className="sticky bottom-0 mt-auto border-t bg-white p-6">
          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-md border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
            <button
              type="button"
              className="flex-1 cursor-pointer overflow-hidden rounded-md bg-gradient-to-r from-red-500 to-blue-500 px-4 py-2.5 text-white transition-all duration-300 hover:scale-105"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}
