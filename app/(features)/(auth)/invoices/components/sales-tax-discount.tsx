"use client";

import { useState, useEffect } from "react";
import { 
  TextField, 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  SelectChangeEvent
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
      <Typography variant="h6" className="mb-4 text-gray-800 font-medium">Tax and Discount</Typography>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-1">
          <FormControl fullWidth>
            <InputLabel>Tax Type</InputLabel>
            <Select
              label="Tax Type"
              name="tax_type"
              size="small"
              value={formData.tax_type || 'VAT'}
              onChange={handleTaxTypeChange}
              disabled={isLoading}
            >
              <MenuItem value="VAT">VAT</MenuItem>
              <MenuItem value="GST" disabled>GST (Not Implemented)</MenuItem>
              <MenuItem value="NONE">None</MenuItem>
            </Select>
          </FormControl>
        </div>
        
        {formData.tax_type === 'VAT' && (
          <div className="col-span-1">
            <TextField
              label="VAT Rate"
              value={`${formData.vat_percentage}%`}
              fullWidth
              size="small"
              InputProps={{
                readOnly: true,
              }}
            />
          </div>
        )}
        
        {formData.tax_type === 'GST' && (
          <>
            <div className="col-span-1">
              <TextField
                label="CGST (%)"
                type="number"
                value={formData.cgst_percentage}
                disabled={true} // Disabled as per requirement
                  fullWidth
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </div>
            <div className="col-span-1">
              <TextField
                label="SGST (%)"
                type="number"
                value={formData.sgst_percentage}
                disabled={true} // Disabled as per requirement
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </div>
          </>
        )}
        
        <div className="col-span-1">
          <FormControl fullWidth>
            <InputLabel>Discount Type</InputLabel>
            <Select
              name="discount_type"
              label="Discount Type"
              size="small"
              value={formData.discount_type || 'PERCENTAGE'}
              onChange={handleDiscountTypeChange}
            >
              <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
              <MenuItem value="FIXED">Fixed Amount</MenuItem>
              <MenuItem value="NONE">No Discount</MenuItem>
            </Select>
          </FormControl>
        </div>
        
        {formData.discount_type !== 'NONE' && (
          <div className="col-span-1">
            <TextField
              label={formData.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount'}
              type="number"
              name="discount_value"
              value={formData.discount_value}
              onChange={handleDiscountValueChange}
              fullWidth
              size="small"
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
      </div>
    </div>
  );
} 