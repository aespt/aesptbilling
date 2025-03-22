"use client";

import { useState } from "react";
import { Tabs, Tab, Box, TextField, Typography, Paper, Button, Chip, IconButton } from "@mui/material";
import PageHeader from "@/app/shared/components/page-header";
import PrimaryButton from "@/app/shared/components/primary-button";
import Sidepanel from "@/app/shared/components/sidepanel";
import { FiHome, FiMapPin, FiCheck, FiStar, FiEdit } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { cardVariants, badgeVariants } from "@/app/shared/animations/card-animations";
import AddAddress from "./components/add-address";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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
  
  // Address panel state
  const [isAddressPanelOpen, setIsAddressPanelOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Sample address data
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 1,
      type: "Office",
      street: "123 Business Park, Sheikh Zayed Road",
      city: "Dubai",
      state: "",
      country: "UAE",
      postalCode: "12345",
      isPrimary: true
    },
    {
      id: 2,
      type: "Warehouse",
      street: "456 Industrial Zone, Al Quoz",
      city: "Dubai",
      state: "",
      country: "UAE",
      postalCode: "54321",
      isPrimary: false
    },
    {
      id: 3,
      type: "Branch Office",
      street: "789 IT Park, Electronic City",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560100",
      isPrimary: false
    }
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save tax settings logic here
    console.log({
      uaeVat,
      indiaCgst,
      indiaSgst
    });
  };

  const setAsPrimary = (id: number) => {
    setAddresses(addresses.map(address => ({
      ...address,
      isPrimary: address.id === id
    })));
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
  };
  
  const handleAddressUpdated = (updatedAddress: Address) => {
    setAddresses(prev => 
      prev.map(address => 
        address.id === updatedAddress.id ? updatedAddress : address
      )
    );
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
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            <div className="space-y-6">
              {/* UAE Section */}
              <div className="p-4 bg-gray-100 rounded-lg">
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
              </div>

              {/* India Section */}
              <div className="p-4 bg-gray-100 rounded-lg">
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
              </div>

              <div className="flex justify-end mt-6">
                <PrimaryButton 
                  label="Save Settings" 
                  type="submit"
                />
              </div>
            </div>
          </form>
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
                                icon={<FiStar className="text-red-500" />}
                                label="Primary"
                                size="small"
                                className="bg-red-50 text-red-700"
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
                      {!address.isPrimary && (
                        <Button 
                          size="small"
                          startIcon={<FiCheck />}
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setAsPrimary(address.id)}
                        >
                          Set as Primary
                        </Button>
                      )}
                    </div>
                  </Paper>
                </motion.div>
              ))}
            </div>
          </div>
        </TabPanel>
      </Paper>
      
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