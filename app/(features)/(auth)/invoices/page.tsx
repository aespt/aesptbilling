'use client';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Drawer,
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
  IconButton,
  Button,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type * as DayJS from 'dayjs';
import { useRouter } from 'next/navigation';
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
  invoice_stage: 'SALE' | 'PROFORMA' | 'QUOTATION';
  tax_rate: string;
  payment: {
    payment_method: string;
  };
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
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
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

  const router = useRouter();

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

        // Apply filter based on the active tab
        if (activeTab === 0) {
          // QUOTATION tab
          params.append('invoiceStageFilter', 'QUOTATION');
        } else if (activeTab === 1) {
          // PROFORMA tab
          params.append('invoiceStageFilter', 'PROFORMA');
        } else {
          // SALES tab
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
    // fetchInvoices(); // This is redundant as changing activeTab will trigger the useEffect with fetchInvoices
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

    setFilterPanelOpen(false);
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

  const handleGenerateDocument = (documentType: string, invoiceId?: number) => {
    if (!selectedInvoice) {
      return;
    }

    // Use the provided invoiceId or fall back to selectedInvoice.id
    const id = invoiceId || selectedInvoice.id;
    if (documentType === '') {
      window.open(`/invoices/pdf/${id}`, '_blank');
    } else {
      window.open(`/invoices/pdf/${id}?invoiceStage=${documentType}`, '_blank');
    }

    handleActionClose();
  };

  const handleSaleUpdate = (invoiceId?: number) => {
    router.push(`/invoices/create?id=${invoiceId}`);
  };

  const handleExportExcel = async () => {
    try {
      // Construct the same filter parameters as used in the current view
      const params = new URLSearchParams();

      // Add filter based on date range if provided
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom.format('YYYY-MM-DD'));
      }

      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo.format('YYYY-MM-DD'));
      }

      // Add invoice number filter if provided
      if (filters.invoiceNumber) {
        params.append('invoiceNumber', filters.invoiceNumber);
      }

      // Add sales person filter if provided
      if (filters.salesPerson) {
        params.append('salesPerson', filters.salesPerson.id.toString());
      }

      // Add customer filter if provided
      if (filters.customer) {
        params.append('customer_id', filters.customer.id.toString());
      }

      // Create a Blob from the response and trigger a download
      const response = await fetch(`/api/invoices/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export invoices');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error exporting invoices:', error);
      // You could add a toast notification here to inform the user
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="px-4 pb-6 pt-16 md:ml-[280px] md:px-6">
        <style>{tableRowAnimation}</style>
        <Box className="mb-6 flex items-center justify-between">
          <Typography variant="h4" component="h1" className="text-2xl font-bold text-gray-800">
            Sales History
          </Typography>
          <div className="flex items-center gap-2">
            {activeTab === 2 && ( // Only show Export button on Sales tab
              <Button
                startIcon={<FileDownloadIcon />}
                variant="contained"
                color="primary"
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700"
              >
                Export Excel
              </Button>
            )}
            <IconButton
              onClick={() => setFilterPanelOpen(true)}
              color="primary"
              className="bg-blue-50 hover:bg-blue-100"
              size="medium"
            >
              <FilterAltIcon />
            </IconButton>
          </div>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="invoice tabs"
            variant="fullWidth"
          >
            <Tab label="Quotation" />
            <Tab label="Proforma" />
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
                    {activeTab === 2 && <TableCell className="font-medium">MOP</TableCell>}
                    <TableCell className="font-medium">Ship From</TableCell>
                    <TableCell className="font-medium">Ship To</TableCell>
                    {activeTab === 2 && <TableCell className="font-medium">TAX</TableCell>}
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
                        {activeTab === 2 && (
                          <TableCell>{invoice.payment?.payment_method}</TableCell>
                        )}
                        <TableCell>{invoice.ship_from}</TableCell>
                        <TableCell>{invoice.ship_to}</TableCell>
                        {activeTab === 2 && <TableCell>{invoice.tax_rate}</TableCell>}
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
          {activeTab === 2
            ? // Actions for Sales tab
              [
                <MenuItem
                  key="delivery"
                  onClick={() => handleGenerateDocument('DELIVERY', selectedInvoice?.id)}
                >
                  <ListItemIcon>
                    <LocalShippingIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Generate Delivery Note</ListItemText>
                </MenuItem>,
                <MenuItem onClick={() => handleGenerateDocument('QUOTATION', selectedInvoice?.id)}>
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download Quotation</ListItemText>
                </MenuItem>,
                <MenuItem onClick={() => handleGenerateDocument('PROFORMA', selectedInvoice?.id)}>
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download Proforma</ListItemText>
                </MenuItem>,
                <MenuItem onClick={() => handleGenerateDocument('SALE', selectedInvoice?.id)}>
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download Invoice</ListItemText>
                </MenuItem>,
              ]
            : activeTab === 0
              ? // Actions for Quotation tab
                [
                  <MenuItem key="sale" onClick={() => handleSaleUpdate(selectedInvoice?.id)}>
                    <ListItemIcon>
                      <ReceiptIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Update Sale</ListItemText>
                  </MenuItem>,
                  <MenuItem
                    key="download"
                    onClick={() => handleGenerateDocument('QUOTATION', selectedInvoice?.id)}
                  >
                    <ListItemIcon>
                      <FileDownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download Quotation</ListItemText>
                  </MenuItem>,
                ]
              : // Actions for Proforma tab
                [
                  <MenuItem key="update" onClick={() => handleSaleUpdate(selectedInvoice?.id)}>
                    <ListItemIcon>
                      <ReceiptIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Update Sale</ListItemText>
                  </MenuItem>,
                  <MenuItem
                    key="download-quotation"
                    onClick={() => handleGenerateDocument('QUOTATION', selectedInvoice?.id)}
                  >
                    <ListItemIcon>
                      <FileDownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download Quotation</ListItemText>
                  </MenuItem>,
                  <MenuItem
                    key="download-proforma"
                    onClick={() => handleGenerateDocument('PROFORMA', selectedInvoice?.id)}
                  >
                    <ListItemIcon>
                      <FileDownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download Proforma</ListItemText>
                  </MenuItem>,
                ]}
        </Menu>
        <Sidepanel isOpen={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} size="small">
          <InvoiceFilters
            tempFilters={tempFilters}
            handleFilterChange={handleFilterChange}
            handleApplyFilters={handleApplyFilters}
            handleResetFilters={handleResetFilters}
            customers={customers}
            salesmen={salesmen}
            loadingDropdowns={loadingDropdowns}
          />
        </Sidepanel>
      </div>
    </LocalizationProvider>
  );
}
