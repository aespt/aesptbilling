'use client';

import { useState, useEffect } from 'react';
import { 
  Box,
  TextField,
  Typography,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Divider
} from '@mui/material';
import { FiX } from 'react-icons/fi';
import PrimaryButton from '@/app/shared/components/primary-button';

// Define the interface for address data
interface Address {
  id: number;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
}

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
  addressToEdit 
}: AddAddressProps) {
  // Setup state for the form
  const [address, setAddress] = useState<Partial<Address>>({
    id: 0,
    type: 'Office',
    street: '',
    city: '',
    state: '',
    country: 'UAE',
    postalCode: '',
    isPrimary: false
  });

  // If addressToEdit is provided, use it to populate the form
  useEffect(() => {
    if (addressToEdit) {
      setAddress(addressToEdit);
    }
  }, [addressToEdit]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a new ID for new addresses or keep the existing one for edits
    const addressWithId = {
      ...address,
      id: addressToEdit?.id || Date.now()
    } as Address;
    
    // Call the appropriate callback
    if (addressToEdit) {
      onAddressUpdated?.(addressWithId);
    } else {
      onAddressAdded?.(addressWithId);
    }
    
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
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
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="address-type-label">Address Type</InputLabel>
            <Select
              labelId="address-type-label"
              id="type"
              name="type"
              value={address.type || ''}
              onChange={handleChange}
              label="Address Type"
            >
              {addressTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
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
          />
          
          {/* Country */}
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="country-label">Country</InputLabel>
            <Select
              labelId="country-label"
              id="country"
              name="country"
              value={address.country || ''}
              onChange={handleChange}
              label="Country"
              required
            >
              {countries.map(country => (
                <MenuItem key={country} value={country}>{country}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Postal Code */}
          <TextField
            label="Postal Code"
            name="postalCode"
            value={address.postalCode || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            size="small"
          />
          
          {/* Primary Address Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimary"
              name="isPrimary"
              checked={address.isPrimary || false}
              onChange={(e) => setAddress(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
              Set as primary address
            </label>
          </div>
        </div>
      </Box>
      
      {/* Footer with action buttons */}
      <div className="border-t p-4 flex justify-end space-x-3">
        <Button
          variant="outlined"
          onClick={onClose}
          className="border-gray-300 text-gray-700"
        >
          Cancel
        </Button>
        <PrimaryButton
          label={addressToEdit ? 'Update Address' : 'Add Address'}
          type="submit"
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
} 