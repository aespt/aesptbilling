"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab, Box, TextField, Typography, Paper, Button, Chip, IconButton } from "@mui/material";
import PageHeader from "@/app/shared/components/page-header";
import PrimaryButton from "@/app/shared/components/primary-button";
import Sidepanel from "@/app/shared/components/sidepanel";
import { FiHome, FiMapPin, FiCheck, FiStar, FiEdit } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { cardVariants, badgeVariants } from "@/app/shared/animations/card-animations";
import AddAddress from "./components/add-address";
import Snackbar from "@/app/shared/components/snackbar";
import useSnackbar from "@/app/shared/hooks/useSnackbar";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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
}

// API representation of address
interface ApiAddress {
  id: number;
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_primary: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      className="py-4"
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [uaeVat, setUaeVat] = useState("");
  const [indiaCgst, setIndiaCgst] = useState("");
  const [indiaSgst, setIndiaSgst] = useState("");
  
  // Loading states
  const [isVatLoading, setIsVatLoading] = useState(false);
  const [isGstLoading, setIsGstLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  
  // Use our custom snackbar hook
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();
  
  // Address panel state
  const [isAddressPanelOpen, setIsAddressPanelOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Address data
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [isPrimarySettingLoading, setIsPrimarySettingLoading] = useState<number | null>(null);

  // Fetch VAT and GST data on component mount
  useEffect(() => {
    const fetchTaxData = async () => {
      setIsDataLoading(true);
      try {
        // Fetch VAT data
        const vatResponse = await fetch('/api/vat-rates');
        if (vatResponse.ok) {
          const vatData = await vatResponse.json();
          if (vatData.vatRates && vatData.vatRates.length > 0) {
            setUaeVat(vatData.vatRates[0].vat_percentage);
          }
        }
        
        // Fetch GST data
        const gstResponse = await fetch('/api/gst-rates');
        if (gstResponse.ok) {
          const gstData = await gstResponse.json();
          if (gstData.gstRates && gstData.gstRates.length > 0) {
            setIndiaCgst(gstData.gstRates[0].cgst_percentage);
            setIndiaSgst(gstData.gstRates[0].sgst_percentage);
          }
        }
      } catch (error) {
        console.error('Error fetching tax data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchTaxData();
  }, []);

  // Fetch addresses on component mount and when tab changes to addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (tabValue !== 1) return;
      
      setIsAddressesLoading(true);
      try {
        const response = await fetch('/api/addresses');
        if (response.ok) {
          const data = await response.json();
          
          // Convert API format to component format
          const formattedAddresses = data.addresses.map((address: any) => ({
            id: address.id,
            type: address.type,
            street: address.street,
            city: address.city,
            state: address.state || '',
            country: address.country,
            postalCode: address.postal_code,
            isPrimary: address.is_primary
          }));
          
          setAddresses(formattedAddresses);
        } else {
          showSnackbar('Failed to load addresses', 'error');
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        showSnackbar('Error loading addresses', 'error');
      } finally {
        setIsAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmitVat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVatLoading(true);
    
    try {
      const response = await fetch('/api/vat-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vat_percentage: parseFloat(uaeVat)
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('VAT updated successfully:', result);
        showSnackbar('VAT settings saved successfully', 'success');
      } else {
        console.error('Failed to update VAT');
        showSnackbar('Failed to save VAT settings', 'error');
      }
    } catch (error) {
      console.error('Error updating VAT:', error);
      showSnackbar('Error saving VAT settings', 'error');
    } finally {
      setIsVatLoading(false);
    }
  };
  
  const handleSubmitGst = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGstLoading(true);
    
    try {
      const response = await fetch('/api/gst-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cgst_percentage: parseFloat(indiaCgst),
          sgst_percentage: parseFloat(indiaSgst)
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('GST updated successfully:', result);
        showSnackbar('GST settings saved successfully', 'success');
      } else {
        console.error('Failed to update GST');
        showSnackbar('Failed to save GST settings', 'error');
      }
    } catch (error) {
      console.error('Error updating GST:', error);
      showSnackbar('Error saving GST settings', 'error');
    } finally {
      setIsGstLoading(false);
    }
  };

  const setAsPrimary = async (id: number) => {
    try {
      setIsPrimarySettingLoading(id);
      
      // Get the address to update
      const addressToUpdate = addresses.find(address => address.id === id);
      if (!addressToUpdate) return;
      
      // Update the address on the server
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_primary: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update address');
      }
      
      // Get the previously primary address
      const previousPrimaryAddress = addresses.find(address => address.isPrimary);
      
      // If there was a primary address and it's different from the one we're updating
      if (previousPrimaryAddress && previousPrimaryAddress.id !== id) {
        // Update the previous primary address on the server to not be primary
        const updatePreviousResponse = await fetch(`/api/addresses/${previousPrimaryAddress.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_primary: false
          }),
        });
        
        if (!updatePreviousResponse.ok) {
          console.warn('Failed to update previous primary address, but continuing');
        }
      }
      
      // Update the local state
    setAddresses(addresses.map(address => ({
      ...address,
      isPrimary: address.id === id
    })));
      
      showSnackbar('Primary address updated successfully', 'success');
    } catch (error) {
      console.error('Error updating primary address:', error);
      showSnackbar('Failed to update primary address', 'error');
    } finally {
      setIsPrimarySettingLoading(null);
    }
  };
  
  const openAddAddressPanel = () => {
    setSelectedAddress(null);
    setIsAddressPanelOpen(true);
  };
  
  const openEditAddressPanel = (address: Address) => {
    setSelectedAddress(address);
    setIsAddressPanelOpen(true);
  };
  
  const handleAddressAdded = (newAddress: Address) => {
    setAddresses(prev => [...prev, newAddress]);
    showSnackbar('Address added successfully', 'success');
  };
  
  const handleAddressUpdated = (updatedAddress: Address) => {
    setAddresses(prev => 
      prev.map(address => 
        address.id === updatedAddress.id ? updatedAddress : address
      )
    );
    showSnackbar('Address updated successfully', 'success');
  };

  return (
    <div className="px-6 md:ml-72 pt-16 py-8">
      <PageHeader 
        heading="Settings" 
        buttonText="" 
        onButtonClick={() => {}} 
      />
      
      <Paper className="mb-6">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            className="px-4 pt-2"
          >
            <Tab label="Tax" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
            <Tab label="Address" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {isDataLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-red-500 border-l-blue-300 border-r-red-300 animate-spin"></div>
            </div>
          ) : (
            <div className="px-6 pb-6 space-y-6">
              {/* UAE Section */}
              <form onSubmit={handleSubmitVat} className="p-4 bg-gray-100 rounded-lg">
                <Typography variant="h6" className="mb-4 font-medium text-gray-800">
                  UAE
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <TextField
                    label="VAT %"
                    variant="outlined"
                    fullWidth
                    value={uaeVat}
                    size="small"
                    onChange={(e) => setUaeVat(e.target.value)}
                    type="number"
                    InputProps={{
                      endAdornment: <Typography variant="body2">%</Typography>,
                    }}
                    className="bg-white"
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="contained" 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                    disabled={isVatLoading}
                  >
                    {isVatLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        <span>Saving...</span>
                      </div>
                    ) : 'Save VAT Settings'}
                  </Button>
              </div>
              </form>

              {/* India Section */}
              <form onSubmit={handleSubmitGst} className="p-4 bg-gray-100 rounded-lg">
                <Typography variant="h6" className="mb-4 font-medium text-gray-800">
                  India
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <TextField
                    label="CGST %"
                    variant="outlined"
                    fullWidth
                    value={indiaCgst}
                    size="small"
                    onChange={(e) => setIndiaCgst(e.target.value)}
                    type="number"
                    InputProps={{
                      endAdornment: <Typography variant="body2">%</Typography>,
                    }}
                    className="bg-white"
                  />
                  <TextField
                    label="SGST %"
                    variant="outlined"
                    fullWidth
                    value={indiaSgst}
                    size="small"
                    onChange={(e) => setIndiaSgst(e.target.value)}
                    type="number"
                    InputProps={{
                      endAdornment: <Typography variant="body2">%</Typography>,
                    }}
                    className="bg-white"
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="contained" 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                    disabled={isGstLoading}
                  >
                    {isGstLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        <span>Saving...</span>
              </div>
                    ) : 'Save GST Settings'}
                  </Button>
              </div>
              </form>
            </div>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div className="px-6 py-4">
            <div className="mb-6 flex justify-between items-center">
              <Typography variant="h6" className="font-medium text-gray-800">
                Saved Addresses
              </Typography>
              <Button 
                variant="outlined" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                startIcon={<FiMapPin />}
                onClick={openAddAddressPanel}
              >
                Add New Address
              </Button>
            </div>
            
            {isAddressesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-red-500 border-l-blue-300 border-r-red-300 animate-spin"></div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Typography variant="body1" className="text-gray-600">
                  No addresses found. Click "Add New Address" to create one.
                </Typography>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <motion.div
                  key={address.id}
                  initial={address.isPrimary ? "primary" : "notPrimary"}
                  animate={address.isPrimary ? "primary" : "notPrimary"}
                  variants={cardVariants}
                  transition={{ duration: 0.3 }}
                  className="rounded-lgb"
                  layout
                >
                  <Paper 
                    className={`p-4 rounded-lg border h-full ${address.isPrimary ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
                    elevation={0}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <FiHome className="text-gray-600 mr-2" />
                        <Typography variant="subtitle1" className="font-medium">
                          {address.type}
                        </Typography>
                      </div>
                      <div className="flex items-center">
                        <IconButton 
                          size="small"
                          className="text-gray-500 mr-1"
                          aria-label="Edit address"
                          onClick={() => openEditAddressPanel(address)}
                        >
                          <FiEdit size={16} />
                        </IconButton>
                        <AnimatePresence>
                          {address.isPrimary && (
                            <motion.div
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              variants={badgeVariants}
                            >
                              <Chip
                                  icon={<FiStar className="text-blue-500" />}
                                label="Primary"
                                size="small"
                                  className="bg-blue-50 text-blue-700"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-gray-700">
                      <Typography variant="body2" className="mb-1">
                        {address.street}
                      </Typography>
                      <Typography variant="body2" className="mb-1">
                        {address.city}{address.state ? `, ${address.state}` : ''}
                      </Typography>
                      <Typography variant="body2" className="mb-1">
                        {address.country}, {address.postalCode}
                      </Typography>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        {/* Address actions */}
                        <div className="flex items-center space-x-2">
                      {!address.isPrimary && (
                        <Button 
                          size="small"
                              variant="outlined"
                              className="text-xs border-blue-500 text-blue-500 hover:bg-blue-50"
                          onClick={() => setAsPrimary(address.id)}
                              disabled={isPrimarySettingLoading === address.id}
                            >
                              {isPrimarySettingLoading === address.id ? (
                                <div className="flex items-center">
                                  <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></div>
                                  <span>Setting...</span>
                                </div>
                              ) : (
                                'Set as Primary'
                              )}
                        </Button>
                      )}
                        </div>
                    </div>
                  </Paper>
                </motion.div>
              ))}
            </div>
            )}
          </div>
        </TabPanel>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={isOpen}
        message={message}
        type={type}
        onClose={hideSnackbar}
      />
      
      {/* Sidepanel for adding/editing addresses */}
      <Sidepanel
        isOpen={isAddressPanelOpen}
        onClose={() => setIsAddressPanelOpen(false)}
        size="medium"
      >
        <AddAddress
          onClose={() => setIsAddressPanelOpen(false)}
          onAddressAdded={handleAddressAdded}
          onAddressUpdated={handleAddressUpdated}
          addressToEdit={selectedAddress}
        />
      </Sidepanel>
    </div>
  );
}