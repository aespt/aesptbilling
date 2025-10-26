'use client';

import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Drawer,
  IconButton,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import type * as DayJS from 'dayjs';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import Pagination from '@/app/shared/components/pagination';
import type { PaginationInfo } from '@/app/shared/components/pagination';
import PrimaryButton from '@/app/shared/components/primary-button';
import SecondaryButton from '@/app/shared/components/secondary-button';

import PurchaseEntryFilters from '../purchase-entries/components/purchase-entry-filters';

import PurchaseFilters from './components/purchase-filters';

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

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Purchase {
  id: number;
  purchase_number: string;
  purchase_date: string;
  ship_from: string;
  purchase_type: string;
  supplier: {
    id: number;
    name: string;
    address: string;
  };
  total: string;
}

interface PurchaseEntry {
  id: number;
  purchaseentry_number: string;
  purchaseentry_date: string;
  ship_from: string;
  purchase_type: string;
  supplier: {
    id: number;
    name: string;
    address: string;
  };
  sub_total: string;
  tax_amount: string;
  discount: string;
  total: string;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterOptions {
  dateFrom: DayJS.Dayjs | null;
  dateTo: DayJS.Dayjs | null;
  purchaseNumber: string;
  supplier: Supplier | null;
  purchaseType: string | null;
}

interface PurchaseEntryFilterOptions {
  dateFrom: DayJS.Dayjs | null;
  dateTo: DayJS.Dayjs | null;
  purchaseEntryNumber: string;
  supplier: Supplier | null;
  purchaseType: string | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PurchasesListPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Purchases state
  const [purchases, setPurchases] = useState<Purchase[]>([]);
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
    field: 'purchase_date',
    direction: 'desc',
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: null,
    dateTo: null,
    purchaseNumber: '',
    supplier: null,
    purchaseType: null,
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    dateFrom: null,
    dateTo: null,
    purchaseNumber: '',
    supplier: null,
    purchaseType: null,
  });

  // Purchase Entries state
  const [purchaseEntries, setPurchaseEntries] = useState<PurchaseEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [entriesPagination, setEntriesPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [entriesSort, setEntriesSort] = useState<SortConfig>({
    field: 'purchaseentry_date',
    direction: 'desc',
  });
  const [entriesFilterDrawerOpen, setEntriesFilterDrawerOpen] = useState(false);
  const [entriesFilters, setEntriesFilters] = useState<PurchaseEntryFilterOptions>({
    dateFrom: null,
    dateTo: null,
    purchaseEntryNumber: '',
    supplier: null,
    purchaseType: null,
  });
  const [entriesTempFilters, setEntriesTempFilters] = useState<PurchaseEntryFilterOptions>({
    dateFrom: null,
    dateTo: null,
    purchaseEntryNumber: '',
    supplier: null,
    purchaseType: null,
  });

  // Shared state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [exportingEntries, setExportingEntries] = useState(false);

  // Define purchase type options
  const purchaseTypeOptions = ['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION'];

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      fetchPurchases();
    } else {
      fetchPurchaseEntries();
    }
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        // Fetch suppliers
        const suppliersResponse = await fetch('/api/dropdown/suppliers');
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          setSuppliers(suppliersData.suppliers || []);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    if (filterDrawerOpen || entriesFilterDrawerOpen) {
      if (filterDrawerOpen) {
        setTempFilters(filters);
      }
      if (entriesFilterDrawerOpen) {
        setEntriesTempFilters(entriesFilters);
      }
      fetchDropdownData();
    }
  }, [filterDrawerOpen, entriesFilterDrawerOpen, filters, entriesFilters]);

  // Purchases fetch
  const fetchPurchases = useCallback(
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
        if (filtersToUse.purchaseNumber.trim()) {
          params.append('purchaseNumber', filtersToUse.purchaseNumber.trim());
        }

        // Add supplier filter if set
        if (filtersToUse.supplier) {
          params.append('supplier', filtersToUse.supplier.name);
        }

        // Add purchase type filter if set
        if (filtersToUse.purchaseType) {
          params.append('purchaseType', filtersToUse.purchaseType);
        }

        const response = await fetch(`/api/purchases?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch purchases');
        }

        const data = await response.json();
        setPurchases(data.purchases);
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
        console.error('Error fetching purchases:', error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.currentPage, pagination.pageSize, sort, filters]
  );

  // Purchase Entries fetch
  const fetchPurchaseEntries = useCallback(
    async (overrideFilters?: PurchaseEntryFilterOptions) => {
      setLoadingEntries(true);

      // Use override filters if provided, otherwise use state filters
      const filtersToUse = overrideFilters || entriesFilters;

      try {
        // Build query parameters with null checks and default values
        const params = new URLSearchParams({
          page: (entriesPagination?.currentPage ?? 1).toString(),
          limit: (entriesPagination?.pageSize ?? 10).toString(),
          sortField: entriesSort.field,
          sortOrder: entriesSort.direction,
        });

        // Add date filters if set
        if (filtersToUse.dateFrom) {
          params.append('dateFrom', filtersToUse.dateFrom.format('YYYY-MM-DD'));
        }

        if (filtersToUse.dateTo) {
          params.append('dateTo', filtersToUse.dateTo.format('YYYY-MM-DD'));
        }

        // Add text filters if set
        if (filtersToUse.purchaseEntryNumber.trim()) {
          params.append('purchaseEntryNumber', filtersToUse.purchaseEntryNumber.trim());
        }

        // Add supplier filter if set
        if (filtersToUse.supplier) {
          params.append('supplier', filtersToUse.supplier.name);
        }

        // Add purchase type filter if set
        if (filtersToUse.purchaseType) {
          params.append('purchaseType', filtersToUse.purchaseType);
        }

        const response = await fetch(`/api/purchase-entries?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch purchase entries');
        }

        const data = await response.json();
        setPurchaseEntries(data.purchaseEntries);
        // Ensure pagination data has all required fields
        setEntriesPagination({
          total: data.pagination.total ?? 0,
          totalPages: data.pagination.totalPages ?? 1,
          currentPage: data.pagination.page ?? 1,
          pageSize: data.pagination.pageSize ?? 10,
          hasNext: data.pagination.hasNext ?? false,
          hasPrev: data.pagination.hasPrev ?? false,
        });
      } catch (error) {
        console.error('Error fetching purchase entries:', error);
      } finally {
        setLoadingEntries(false);
      }
    },
    [entriesPagination.currentPage, entriesPagination.pageSize, entriesSort, entriesFilters]
  );

  // Load purchases on initial page load and when filters change
  useEffect(() => {
    if (activeTab === 0) {
      fetchPurchases();
    }
  }, [activeTab, fetchPurchases]);

  // Load purchase entries when tab is active and when filters change
  useEffect(() => {
    if (activeTab === 1) {
      fetchPurchaseEntries();
    }
  }, [activeTab, fetchPurchaseEntries]);

  // Purchases handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: 1, // Reset to first page when changing page size
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
    value: Supplier | DayJS.Dayjs | string | null
  ) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFilterDrawerOpen(false);
    setPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when applying filters
    }));
  };

  const handleResetFilters = () => {
    const resetFilters = {
      dateFrom: null,
      dateTo: null,
      purchaseNumber: '',
      supplier: null,
      purchaseType: null,
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setFilterDrawerOpen(false);
    setPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when clearing filters
    }));
  };

  // Purchase Entries handlers
  const handleEntriesPageChange = (newPage: number) => {
    setEntriesPagination(prev => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  const handleEntriesRowsPerPageChange = (newPageSize: number) => {
    setEntriesPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: 1, // Reset to first page when changing page size
    }));
  };

  const handleEntriesSortChange = (field: string) => {
    setEntriesSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleEntriesFilterChange = (
    key: keyof PurchaseEntryFilterOptions,
    value: Supplier | DayJS.Dayjs | string | null
  ) => {
    setEntriesTempFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEntriesApplyFilters = () => {
    setEntriesFilters(entriesTempFilters);
    setEntriesFilterDrawerOpen(false);
    setEntriesPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when applying filters
    }));
  };

  const handleEntriesResetFilters = () => {
    const resetFilters = {
      dateFrom: null,
      dateTo: null,
      purchaseEntryNumber: '',
      supplier: null,
      purchaseType: null,
    };
    setEntriesTempFilters(resetFilters);
    setEntriesFilters(resetFilters);
    setEntriesFilterDrawerOpen(false);
    setEntriesPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when clearing filters
    }));
  };

  const handleExportEntries = async () => {
    try {
      setExportingEntries(true);

      // Construct filter parameters as used in the current view
      const params = new URLSearchParams();

      // Add date filters if set
      if (entriesFilters.dateFrom) {
        params.append('dateFrom', entriesFilters.dateFrom.format('YYYY-MM-DD'));
      }

      if (entriesFilters.dateTo) {
        params.append('dateTo', entriesFilters.dateTo.format('YYYY-MM-DD'));
      }

      // Add text filters if set
      if (entriesFilters.purchaseEntryNumber.trim()) {
        params.append('purchaseEntryNumber', entriesFilters.purchaseEntryNumber.trim());
      }

      // Add supplier filter if set
      if (entriesFilters.supplier) {
        params.append('supplier', entriesFilters.supplier.name);
      }

      // Add purchase type filter if set
      if (entriesFilters.purchaseType) {
        params.append('purchaseType', entriesFilters.purchaseType);
      }

      // Add export flag to skip pagination
      params.append('export', 'true');

      const response = await fetch(`/api/purchase-entries/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export purchase entries');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase_entries_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error exporting purchase entries:', error);
    } finally {
      setExportingEntries(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePurchaseEntryClick = (purchaseEntryId: number) => {
    window.location.href = `/purchase-entries/${purchaseEntryId}`;
  };

  const handlePurchaseEntryDownload = (purchaseEntryId: number) => {
    window.open(`/purchases/pdf/${purchaseEntryId}`, '_blank');
  };

  return (
    <div className="mt-16 px-4 py-2 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <style>{tableRowAnimation}</style>
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold text-gray-800">Purchases & Entries</h1>
          <div className="flex flex-col gap-3 sm:flex-row">
            <IconButton
              onClick={() =>
                activeTab === 0 ? setFilterDrawerOpen(true) : setEntriesFilterDrawerOpen(true)
              }
              aria-label="filter"
              color="primary"
              className="bg-blue-50 hover:bg-blue-100"
            >
              <FilterAltIcon />
            </IconButton>
            {activeTab === 1 && (
              <SecondaryButton
                onClick={handleExportEntries}
                label={exportingEntries ? 'Exporting...' : 'Export'}
                disabled={exportingEntries}
                startIcon={
                  exportingEntries && (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  )
                }
              />
            )}
            <Link href={activeTab === 0 ? '/purchases/create' : '/purchase-entries/create'}>
              <PrimaryButton label={activeTab === 0 ? '+ New Purchase' : '+ New Purchase Entry'} />
            </Link>
          </div>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="purchase tabs"
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Purchases" id="purchases-tab" aria-controls="purchases-panel" />
            <Tab
              label="Purchase Entries"
              id="purchase-entries-tab"
              aria-controls="purchase-entries-panel"
            />
          </Tabs>
        </Box>

        {/* Purchases Tab Panel */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper} className="border border-gray-200 shadow-md">
            <Table>
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sort.field === 'purchase_number'}
                      direction={sort.field === 'purchase_number' ? sort.direction : 'asc'}
                      onClick={() => handleSortChange('purchase_number')}
                    >
                      Purchase No.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.field === 'purchase_date'}
                      direction={sort.field === 'purchase_date' ? sort.direction : 'asc'}
                      onClick={() => handleSortChange('purchase_date')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.field === 'supplier'}
                      direction={sort.field === 'supplier' ? sort.direction : 'asc'}
                      onClick={() => handleSortChange('supplier')}
                    >
                      Supplier
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Ship From</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sort.field === 'total'}
                      direction={sort.field === 'total' ? sort.direction : 'asc'}
                      onClick={() => handleSortChange('total')}
                    >
                      Total
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No purchases found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase, index) => (
                    <TableRow
                      key={purchase.id}
                      hover
                      // onClick={() => handlePurchaseClick(purchase.id)}
                      className="cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        animation: `fadeIn 0.3s ease-out forwards`,
                        animationDelay: `${index * 0.05}s`,
                      }}
                    >
                      <TableCell>{purchase.purchase_number}</TableCell>
                      <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                      <TableCell>{purchase.supplier.name}</TableCell>
                      <TableCell>{purchase.ship_from}</TableCell>
                      {/* <TableCell>{purchase.purchase_type}</TableCell> */}
                      <TableCell>${parseFloat(purchase.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handlePurchaseEntryDownload(purchase.id)}
                          className="border-none bg-transparent text-blue-500 outline-none"
                        >
                          Download PO
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            paginationInfo={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handleRowsPerPageChange}
            itemName="purchases"
          />
        </TabPanel>

        {/* Purchase Entries Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper} className="border border-gray-200 shadow-md">
            <Table>
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={entriesSort.field === 'purchaseentry_number'}
                      direction={
                        entriesSort.field === 'purchaseentry_number' ? entriesSort.direction : 'asc'
                      }
                      onClick={() => handleEntriesSortChange('purchaseentry_number')}
                    >
                      Purchase Entry No.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={entriesSort.field === 'purchaseentry_date'}
                      direction={
                        entriesSort.field === 'purchaseentry_date' ? entriesSort.direction : 'asc'
                      }
                      onClick={() => handleEntriesSortChange('purchaseentry_date')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={entriesSort.field === 'supplier'}
                      direction={entriesSort.field === 'supplier' ? entriesSort.direction : 'asc'}
                      onClick={() => handleEntriesSortChange('supplier')}
                    >
                      Supplier
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Ship From</TableCell>
                  {/* <TableCell>Purchase Type</TableCell> */}
                  <TableCell>
                    <TableSortLabel
                      active={entriesSort.field === 'sub_total'}
                      direction={entriesSort.field === 'sub_total' ? entriesSort.direction : 'asc'}
                      onClick={() => handleEntriesSortChange('sub_total')}
                    >
                      Subtotal
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Tax Amount</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={entriesSort.field === 'total'}
                      direction={entriesSort.field === 'total' ? entriesSort.direction : 'asc'}
                      onClick={() => handleEntriesSortChange('total')}
                    >
                      Total
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingEntries ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : purchaseEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No purchase entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      hover
                      onClick={() => handlePurchaseEntryClick(entry.id)}
                      className="cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        animation: `fadeIn 0.3s ease-out forwards`,
                        animationDelay: `${index * 0.05}s`,
                      }}
                    >
                      <TableCell>{entry.purchaseentry_number}</TableCell>
                      <TableCell>{formatDate(entry.purchaseentry_date)}</TableCell>
                      <TableCell>{entry.supplier.name}</TableCell>
                      <TableCell>{entry.ship_from}</TableCell>
                      {/* <TableCell>{entry.purchase_type}</TableCell> */}
                      <TableCell>{parseFloat(entry.sub_total).toFixed(2)} AED</TableCell>
                      <TableCell>{parseFloat(entry.discount).toFixed(2)} AED</TableCell>
                      <TableCell>{parseFloat(entry.tax_amount).toFixed(2)} AED</TableCell>
                      <TableCell>{parseFloat(entry.total).toFixed(2)} AED</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            paginationInfo={entriesPagination}
            onPageChange={handleEntriesPageChange}
            onPageSizeChange={handleEntriesRowsPerPageChange}
            itemName="purchase entries"
          />
        </TabPanel>

        {/* Purchases Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: { width: { xs: '100%', sm: 400 } },
          }}
        >
          <PurchaseFilters
            tempFilters={tempFilters}
            handleFilterChange={handleFilterChange}
            handleApplyFilters={handleApplyFilters}
            handleResetFilters={handleResetFilters}
            suppliers={suppliers}
            loadingDropdowns={loadingDropdowns}
            purchaseTypeOptions={purchaseTypeOptions}
          />
        </Drawer>

        {/* Purchase Entries Filter Drawer */}
        <Drawer
          anchor="right"
          open={entriesFilterDrawerOpen}
          onClose={() => setEntriesFilterDrawerOpen(false)}
          PaperProps={{
            sx: { width: { xs: '100%', sm: 400 } },
          }}
        >
          <PurchaseEntryFilters
            tempFilters={entriesTempFilters}
            handleFilterChange={handleEntriesFilterChange}
            handleApplyFilters={handleEntriesApplyFilters}
            handleResetFilters={handleEntriesResetFilters}
            suppliers={suppliers}
            loadingDropdowns={loadingDropdowns}
            purchaseTypeOptions={purchaseTypeOptions}
          />
        </Drawer>
      </div>
    </div>
  );
}
