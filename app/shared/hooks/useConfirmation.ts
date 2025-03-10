import { useState } from 'react';

interface UseConfirmationReturn {
  isConfirmationOpen: boolean;
  confirmationTitle: string;
  confirmationMessage: string;
  confirmButtonText: string;
  cancelButtonText: string;
  confirmButtonColor: 'red' | 'blue' | 'green';
  showConfirmation: (options: {
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'red' | 'blue' | 'green';
  }) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export default function useConfirmation(): UseConfirmationReturn {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmButtonText, setConfirmButtonText] = useState('Confirm');
  const [cancelButtonText, setCancelButtonText] = useState('Cancel');
  const [confirmButtonColor, setConfirmButtonColor] = useState<'red' | 'blue' | 'green'>('red');
  
  // For resolving the promise
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>(() => () => {});

  const showConfirmation = ({
    title,
    message,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    confirmButtonColor = 'red'
  }: {
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'red' | 'blue' | 'green';
  }): Promise<boolean> => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmButtonText(confirmButtonText);
    setCancelButtonText(cancelButtonText);
    setConfirmButtonColor(confirmButtonColor);
    setIsConfirmationOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsConfirmationOpen(false);
    resolvePromise(true);
  };

  const handleCancel = () => {
    setIsConfirmationOpen(false);
    resolvePromise(false);
  };

  return {
    isConfirmationOpen,
    confirmationTitle,
    confirmationMessage,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    showConfirmation,
    handleConfirm,
    handleCancel
  };
} 