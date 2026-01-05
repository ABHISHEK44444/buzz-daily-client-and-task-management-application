import React from 'react';

interface DatePickerProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '', placeholder = 'dd/mm/yyyy', required }) => {
  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    // Try using the modern showPicker() API
    if ('showPicker' in input) {
      try {
        (input as any).showPicker();
      } catch (error) {
        // Fallback or ignore if blocked
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* CSS Hack: Expand the WebKit calendar picker indicator to fill the entire input.
          This ensures clicking anywhere on the input triggers the picker in WebKit browsers. */}
      <style>{`
        .custom-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: auto;
          height: auto;
          color: transparent;
          background: transparent;
          cursor: pointer;
        }
      `}</style>
      
      <div className={`flex items-center justify-between ${className} pointer-events-none select-none`}>
        <span className={`truncate ${!value ? 'text-slate-400' : 'text-inherit'}`}>
          {value ? formatDate(value) : placeholder}
        </span>
        <i className="fa-regular fa-calendar text-slate-400 flex-shrink-0 ml-2"></i>
      </div>
      <input
        type="date"
        required={required}
        value={value}
        onChange={onChange}
        onClick={handleClick}
        className="custom-date-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};