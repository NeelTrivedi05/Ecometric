import React from 'react';

export function Input({
  id,
  label,
  hint,
  tooltip,
  isRequired = false,
  leadingIcon: LeadingIcon,
  className = '',
  ...props
}) {
  const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`base-input ${className}`}>
      {label && (
        <label className="base-input__label" htmlFor={inputId}>
          <span>{label}</span>
          {isRequired && <span className="base-input__required" aria-hidden="true">*</span>}
          {tooltip && <span className="base-input__tooltip" title={tooltip} aria-label={tooltip}>?</span>}
        </label>
      )}
      <div className="base-input__control">
        {LeadingIcon && <LeadingIcon className="base-input__icon" size={17} aria-hidden="true" />}
        <input id={inputId} {...props} required={isRequired || props.required} />
      </div>
      {hint && <p className="base-input__hint">{hint}</p>}
    </div>
  );
}

export default Input;
