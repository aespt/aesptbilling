import { useState } from 'react';

import type { SnackbarType } from '../components/snackbar';

interface UseSnackbarReturn {
  isOpen: boolean;
  message: string;
  type: SnackbarType;
  showSnackbar: (message: string, type?: SnackbarType) => void;
  hideSnackbar: () => void;
}

export default function useSnackbar(): UseSnackbarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setMessage(message);
    setType(type);
    setIsOpen(true);
  };

  const hideSnackbar = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    message,
    type,
    showSnackbar,
    hideSnackbar,
  };
}
