
import React, { useState, useEffect, useRef } from 'react';

export interface Country {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "India", code: "IN", dial_code: "+91", flag: "🇮🇳" },
  { name: "United States", code: "US", dial_code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dial_code: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dial_code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dial_code: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dial_code: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dial_code: "+33", flag: "🇫🇷" },
  { name: "Japan", code: "JP", dial_code: "+81", flag: "🇯🇵" },
  { name: "China", code: "CN", dial_code: "+86", flag: "🇨🇳" },
  { name: "Brazil", code: "BR", dial_code: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dial_code: "+52", flag: "🇲🇽" },
  { name: "Russia", code: "RU", dial_code: "+7", flag: "🇷🇺" },
  { name: "South Africa", code: "ZA", dial_code: "+27", flag: "🇿🇦" },
  { name: "UAE", code: "AE", dial_code: "+971", flag: "🇦🇪" },
  { name: "Singapore", code: "SG", dial_code: "+65", flag: "🇸🇬" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, error, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCountryFromValue = (): Country => {
    if (selectedCountryCode) {
      const selected = COUNTRIES.find(c => c.code === selectedCountryCode);
      if (selected && value.startsWith(selected.dial_code)) {
        return selected;
      }
    }
    if (!value) return COUNTRIES.find(c => c.code === 'IN')!;
    const sorted = [...COUNTRIES].sort((a, b) => b.dial_code.length - a.dial_code.length);
    return sorted.find(c => value.startsWith(c.dial_code)) || COUNTRIES.find(c => c.code === 'IN')!;
  };

  const activeCountry = getCountryFromValue();
  const phoneNumber = value.startsWith(activeCountry.dial_code) 
    ? value.slice(activeCountry.dial_code.length) 
    : value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountryCode(country.code);
    onChange(`${country.dial_code}${phoneNumber}`);
    setIsOpen(false);
    setSearch('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9\s-]/g, ''); 
    onChange(`${activeCountry.dial_code}${input}`);
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dial_code.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className={`flex rounded-lg shadow-sm ${disabled ? 'opacity-60' : ''}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-3 text-sm font-medium text-center text-slate-700 bg-slate-100 border border-slate-300 rounded-l-lg hover:bg-slate-200 focus:ring-1 focus:outline-none focus:ring-accent focus:z-20 ${error ? 'border-red-500' : ''}`}
        >
          <span className="mr-2 text-lg">{activeCountry.flag}</span>
          <span>{activeCountry.dial_code}</span>
          {!disabled && <i className="fa-solid fa-chevron-down ml-2 text-[10px] text-slate-500"></i>}
        </button>
        <div className="relative w-full">
          <input
            type="tel"
            disabled={disabled}
            className={`block w-full rounded-r-lg border-l-0 border-slate-300 bg-[#fffef5] text-slate-900 focus:ring-accent focus:border-accent block min-w-0 w-full text-sm p-2.5 transition-colors focus:z-20 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="98765 43210"
            value={phoneNumber}
            onChange={handlePhoneChange}
            required={required}
            maxLength={15} 
          />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
          <i className="fa-solid fa-circle-exclamation"></i>
          {error}
        </p>
      )}
      {isOpen && !disabled && (
        <div className="absolute z-50 bg-white divide-y divide-slate-100 rounded-lg shadow-xl w-72 border border-slate-200 max-h-64 flex flex-col mt-1">
          <div className="p-2 sticky top-0 bg-white border-b border-slate-100 rounded-t-lg z-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="fa-solid fa-search text-slate-400 text-xs"></i>
              </div>
              <input 
                type="text" 
                className="block w-full p-2 pl-9 text-xs text-slate-900 border border-slate-300 rounded-md bg-slate-50 focus:ring-accent focus:border-accent" 
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <ul className="py-1 overflow-y-auto flex-1 custom-scrollbar">
            {filteredCountries.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-slate-100 transition-colors ${activeCountry.code === country.code ? 'bg-blue-50 text-accent font-medium' : 'text-slate-700'}`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="inline-flex items-center justify-center w-6 text-lg mr-3">{country.flag}</span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-slate-400 text-xs ml-2 font-mono">{country.dial_code}</span>
                </button>
              </li>
            ))}
            {filteredCountries.length === 0 && (
                <li className="px-4 py-3 text-xs text-slate-500 text-center">No countries found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
