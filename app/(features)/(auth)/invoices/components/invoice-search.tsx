import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { TextField, InputAdornment, IconButton } from '@mui/material';

interface InvoiceSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenModal: () => void;
}

export default function InvoiceSearch({
  searchTerm,
  onSearchChange,
  onOpenModal,
}: InvoiceSearchProps) {
  return (
    <div className="mb-6 flex w-full items-center space-x-2">
      <TextField
        fullWidth
        label="Search Invoice by Number"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <IconButton
        color="primary"
        onClick={onOpenModal}
        aria-label="View previous invoices"
        className="bg-gray-100 hover:bg-gray-200"
      >
        <HistoryIcon />
      </IconButton>
    </div>
  );
}
