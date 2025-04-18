'use client';

import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type * as DayJS from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Pagination from '@/app/shared/components/pagination';
import type { PaginationInfo } from '@/app/shared/components/pagination';
import PrimaryButton from '@/app/shared/components/primary-button';

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
  invoice_stage: 'SALE' | 'PROFORMA' | 'QUOTATION';
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
  invoiceStage: string | null;
}

export default function InvoicesListPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: null,
    dateTo: null,
    invoiceNumber: '',
    salesPerson: null,
    customer: null,
    invoiceType: null,
    invoiceStage: null,
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    dateFrom: null,
    dateTo: null,
    invoiceNumber: '',
    salesPerson: null,
    customer: null,
    invoiceType: null,
    invoiceStage: null,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Define invoice type options
  const invoiceTypeOptions = ['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION'];
  const invoiceStageOptions = ['SALE', 'PROFORMA', 'QUOTATION'];

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

    if (filterDrawerOpen) {
      setTempFilters(filters);
      fetchDropdownData();
    }
  }, [filterDrawerOpen]);

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

        // Always add invoice stage filter based on active tab
        if (activeTab === 0) {
          // For Proforma & Quotation tab, we want both PROFORMA and QUOTATION
          // We'll handle this filtering on the client since the API doesn't support multiple values
          params.append('invoiceStageFilter', 'PROFORMA,QUOTATION');
        } else {
          // For Sales tab, we only want SALE
          params.append('invoiceStageFilter', 'SALE');
        }

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

        // Add invoice stage filter if set by the user (this will override the tab-based filter)
        if (filtersToUse.invoiceStage) {
          params.append('invoiceStage', filtersToUse.invoiceStage);
        }

        const response = await fetch(`/api/invoices?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }

        const data = await response.json();

        // Set filtered invoices directly from the API response
        setFilteredInvoices(data.invoices);

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
    [pagination.currentPage, pagination.pageSize, sort, filters, activeTab]
  );

  // Load invoices on initial page load and when filters change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Update the tab change handler to refetch with the new tab
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Fetch invoices whenever the tab changes to update the filtered data
    fetchInvoices();
  };

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

    setFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      dateFrom: null,
      dateTo: null,
      invoiceNumber: '',
      salesPerson: null,
      customer: null,
      invoiceType: null,
      invoiceStage: null,
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

    setFilterDrawerOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleInvoiceClick = (invoiceId: number) => {
    window.open(`/invoices/pdf/${invoiceId}`, '_blank');
  };

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, invoice: Invoice) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedInvoice(null);
  };

  const handleGenerateDocument = (documentType: string) => {
    if (!selectedInvoice) {
      return;
    }

    // Here you would implement the logic to generate different document types
    console.log(`Generating ${documentType} for invoice: ${selectedInvoice.id}`);

    // Example: This would be replaced with actual API calls
    window.open(`/invoices/${documentType.toLowerCase()}/${selectedInvoice.id}`, '_blank');

    handleActionClose();
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
            onClick={() => setFilterDrawerOpen(true)}
            color="primary"
            className="bg-blue-50 hover:bg-blue-100"
            size="medium"
          >
            <FilterAltIcon />
          </IconButton>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="invoice tabs"
            variant="fullWidth"
          >
            <Tab label="Proforma & Quotation" />
            <Tab label="Sales" />
          </Tabs>
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
                    <TableCell align="center" className="font-medium">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice, index) => (
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
                        <TableCell>{invoice.ship_from}</TableCell>
                        <TableCell>{invoice.ship_to}</TableCell>
                        <TableCell align="right" className="font-bold">
                          {parseFloat(invoice.total).toFixed(2)} AED
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={e => handleActionClick(e, invoice)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-gray-500">
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

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionClose}
        >
          {activeTab === 1 ? (
            // Actions for Sales tab
            [
              <MenuItem key="sale" onClick={() => handleGenerateDocument('SALE')}>
                <ListItemIcon>
                  <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Generate Sale</ListItemText>
              </MenuItem>,
              <MenuItem key="delivery" onClick={() => handleGenerateDocument('DELIVERY')}>
                <ListItemIcon>
                  <LocalShippingIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Generate Delivery Note</ListItemText>
              </MenuItem>,
              <MenuItem key="proforma" onClick={() => handleGenerateDocument('PROFORMA')}>
                <ListItemIcon>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Generate Proforma</ListItemText>
              </MenuItem>,
              <MenuItem key="quotation" onClick={() => handleGenerateDocument('QUOTATION')}>
                <ListItemIcon>
                  <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Generate Quotation</ListItemText>
              </MenuItem>,
            ]
          ) : selectedInvoice?.invoice_stage === 'QUOTATION' ? (
            // Actions for Quotation
            [
              <MenuItem key="sale" onClick={() => handleGenerateDocument('SALE')}>
                <ListItemIcon>
                  <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Generate Sale</ListItemText>
              </MenuItem>,
              <MenuItem key="proforma" onClick={() => handleGenerateDocument('PROFORMA')}>
                <ListItemIcon>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Generate Proforma</ListItemText>
              </MenuItem>,
            ]
          ) : (
            // For PROFORMA - single item
            <MenuItem onClick={() => handleGenerateDocument('SALE')}>
              <ListItemIcon>
                <ReceiptIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Generate Sale</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Enhanced Filter Drawer */}
        <Drawer anchor="right" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
          <Box className="w-[400px] p-6">
            <Typography variant="h6" className="mb-6 font-semibold">
              Filter Invoices
            </Typography>

            <div className="space-y-6">
              {/* Date From Filter */}
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Date From
                </Typography>
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
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Date To
                </Typography>
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
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Invoice Number
                </Typography>
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
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Sales Person
                </Typography>
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
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Customer
                </Typography>
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
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Invoice Type
                </Typography>
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
              </div>

              {/* Invoice Stage Filter - Dropdown */}
              <div>
                <Typography variant="subtitle2" className="mb-2 text-gray-600">
                  Invoice Stage
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  className="rounded bg-white"
                  value={tempFilters.invoiceStage || ''}
                  onChange={e => handleFilterChange('invoiceStage', e.target.value || null)}
                  placeholder="Select invoice stage"
                >
                  <MenuItem value="">All Stages</MenuItem>
                  {invoiceStageOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <PrimaryButton label="Apply Filters" onClick={handleApplyFilters} />

                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  className="mt-2 w-full normal-case"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Box>
        </Drawer>
      </div>
    </LocalizationProvider>
  );
}
