interface SecondaryButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function SecondaryButton({ label, onClick }: SecondaryButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border-2 border-blue-500 bg-white px-4 py-1 text-blue-500 hover:bg-blue-50"
    >
      {label}
    </button>
  );
}
