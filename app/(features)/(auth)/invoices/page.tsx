'use client';

import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type * as DayJS from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Pagination from '@/app/shared/components/pagination';
import type { PaginationInfo } from '@/app/shared/components/pagination';
import PrimaryButton from '@/app/shared/components/primary-button';
import Sidepanel from '@/app/shared/components/sidepanel';
import InvoiceFilters from '@/app/(features)/(auth)/invoices/components/invoice-filters';

// Add custom CSS for animations
const tableRowAnimation = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

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

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  salesman_id: number;
  ship_from: string;
  ship_to: string;
  invoice_type: string;
  customer: {
    id: number;
    name: string;
    address: string;
  };
  salesman: {
    id: number;
    name: string;
    contact_number: string;
  };
  total: string;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterOptions {
  dateFrom: DayJS.Dayjs | null;
  dateTo: DayJS.Dayjs | null;
  invoiceNumber: string;
  salesPerson: Salesman | null;
  customer: Customer | null;
  invoiceType: string | null;
}

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [sort, setSort] = useState<SortConfig>({
    field: 'invoice_date',
    direction: 'desc',
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: null,
    dateTo: null,
    invoiceNumber: '',
    salesPerson: null,
    customer: null,
    invoiceType: null,
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    dateFrom: null,
    dateTo: null,
    invoiceNumber: '',
    salesPerson: null,
    customer: null,
    invoiceType: null,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Define invoice type options
  const invoiceTypeOptions = ['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION'];

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        // Fetch customers
        const customersResponse = await fetch('/api/dropdown/customers');
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(customersData.customers || []);
        }

        // Fetch salesmen
        const salesmenResponse = await fetch('/api/dropdown/salesmen');
        if (salesmenResponse.ok) {
          const salesmenData = await salesmenResponse.json();
          setSalesmen(salesmenData.salesmen || []);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    if (filterPanelOpen) {
      setTempFilters(filters);
      fetchDropdownData();
    }
  }, [filterPanelOpen]);

  const fetchInvoices = useCallback(
    async (overrideFilters?: FilterOptions) => {
      setLoading(true);

      // Use override filters if provided, otherwise use state filters
      const filtersToUse = overrideFilters || filters;

      try {
        // Build query parameters with null checks and default values
        const params = new URLSearchParams({
          page: (pagination?.currentPage ?? 1).toString(),
          limit: (pagination?.pageSize ?? 10).toString(),
          sortField: sort.field,
          sortOrder: sort.direction,
        });

        // Add date filters if set
        if (filtersToUse.dateFrom) {
          params.append('dateFrom', filtersToUse.dateFrom.format('YYYY-MM-DD'));
        }

        if (filtersToUse.dateTo) {
          params.append('dateTo', filtersToUse.dateTo.format('YYYY-MM-DD'));
        }

        // Add text filters if set
        if (filtersToUse.invoiceNumber.trim()) {
          params.append('invoiceNumber', filtersToUse.invoiceNumber.trim());
        }

        // Add salesPerson filter if set
        if (filtersToUse.salesPerson) {
          params.append('salesPerson', filtersToUse.salesPerson.name);
        }

        // Add customer filter if set
        if (filtersToUse.customer) {
          params.append('customer', filtersToUse.customer.name);
        }

        // Add invoice type filter if set
        if (filtersToUse.invoiceType) {
          params.append('invoiceType', filtersToUse.invoiceType);
        }

        const response = await fetch(`/api/invoices?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }

        const data = await response.json();
        setInvoices(data.invoices);
        // Ensure pagination data has all required fields
        setPagination({
          total: data.pagination.total ?? 0,
          totalPages: data.pagination.totalPages ?? 1,
          currentPage: data.pagination.currentPage ?? 1,
          pageSize: data.pagination.pageSize ?? 10,
          hasNext: data.pagination.hasNext ?? false,
          hasPrev: data.pagination.hasPrev ?? false,
        });
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.currentPage, pagination.pageSize, sort, filters]
  );

  // Load invoices on initial page load and when filters change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      pageSize: newPageSize,
    }));
  };

  const handleSortChange = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: Customer | Salesman | DayJS.Dayjs | string | null
  ) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when applying new filters
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));

    // First fetch with the temp filters directly
    fetchInvoices(tempFilters);

    // Then update the state filters
    setFilters(tempFilters);

    setFilterPanelOpen(false);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      dateFrom: null,
      dateTo: null,
      invoiceNumber: '',
      salesPerson: null,
      customer: null,
      invoiceType: null,
    };

    setTempFilters(emptyFilters);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));

    // First fetch with empty filters
    fetchInvoices(emptyFilters);

    // Then update the state
    setFilters(emptyFilters);

    setFilterPanelOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleInvoiceClick = (invoiceId: number) => {
    window.open(`/invoices/pdf/${invoiceId}`, '_blank');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="px-4 pb-6 pt-16 md:ml-[280px] md:px-6">
        <style>{tableRowAnimation}</style>
        <Box className="mb-6 flex items-center justify-between">
          <Typography variant="h4" component="h1" className="text-2xl font-bold text-gray-800">
            Sales History
          </Typography>
          <IconButton
            onClick={() => setFilterPanelOpen(true)}
            color="primary"
            className="bg-blue-50 hover:bg-blue-100"
            size="medium"
          >
            <FilterAltIcon />
          </IconButton>
        </Box>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-12 animate-spin rounded-full border-4 border-b-red-500 border-l-blue-300 border-r-red-300 border-t-blue-500" />
          </div>
        ) : (
          <Paper
            elevation={2}
            className="overflow-hidden rounded-lg border border-gray-100 shadow-md"
          >
            <TableContainer>
              <Table>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="font-medium">
                      <TableSortLabel
                        active={sort.field === 'invoice_date'}
                        direction={sort.field === 'invoice_date' ? sort.direction : 'asc'}
                        onClick={() => handleSortChange('invoice_date')}
                      >
                        Invoice Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell className="font-medium">
                      <TableSortLabel
                        active={sort.field === 'invoice_number'}
                        direction={sort.field === 'invoice_number' ? sort.direction : 'asc'}
                        onClick={() => handleSortChange('invoice_number')}
                      >
                        Invoice Number
                      </TableSortLabel>
                    </TableCell>
                    <TableCell className="font-medium">
                      <TableSortLabel
                        active={sort.field === 'salesperson_name'}
                        direction={sort.field === 'salesperson_name' ? sort.direction : 'asc'}
                        onClick={() => handleSortChange('salesperson_name')}
                      >
                        Sales Person
                      </TableSortLabel>
                    </TableCell>
                    <TableCell className="font-medium">Customer</TableCell>
                    <TableCell className="font-medium">
                      <TableSortLabel
                        active={sort.field === 'invoice_type'}
                        direction={sort.field === 'invoice_type' ? sort.direction : 'asc'}
                        onClick={() => handleSortChange('invoice_type')}
                      >
                        Invoice Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell className="font-medium">Ship From</TableCell>
                    <TableCell className="font-medium">Ship To</TableCell>
                    <TableCell align="right" className="font-medium">
                      <TableSortLabel
                        active={sort.field === 'total'}
                        direction={sort.field === 'total' ? sort.direction : 'asc'}
                        onClick={() => handleSortChange('total')}
                      >
                        Total
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice, index) => (
                      <TableRow
                        key={invoice.id}
                        hover
                        className="transition-all duration-150 hover:bg-gray-50"
                        style={{
                          animationDelay: `${index * 30}ms`,
                          animation: 'fadeIn 0.5s ease-in-out forwards',
                        }}
                      >
                        <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                        <TableCell
                          className="cursor-pointer font-medium text-blue-600"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{invoice.salesman.name}</TableCell>
                        <TableCell>{invoice.customer.name}</TableCell>
                        <TableCell className="capitalize">{invoice.invoice_type}</TableCell>
                        <TableCell>{invoice.ship_from}</TableCell>
                        <TableCell>{invoice.ship_to}</TableCell>
                        <TableCell align="right" className="font-bold">
                          {parseFloat(invoice.total).toFixed(2)} AED
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                        No invoices found. Please try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination
              paginationInfo={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handleRowsPerPageChange}
              pageSizeOptions={[5, 10, 25, 50]}
              itemName="invoices"
            />
          </Paper>
        )}

        {/* Sidepanel with InvoiceFilters */}
        <Sidepanel isOpen={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} size="small">
          <InvoiceFilters 
            tempFilters={tempFilters}
            handleFilterChange={handleFilterChange}
            handleApplyFilters={handleApplyFilters}
            handleResetFilters={handleResetFilters}
            customers={customers}
            salesmen={salesmen}
            loadingDropdowns={loadingDropdowns}
            invoiceTypeOptions={invoiceTypeOptions}
          />
        </Sidepanel>
      </div>
    </LocalizationProvider>
  );
}
