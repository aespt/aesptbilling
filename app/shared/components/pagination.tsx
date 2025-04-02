import React from "react";
import { Button, Box } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

/**
 * PaginationInfo interface defines the structure for pagination data
 * @interface PaginationInfo
 * @property {number} total - Total number of items
 * @property {number} totalPages - Total number of pages
 * @property {number} currentPage - Current active page (1-based)
 * @property {number} pageSize - Number of items per page
 * @property {boolean} hasNext - Whether there is a next page
 * @property {boolean} hasPrev - Whether there is a previous page
 */
export interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Props for the Pagination component
 * @interface PaginationProps
 * @property {PaginationInfo} paginationInfo - Object containing pagination information
 * @property {function} onPageChange - Callback when page changes
 * @property {function} onPageSizeChange - Callback when page size changes
 * @property {number[]} [pageSizeOptions] - Available page size options
 */
interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string; // Optional name of the items being paginated (e.g., "products", "orders")
}

/**
 * A reusable pagination component
 * 
 * @example
 * // Basic usage
 * <Pagination
 *   paginationInfo={paginationInfo}
 *   onPageChange={handlePageChange}
 *   onPageSizeChange={handlePageSizeChange}
 * />
 * 
 * @example
 * // With custom item name and page size options
 * <Pagination
 *   paginationInfo={paginationInfo}
 *   onPageChange={handlePageChange}
 *   onPageSizeChange={handlePageSizeChange}
 *   pageSizeOptions={[10, 20, 50, 100]}
 *   itemName="orders"
 * />
 */
const Pagination: React.FC<PaginationProps> = ({
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  itemName = "items",
}) => {
  const {
    total,
    totalPages,
    currentPage,
    pageSize,
    hasNext,
    hasPrev
  } = paginationInfo;

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 px-6 py-3 bg-white border border-gray-200 rounded-lg">
      <div className="text-sm text-gray-600">
        Showing <span className="font-bold">{total === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold">{Math.min(currentPage * pageSize, total)}</span> of <span className="font-bold">{total}</span> {itemName}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          disabled={!hasPrev}
          onClick={() => onPageChange(currentPage - 1)}
          startIcon={<NavigateBeforeIcon />}
          variant="outlined"
          size="small"
          sx={{ 
            minWidth: '40px', 
            padding: '6px 12px',
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            borderColor: 'rgba(0, 0, 0, 0.12)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.23)',
            },
            '&.Mui-disabled': {
              opacity: 0.5,
            }
          }}
        >
          Previous
        </Button>
        
        <div className="mx-2 text-sm bg-gray-50 px-4 py-1.5 rounded-md border border-gray-200">
          <span className="font-medium">{currentPage}</span>
          <span className="mx-1 text-gray-500">/</span>
          <span className="text-gray-600">{totalPages || 1}</span>
        </div>
        
        <Button
          disabled={!hasNext}
          onClick={() => onPageChange(currentPage + 1)}
          endIcon={<NavigateNextIcon />}
          variant="outlined"
          size="small"
          sx={{ 
            minWidth: '40px', 
            padding: '6px 12px',
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            borderColor: 'rgba(0, 0, 0, 0.12)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.23)',
            },
            '&.Mui-disabled': {
              opacity: 0.5,
            }
          }}
        >
          Next
        </Button>
        
        <Box sx={{ marginLeft: 2, position: 'relative' }}>
          <select
            className="appearance-none rounded-md border border-gray-200 px-3 py-1.5 pr-8 text-sm bg-white font-medium text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default Pagination; 