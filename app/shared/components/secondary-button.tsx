interface SecondaryButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  startIcon?: React.ReactNode;
}

export default function SecondaryButton({
  label,
  onClick,
  disabled,
  startIcon,
}: SecondaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border-2 border-blue-500 ${
        disabled
          ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'
          : 'bg-white text-blue-500 hover:bg-blue-50'
      } flex items-center justify-center px-4 py-1 transition-colors`}
    >
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {label}
    </button>
  );
}
