'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  Autocomplete,
  MenuItem,
  Button,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type * as DayJS from 'dayjs';

import PrimaryButton from '@/app/shared/components/primary-button';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Salesman {
  id: number;
  name: string;
  contact_number: string;
}

interface FilterOptions {
  dateFrom: DayJS.Dayjs | null;
  dateTo: DayJS.Dayjs | null;
  invoiceNumber: string;
  salesPerson: Salesman | null;
  customer: Customer | null;
  invoiceType: string | null;
}

interface InvoiceFiltersProps {
  tempFilters: FilterOptions;
  handleFilterChange: (
    key: keyof FilterOptions,
    value: Customer | Salesman | DayJS.Dayjs | string | null
  ) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  customers: Customer[];
  salesmen: Salesman[];
  loadingDropdowns: boolean;
}

export default function InvoiceFilters({
  tempFilters,
  handleFilterChange,
  handleApplyFilters,
  handleResetFilters,
  customers,
  salesmen,
  loadingDropdowns,
}: InvoiceFiltersProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="flex h-full flex-col">
        {/* Content wrapper */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-black/70">Filter Invoices</h1>
          </div>

          {/* Filter fields */}
          <div className="space-y-6 p-6">
            {/* Date From Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Date From</label>
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
              <label className="text-sm font-medium text-gray-700">Date To</label>
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

            {/* Invoice Number Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Invoice Number</label>
              <TextField
                fullWidth
                size="small"
                value={tempFilters.invoiceNumber}
                onChange={e => handleFilterChange('invoiceNumber', e.target.value)}
                placeholder="Search by invoice number"
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

            {/* Sales Person Filter - Autocomplete */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Sales Person</label>
              <Autocomplete
                options={salesmen}
                loading={loadingDropdowns}
                getOptionLabel={option => option.name}
                value={tempFilters.salesPerson}
                onChange={(_, newValue) => handleFilterChange('salesPerson', newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Select a sales person"
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

            {/* Customer Filter - Autocomplete */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <Autocomplete
                options={customers}
                loading={loadingDropdowns}
                getOptionLabel={option => option.name}
                value={tempFilters.customer}
                onChange={(_, newValue) => handleFilterChange('customer', newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Select a customer"
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

            {/* Invoice Type Filter - Dropdown */}
            {/* <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Invoice Type</label>
              <TextField
                select
                fullWidth
                size="small"
                className="rounded bg-white"
                value={tempFilters.invoiceType || ''}
                onChange={e => handleFilterChange('invoiceType', e.target.value || null)}
                placeholder="Select invoice type"
              >
                <MenuItem value="">All Types</MenuItem>
                {invoiceTypeOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </div> */}
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