import React from 'react';
import {
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Section,
  Separator,
} from 'react-aria-components';

function Root({ children }) {
  return <MenuTrigger>{children}</MenuTrigger>;
}

function DropdownPopover({ children, className = '', ...props }) {
  return <Popover className={`dropdown-popover ${className}`} {...props}>{children}</Popover>;
}

function DropdownMenu({ children, className = '', ...props }) {
  return <Menu className={`dropdown-menu ${className}`} {...props}>{children}</Menu>;
}

function DropdownSection({ children, className = '', ...props }) {
  return <Section className={`dropdown-section ${className}`} {...props}>{children}</Section>;
}

function DropdownItem({ children, addon, className = '', ...props }) {
  return (
    <MenuItem className={`dropdown-item ${className}`} {...props}>
      <span>{children}</span>
      {addon && <span className="dropdown-item-addon">{addon}</span>}
    </MenuItem>
  );
}

export const Dropdown = {
  Root,
  Popover: DropdownPopover,
  Menu: DropdownMenu,
  Section: DropdownSection,
  Item: DropdownItem,
  Separator: ({ className = '', ...props }) => <Separator className={`dropdown-separator ${className}`} {...props} />,
};
