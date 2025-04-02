"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab, Box, TextField, Typography, Alert, Paper } from "@mui/material";
import PrimaryButton from "@/app/shared/components/primary-button";
import { useAuth } from "@/lib/hooks/useAuth";
import PageHeader from "@/app/shared/components/page-header";
import Snackbar from "@/app/shared/components/snackbar";
import useSnackbar from "@/app/shared/hooks/useSnackbar";

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Use our custom snackbar hook
  const { isOpen, message, type, showSnackbar, hideSnackbar } = useSnackbar();

  // Initialize profile data when user data is available
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      showSnackbar("Profile updated successfully", "success");
    } catch (error) {
      console.error("Profile update error:", error);
      showSnackbar(error instanceof Error ? error.message : "Failed to update profile", "error");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar("New passwords do not match", "error");
      return;
    }

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      showSnackbar("Password changed successfully", "success");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Password change error:", error);
      showSnackbar(error instanceof Error ? error.message : "Failed to change password", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16 px-4 md:px-6 py-8">
      <div className="max-w-screen-2xl mx-auto">
        <PageHeader
          heading="Profile Settings"
          buttonText=""
          onButtonClick={() => {}}
        />

        <Paper className="mt-6 rounded-lg overflow-hidden border border-gray-100" elevation={0}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              className="bg-gray-50"
            >
              <Tab 
                label="Profile Information" 
                className="text-gray-700"
              />
              <Tab 
                label="Change Password" 
                className="text-gray-700"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
              <TextField
                fullWidth
                label="Username"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                required
                className="bg-white"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
                className="bg-white"
              />
              <PrimaryButton label="Update Profile" type="submit" />
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                required
                className="bg-white"
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                className="bg-white"
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                className="bg-white"
              />
              <PrimaryButton label="Change Password" type="submit" />
            </form>
          </TabPanel>
        </Paper>
      </div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={isOpen}
        message={message}
        type={type}
        onClose={hideSnackbar}
      />
    </div>
  );
} 