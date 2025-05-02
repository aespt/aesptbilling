'use client';

import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
  Typography,
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
} from '@mui/material';
import type * as DayJS from 'dayjs';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import Pagination from '@/app/shared/components/pagination';
import type { PaginationInfo } from '@/app/shared/components/pagination';
import PrimaryButton from '@/app/shared/components/primary-button';

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

export default function PurchasesListPage() {
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Define purchase type options
  const purchaseTypeOptions = ['TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION'];

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

    if (filterDrawerOpen) {
      setTempFilters(filters);
      fetchDropdownData();
    }
  }, [filterDrawerOpen]);

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

  // Load purchases on initial page load and when filters change
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePurchaseClick = (purchaseId: number) => {
    window.location.href = `/purchases/${purchaseId}`;
  };

  return (
    <div className="mt-16 px-4 py-2 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <style>{tableRowAnimation}</style>
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Typography variant="h4" component="h1" className="text-2xl font-bold text-gray-800">
            Purchases
          </Typography>
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* <TextField
              variant="outlined"
              placeholder="Search purchases..."
              size="small"
              value={filters.purchaseNumber}
              onChange={e => handleFilterChange('purchaseNumber', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              className="w-full sm:w-64"
            /> */}
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              aria-label="filter"
              color="primary"
              className="bg-blue-50 hover:bg-blue-100"
            >
              <FilterAltIcon />
            </IconButton>
            <Link href="/purchases/create">
              <PrimaryButton label="+ New Purchase" />
            </Link>
          </div>
        </div>

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
                <TableCell>Purchase Type</TableCell>
                <TableCell>
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
                    onClick={() => handlePurchaseClick(purchase.id)}
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
                    <TableCell>{purchase.purchase_type}</TableCell>
                    <TableCell>${parseFloat(purchase.total).toFixed(2)}</TableCell>
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

        {/* Filter Drawer */}
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
      </div>
    </div>
  );
}
