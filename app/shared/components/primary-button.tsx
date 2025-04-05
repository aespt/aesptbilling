import { Button } from '@mui/material';
interface PrimaryButtonProps {
  label: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
}

export default function PrimaryButton({ label, onClick, type = 'button' }: PrimaryButtonProps) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      type={type}
      className="bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-300 hover:scale-105"
    >
      {label}
    </Button>
  );
}
