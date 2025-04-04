import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import { useState } from 'react';

interface MenuItem {
  name: string;
  displayText: string;
  icon: React.ReactNode;
}

interface ActionMenuProps {
  menuItems: MenuItem[];
  onMenuItemClick: (menuName: string) => void;
}

export default function ActionMenu({ menuItems, onMenuItemClick }: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (menuName: string) => {
    onMenuItemClick(menuName);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small" className="text-gray-600 hover:text-gray-900">
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          className: 'shadow-sm rounded-lg min-w-[160px] border border-gray-100',
        }}
        disableScrollLock={true}
        slotProps={{
          paper: {
            sx: {
              overflow: 'visible',
            },
          },
        }}
      >
        {menuItems.map(item => (
          <MenuItem
            key={item.name}
            onClick={() => handleMenuItemClick(item.name)}
            className="px-4 py-2 hover:bg-gray-50/50"
          >
            <ListItemIcon className="min-w-[32px]">{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.displayText}
              primaryTypographyProps={{
                className: 'text-sm text-gray-500',
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
