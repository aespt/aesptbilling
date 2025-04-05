'use client';

import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import ActionMenu from '@/app/shared/components/action-menu';
import ConfirmationDialog from '@/app/shared/components/confirmation-dialog';
import PageHeader from '@/app/shared/components/page-header';
import Snackbar from '@/app/shared/components/snackbar';
import useConfirmation from '@/app/shared/hooks/useConfirmation';
import useSnackbar from '@/app/shared/hooks/useSnackbar';

// Define the Sales type based on our API response
interface Sale {
  id: number;
  date: string;
  customer_id: number;
  customer_name: string;
  product_id: number;
  product_name: string;
  qty: number;
  mrp: number;
  discount_type: 'PERCENTAGE' | 'FIXED' | 'NONE';
  discount_value: number;
  salesman_id: number;
  salesman_name: string;
  ship_to: string | null;
  invoice_id: number | null;
  created_at: string;
  updated_at: string;
}

const actionMenuItems = [
  {
    name: 'view',
    displayText: 'View Details',
    icon: <VisibilityIcon fontSize="small" className="text-gray-600" />,
  },
];

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use our custom confirmation hook
  const {
    isConfirmationOpen,
    confirmationTitle,
    confirmationMessage,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    handleConfirm,
    handleCancel,
  } = useConfirmation();

  // Use our custom snackbar hook
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  // Fetch sales from API
  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sales');

      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const data = await response.json();
      setSales(data.sales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data. Please try again later.');
      showSnackbar('Failed to load sales data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  // Load sales on component mount
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleActionClick = (saleId: number, actionName: string) => {
    if (actionName === 'view') {
      // Implement view details functionality
      const saleToView = sales.find(s => s.id === saleId);
      if (saleToView) {
        alert(`Sale Details:\n${JSON.stringify(saleToView, null, 2)}`);
      }
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate final price after discount
  const calculateFinalPrice = (mrp: number, discountType: string, discountValue: number) => {
    if (discountType === 'PERCENTAGE') {
      return mrp - mrp * (discountValue / 100);
    } else if (discountType === 'FIXED') {
      return mrp - discountValue;
    }
    return mrp;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pt-16 md:ml-[280px] md:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <PageHeader
          heading="Sales"
          buttonText="Add Sale"
          onButtonClick={() => router.push('/sales/add')}
        />

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-12 animate-spin rounded-full border-4 border-b-red-500 border-l-blue-300 border-r-red-300 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        ) : (
          <TableContainer
            component={Paper}
            className="overflow-hidden rounded-lg border border-gray-100 shadow-md"
            elevation={0}
          >
            <Table className="border border-gray-100">
              <TableHead>
                <TableRow className="bg-gray-100">
                  <TableCell className="font-semibold">Date</TableCell>
                  <TableCell className="font-semibold">Customer</TableCell>
                  <TableCell className="font-semibold">Product</TableCell>
                  <TableCell className="font-semibold">Quantity</TableCell>
                  <TableCell className="font-semibold">MRP</TableCell>
                  <TableCell className="font-semibold">Discount</TableCell>
                  <TableCell className="font-semibold">Final Price</TableCell>
                  <TableCell className="font-semibold">Salesman</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      No sales records found. Click &quot;Add Sale&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map(sale => (
                    <TableRow key={sale.id} className="transition-colors hover:bg-gray-50/50">
                      <TableCell className="text-gray-700">{formatDate(sale.date)}</TableCell>
                      <TableCell className="text-gray-700">{sale.customer_name}</TableCell>
                      <TableCell className="text-gray-700">{sale.product_name}</TableCell>
                      <TableCell className="text-gray-600">{sale.qty}</TableCell>
                      <TableCell className="text-gray-600">{formatCurrency(sale.mrp)}</TableCell>
                      <TableCell className="text-gray-600">
                        {sale.discount_type === 'PERCENTAGE'
                          ? `${sale.discount_value}%`
                          : sale.discount_type === 'FIXED'
                            ? formatCurrency(sale.discount_value)
                            : 'None'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatCurrency(
                          calculateFinalPrice(sale.mrp, sale.discount_type, sale.discount_value)
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">{sale.salesman_name}</TableCell>
                      <TableCell>
                        <ActionMenu
                          menuItems={actionMenuItems}
                          onMenuItemClick={actionName => handleActionClick(sale.id, actionName)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        title={confirmationTitle}
        message={confirmationMessage}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        confirmButtonColor={confirmButtonColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Snackbar for notifications */}
      <Snackbar open={isOpen} message={message} type={type} onClose={hideSnackbar} />
    </div>
  );
}
