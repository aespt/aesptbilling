import {
  Modal,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  total: number;
  status: string;
  invoice_stage: 'SALE' | 'PROFORMA' | 'QUOTATION';
}

interface PreviousInvoicesModalProps {
  open: boolean;
  onClose: () => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export default function PreviousInvoicesModal({
  open,
  onClose,
  onSelectInvoice,
}: PreviousInvoicesModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PROFORMA' | 'QUOTATION'>('PROFORMA');

  useEffect(() => {
    if (open) {
      fetchInvoices();
    }
  }, [open, activeTab]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices?stage=${activeTab}&status=PENDING`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setInvoices(result.data || []);
      } else {
        console.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'PROFORMA' | 'QUOTATION') => {
    setActiveTab(newValue);
    setSelectedInvoice(null);
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
  };

  const handleConfirmSelection = () => {
    if (selectedInvoice) {
      onSelectInvoice(selectedInvoice);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 900,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Select Previous Invoice
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="invoice type tabs"
          sx={{ mb: 2 }}
        >
          <Tab label="Proforma Invoices" value="PROFORMA" />
          <Tab label="Quotations" value="QUOTATION" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No {activeTab === 'PROFORMA' ? 'proforma invoices' : 'quotations'} found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map(invoice => (
                    <TableRow
                      key={invoice.id}
                      hover
                      onClick={() => handleSelectInvoice(invoice.id)}
                      selected={selectedInvoice === invoice.id}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedInvoice === invoice.id}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell align="right">
                        ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{invoice.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSelection}
            disabled={!selectedInvoice}
            className="bg-gradient-to-r from-red-500 to-blue-500"
          >
            Select Invoice
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
