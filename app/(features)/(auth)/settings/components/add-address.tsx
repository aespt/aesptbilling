'use client';

import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

// UI representation of address
interface Address {
  id: number;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
  transactionNo: string;
  phoneNo: string;
  faxNo: string;
}

// API representation of address
interface ApiAddress {
  id?: number;
  type: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postal_code: string;
  is_primary: boolean;
  transaction_no?: string;
  phone_no?: string;
  fax_no?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Define props interface for component
interface AddAddressProps {
  onClose: () => void;
  onAddressAdded?: (address: Address) => void;
  onAddressUpdated?: (address: Address) => void;
  addressToEdit?: Address | null;
}

// List of possible address types
const addressTypes = ['Office', 'Warehouse', 'Branch Office', 'Retail Store', 'Home', 'Other'];

// List of common countries for the dropdown
const countries = ['UAE', 'India', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Bahrain', 'Other'];

export default function AddAddress({
  onClose,
  onAddressAdded,
  onAddressUpdated,
  addressToEdit,
}: AddAddressProps) {
  // Setup state for the form
  const [address, setAddress] = useState<ApiAddress>({
    type: 'Office',
    street: '',
    city: '',
    state: '',
    country: 'UAE',
    postal_code: '',
    is_primary: false,
    transaction_no: '',
    phone_no: '',
    fax_no: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If addressToEdit is provided, use it to populate the form
  useEffect(() => {
    if (addressToEdit) {
      // Convert from UI format to API format
      setAddress({
        id: addressToEdit.id,
        type: addressToEdit.type,
        street: addressToEdit.street,
        city: addressToEdit.city,
        state: addressToEdit.state || '',
        country: addressToEdit.country,
        postal_code: addressToEdit.postalCode,
        is_primary: false, // Always set to false, let the settings page handle primary status
        transaction_no: addressToEdit.transactionNo || '',
        phone_no: addressToEdit.phoneNo || '',
        fax_no: addressToEdit.faxNo || '',
      });
    }
  }, [addressToEdit]);

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form input
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!address.type) {
      newErrors.type = 'Address type is required';
    }
    if (!address.street) {
      newErrors.street = 'Street address is required';
    }
    if (!address.city) {
      newErrors.city = 'City is required';
    }
    if (!address.country) {
      newErrors.country = 'Country is required';
    }
    if (!address.postal_code) {
      newErrors.postal_code = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert API address to UI address
  const convertToUiAddress = (apiAddress: ApiAddress): Address => {
    return {
      id: apiAddress.id || 0,
      type: apiAddress.type,
      street: apiAddress.street,
      city: apiAddress.city,
      state: apiAddress.state || '',
      country: apiAddress.country,
      postalCode: apiAddress.postal_code,
      isPrimary: apiAddress.is_primary,
      transactionNo: apiAddress.transaction_no || '',
      phoneNo: apiAddress.phone_no || '',
      faxNo: apiAddress.fax_no || '',
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure is_primary is always false when creating or updating
      const addressData = {
        ...address,
        is_primary: false,
      };

      if (addressToEdit) {
        // Update existing address
        const response = await fetch(`/api/addresses/${address.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addressData),
        });

        if (!response.ok) {
          throw new Error('Failed to update address');
        }

        const result = await response.json();

        // Call the callback with UI-formatted address
        onAddressUpdated?.(convertToUiAddress(result.address));
      } else {
        // Create new address
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addressData),
        });

        if (!response.ok) {
          throw new Error('Failed to create address');
        }

        const result = await response.json();

        // Call the callback with UI-formatted address
        onAddressAdded?.(convertToUiAddress(result.address));
      }

      onClose();
    } catch (error) {
      console.error('Error submitting address:', error);
      setErrors({ submit: 'Failed to save address. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <Typography variant="h6" className="font-medium">
          {addressToEdit ? 'Edit Address' : 'Add New Address'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <FiX />
        </IconButton>
      </div>

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Address Type */}
          <FormControl fullWidth variant="outlined" size="small" error={!!errors.type}>
            <InputLabel id="address-type-label">Address Type</InputLabel>
            <Select
              labelId="address-type-label"
              id="type"
              name="type"
              value={address.type || ''}
              onChange={handleSelectChange}
              label="Address Type"
            >
              {addressTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {errors.type && <div className="mt-1 text-xs text-red-500">{errors.type}</div>}
          </FormControl>

          {/* Street */}
          <TextField
            label="Street Address"
            name="street"
            value={address.street || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            multiline
            rows={2}
            required
            error={!!errors.street}
            helperText={errors.street}
          />

          {/* City */}
          <TextField
            label="City"
            name="city"
            value={address.city || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            required
            error={!!errors.city}
            helperText={errors.city}
          />

          {/* State/Province */}
          <TextField
            label="State/Province"
            name="state"
            value={address.state || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            error={!!errors.state}
            helperText={errors.state}
          />

          {/* Country */}
          <FormControl fullWidth variant="outlined" size="small" error={!!errors.country}>
            <InputLabel id="country-label">Country</InputLabel>
            <Select
              labelId="country-label"
              id="country"
              name="country"
              value={address.country || ''}
              onChange={handleSelectChange}
              label="Country"
              required
            >
              {countries.map(country => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
            {errors.country && <div className="mt-1 text-xs text-red-500">{errors.country}</div>}
          </FormControl>

          {/* Postal Code */}
          <TextField
            label="Postal Code"
            name="postal_code"
            value={address.postal_code || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            required
            error={!!errors.postal_code}
            helperText={errors.postal_code}
          />

          {/* Transaction No */}
          <TextField
            label="Tax Registration Number (TRN)"
            name="transaction_no"
            value={address.transaction_no || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            error={!!errors.transaction_no}
            helperText={errors.transaction_no}
          />

          {/* Phone No */}
          <TextField
            label="Phone Number"
            name="phone_no"
            value={address.phone_no || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            error={!!errors.phone_no}
            helperText={errors.phone_no}
          />

          {/* Fax No */}
          <TextField
            label="Fax Number"
            name="fax_no"
            value={address.fax_no || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
            error={!!errors.fax_no}
            helperText={errors.fax_no}
          />

          {/* Primary Address Checkbox - Removed as requested */}

          {/* General error message */}
          {errors.submit && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-500">{errors.submit}</div>
          )}
        </div>
      </Box>

      {/* Footer with action buttons */}
      <div className="flex justify-end space-x-3 border-t p-4">
        <Button
          variant="outlined"
          onClick={onClose}
          className="flex-1 border-gray-300 text-gray-700"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          onClick={handleSubmit}
          className="flex-1 cursor-pointer overflow-hidden rounded-md bg-gradient-to-r from-red-500 to-blue-500 px-4 py-2.5 text-white transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </div>
          ) : addressToEdit ? (
            'Update Address'
          ) : (
            'Add Address'
          )}
        </Button>
      </div>
    </div>
  );
}
