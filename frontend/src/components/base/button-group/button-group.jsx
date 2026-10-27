import React from 'react';

export function ButtonGroup({ children, selectedKeys = [], onSelectionChange, className = '' }) {
  return (
    <div className={`base-button-group ${className}`} role="group">
      {React.Children.map(children, (child) => (
        React.isValidElement(child)
          ? React.cloneElement(child, {
              isSelected: selectedKeys.includes(child.props.id),
              onSelect: onSelectionChange,
            })
          : child
      ))}
    </div>
  );
}

export function ButtonGroupItem({ id, children, isSelected = false, onSelect }) {
  return (
    <button
      type="button"
      className={`base-button-group-item ${isSelected ? 'selected' : ''}`}
      aria-pressed={isSelected}
      onClick={() => onSelect?.([id])}
    >
      {children}
    </button>
  );
}
