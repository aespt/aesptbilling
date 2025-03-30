"use client";

import { useState, useEffect } from "react";
import { 
  TextField, 
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  SelectChangeEvent,
  Paper,
  Box
} from "@mui/material";
import useSnackbar from "@/app/shared/hooks/useSnackbar";

interface VatRate {
  id: number;
  vat_percentage: number;
  description: string;
}

interface SalesTaxDiscountProps {
  formData: any;
  setFormData: (formData: any) => void;
  errors: any;
  setErrors: (errors: any) => void;
  onTaxDiscountChange: () => void;
}

export default function SalesTaxDiscount({ 
  formData, 
  setFormData, 
  errors,
  setErrors,
  onTaxDiscountChange
}: SalesTaxDiscountProps) {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [defaultVatRate, setDefaultVatRate] = useState<VatRate | null>(null);

  // Fetch VAT rates on component mount
  useEffect(() => {
    const fetchVatRates = async () => {
      try {
        // This would be replaced with your actual API
        const response = await fetch('/api/vat-rates');
        if (!response.ok) throw new Error('Failed to fetch VAT rates');
        const data = await response.json();
        setVatRates(data.vatRates || []);
        
        if (data.vatRates && data.vatRates.length > 0) {
          const defaultVat = data.vatRates[0];
          setDefaultVatRate(defaultVat);
          
          // Set initial VAT data if not already set
          if (!formData.tax_type) {
            setFormData((prev: any) => ({
              ...prev,
              tax_type: 'VAT',
              vat_percentage: defaultVat.vat_percentage,
              cgst_percentage: 0,
              sgst_percentage: 0,
              discount_type: 'PERCENTAGE',
              discount_value: 0
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching VAT rates:', error);
        // Mock data
        const mockVatRates = [
          { id: 1, vat_percentage: 5, description: 'Standard VAT' },
          { id: 2, vat_percentage: 0, description: 'Zero VAT' }
        ];
        setVatRates(mockVatRates);
        setDefaultVatRate(mockVatRates[0]);
        
        // Set initial VAT data with mock data
        if (!formData.tax_type) {
          setFormData((prev: any) => ({
            ...prev,
            tax_type: 'VAT',
            vat_percentage: mockVatRates[0].vat_percentage,
            cgst_percentage: 0,
            sgst_percentage: 0,
            discount_type: 'PERCENTAGE',
            discount_value: 0
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVatRates();
  }, [setFormData, formData.tax_type]);

  // Handle tax type change
  const handleTaxTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    
    setFormData((prev: any) => ({
      ...prev,
      tax_type: value,
      vat_percentage: value === 'VAT' ? (defaultVatRate?.vat_percentage || 0) : 0,
      cgst_percentage: value === 'GST' ? 9 : 0, // Default values, would come from API
      sgst_percentage: value === 'GST' ? 9 : 0  // Default values, would come from API
    }));
    
    onTaxDiscountChange();
  };

  // Handle VAT rate change
  const handleVatRateChange = (event: SelectChangeEvent) => {
    const vatId = Number(event.target.value);
    const selectedVat = vatRates.find(vat => vat.id === vatId);
    
    if (selectedVat) {
      setFormData((prev: any) => ({
        ...prev,
        vat_percentage: selectedVat.vat_percentage
      }));
      
      onTaxDiscountChange();
    }
  };

  // Handle discount type change
  const handleDiscountTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    
    setFormData((prev: any) => ({
      ...prev,
      discount_type: value,
      // Reset discount value when changing type to avoid confusion
      discount_value: 0
    }));
    
    onTaxDiscountChange();
  };

  // Handle discount value change
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    
    // Validate percentage cannot be > 100
    if (formData.discount_type === 'PERCENTAGE' && value > 100) {
      return;
    }
    
    setFormData((prev: any) => ({
      ...prev,
      discount_value: isNaN(value) ? 0 : value
    }));
    
    onTaxDiscountChange();
  };

  return (
    <Paper elevation={0} className="mb-6 overflow-hidden border border-gray-200 shadow-lg">
      <Box className="bg-blue-50 px-6 py-4 border-b border-gray-200">
        <Typography variant="subtitle1" className="font-medium text-gray-700">
          Tax and Discount
        </Typography>
      </Box>
      
      <Box className="p-6">
        <Box sx={{ display: 'grid', gap: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            <div>
              <Typography variant="caption" className="text-gray-500 mb-1 block">
                Tax Type
              </Typography>
              <FormControl fullWidth size="small" variant="outlined">
                <Select
                  value={formData.tax_type || 'VAT'}
                  onChange={handleTaxTypeChange}
                  disabled={isLoading}
                  displayEmpty
                >
                  <MenuItem value="VAT">VAT</MenuItem>
                  <MenuItem value="GST" disabled>GST (Not Implemented)</MenuItem>
                  <MenuItem value="NONE">None</MenuItem>
                </Select>
              </FormControl>
            </div>
            
            {formData.tax_type === 'VAT' && (
              <div>
                <Typography variant="caption" className="text-gray-500 mb-1 block">
                  VAT Rate
                </Typography>
                <TextField
                  value={`${formData.vat_percentage}%`}
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="VAT Rate"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </div>
            )}
            
            {formData.tax_type === 'GST' && (
              <>
                <div>
                  <Typography variant="caption" className="text-gray-500 mb-1 block">
                    CGST (%)
                  </Typography>
                  <TextField
                    type="number"
                    value={formData.cgst_percentage}
                    disabled={true}
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="CGST Rate"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </div>
                <div>
                  <Typography variant="caption" className="text-gray-500 mb-1 block">
                    SGST (%)
                  </Typography>
                  <TextField
                    type="number"
                    value={formData.sgst_percentage}
                    disabled={true}
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="SGST Rate"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </div>
              </>
            )}
            
            <div>
              <Typography variant="caption" className="text-gray-500 mb-1 block">
                Discount Type
              </Typography>
              <FormControl fullWidth size="small" variant="outlined">
                <Select
                  value={formData.discount_type || 'PERCENTAGE'}
                  onChange={handleDiscountTypeChange}
                  displayEmpty
                >
                  <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                  <MenuItem value="FIXED">Fixed Amount</MenuItem>
                  <MenuItem value="NONE">No Discount</MenuItem>
                </Select>
              </FormControl>
            </div>
            
            {formData.discount_type !== 'NONE' && (
              <div>
                <Typography variant="caption" className="text-gray-500 mb-1 block">
                  {formData.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'}
                </Typography>
                <TextField
                  type="number"
                  value={formData.discount_value}
                  onChange={handleDiscountValueChange}
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder={formData.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'}
                  InputProps={{
                    endAdornment: formData.discount_type === 'PERCENTAGE' ? 
                      <InputAdornment position="end">%</InputAdornment> : 
                      <InputAdornment position="end">AED</InputAdornment>,
                    inputProps: { 
                      min: 0,
                      max: formData.discount_type === 'PERCENTAGE' ? 100 : undefined 
                    }
                  }}
                />
              </div>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
} 