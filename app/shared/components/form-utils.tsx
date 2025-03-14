'use client';

import { Button, ButtonProps } from "@mui/material";
import { ReactNode } from "react";

interface FormButtonProps extends ButtonProps {
  children: ReactNode;
  small?: boolean;
}

/**
 * FormButton component that ensures consistent styling with form fields
 * This button will have the same height as MUI form fields for better alignment
 */
export function FormButton({ children, small = false, className = "", ...props }: FormButtonProps) {
  const sizeClass = small ? "form-button-small" : "form-button";
  
  return (
    <Button
      {...props}
      className={`${sizeClass} ${className}`}
    >
      {children}
    </Button>
  );
}

/**
 * Error message component for form validation errors
 */
export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  
  return (
    <p className="text-sm text-red-600 mt-1">{message}</p>
  );
} 