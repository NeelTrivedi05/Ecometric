import React, { createContext, useContext, useState } from 'react';

const TableContext = createContext({
  selectionMode: 'none',
  selectedIds: [],
  toggleSelect: () => {},
  toggleSelectAll: () => {},
});

export const TableCard = {
  Root: ({ children, className = '', style = {} }) => (
    <div
      className={`table-card-root ${className}`}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe7dd',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(16, 52, 33, 0.04)',
        overflow: 'hidden',
        fontFamily: "'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        ...style,
      }}
    >
      {children}
    </div>
  ),

  Header: ({ title, description, contentTrailing, className = '', style = {} }) => (
    <div
      className={`table-card-header ${className}`}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid #dfe7dd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        ...style,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#16231b',
            letterSpacing: '-0.015em',
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '12px',
              color: '#5b6f62',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {contentTrailing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {contentTrailing}
        </div>
      )}
    </div>
  ),
};

export function Table({
  children,
  selectionMode = 'none',
  selectedIds = [],
  onSelectionChange,
  className = '',
  style = {},
  'aria-label': ariaLabel,
  ...props
}) {
  const [internalSelected, setInternalSelected] = useState(selectedIds);

  const activeSelected = onSelectionChange ? selectedIds : internalSelected;

  const toggleSelect = (id) => {
    let next;
    if (activeSelected.includes(id)) {
      next = activeSelected.filter((item) => item !== id);
    } else {
      next = [...activeSelected, id];
    }
    if (onSelectionChange) {
      onSelectionChange(next);
    } else {
      setInternalSelected(next);
    }
  };

  const toggleSelectAll = (allIds = []) => {
    let next = [];
    if (activeSelected.length !== allIds.length) {
      next = [...allIds];
    }
    if (onSelectionChange) {
      onSelectionChange(next);
    } else {
      setInternalSelected(next);
    }
  };

  return (
    <TableContext.Provider
      value={{
        selectionMode,
        selectedIds: activeSelected,
        toggleSelect,
        toggleSelectAll,
      }}
    >
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table
          className={`table-nature ${className}`}
          aria-label={ariaLabel}
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            textAlign: 'left',
            ...style,
          }}
          {...props}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

Table.Header = function TableHeader({ children, className = '', style = {} }) {
  return (
    <thead
      className={`table-header-nature ${className}`}
      style={{
        backgroundColor: '#f8faf6',
        borderBottom: '1px solid #dfe7dd',
        ...style,
      }}
    >
      <tr>{children}</tr>
    </thead>
  );
};

Table.Head = function TableHead({
  id,
  label,
  children,
  isRowHeader,
  className = '',
  style = {},
  ...props
}) {
  const { selectionMode } = useContext(TableContext);

  return (
    <th
      scope={isRowHeader ? 'row' : 'col'}
      className={className}
      style={{
        padding: '11px 16px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#5b6f62',
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {label || children}
    </th>
  );
};

Table.Body = function TableBody({ items = [], children, className = '', style = {} }) {
  return (
    <tbody className={className} style={style}>
      {Array.isArray(items) && typeof children === 'function'
        ? items.map((item, idx) => children(item, idx))
        : children}
    </tbody>
  );
};

Table.Row = function TableRow({
  id,
  children,
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const { selectionMode, selectedIds, toggleSelect } = useContext(TableContext);
  const isSelected = id ? selectedIds.includes(id) : false;

  return (
    <tr
      className={`table-row-nature ${isSelected ? 'row-selected' : ''} ${className}`}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
      style={{
        borderBottom: '1px solid #edf2ec',
        backgroundColor: isSelected ? '#eef7f1' : 'inherit',
        transition: 'background-color 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8faf6';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'inherit';
      }}
      {...props}
    >
      {children}
    </tr>
  );
};

Table.Cell = function TableCell({
  children,
  className = '',
  style = {},
  ...props
}) {
  return (
    <td
      className={className}
      style={{
        padding: '12px 16px',
        color: '#2f3b33',
        verticalAlign: 'middle',
        fontFeatureSettings: "'tnum' 1, 'zero' 1",
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  );
};

export default Table;
