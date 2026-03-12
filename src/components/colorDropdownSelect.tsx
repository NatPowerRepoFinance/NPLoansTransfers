import React, { useState, useRef, useEffect } from "react";
import { Field, Label } from "@headlessui/react";

type ColorOption = {
  value: number;
  label: string;
  color: string;
};

type ColorDropdownSelectProps = {
  label?: string;
  value: string;
  options: ColorOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  erpIframe?: boolean;
};

const ColorDropdownSelect: React.FC<ColorDropdownSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  name,
  className = "",
  required,
  disabled = false,
  erpIframe = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-full">
      <Field>
        {label && (
          <Label
            className={`block text-base font-medium ${
              erpIframe ? "text-white" : "text-[#6C737F]"
            }`}
          >
            {label}:
          </Label>
        )}
        <div className="relative" ref={dropdownRef}>
          {/* Hidden input for form submission */}
          <input
            type="hidden"
            name={name}
            value={value}
            required={required}
          />

          {/* Dropdown trigger button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full border-2 rounded-lg py-1.5 px-3 text-base flex items-center gap-3
              ${erpIframe ? "border-gray-600 bg-[#1B1D22]" : "border-[#E5E7EB] bg-white"}
              ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-gray-400"}
              transition-colors ${className}`}
          >
            {selectedOption ? (
              <>
                <span
                  className="w-5 h-5 rounded shadow-sm flex-shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
                <span className={`flex-1 text-left text-sm ${erpIframe ? "text-white" : "text-gray-700"}`}>
                  {selectedOption.label}
                </span>
              </>
            ) : (
              <>
                <span className="w-5 h-5 rounded border-2 border-dashed border-gray-300 flex-shrink-0" />
                <span className="flex-1 text-left text-sm text-gray-400">
                  {placeholder}
                </span>
              </>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown options */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 border border-gray-200 rounded-lg bg-white shadow-xl overflow-hidden">
              {options.map((opt) => {
                const isSelected = String(opt.value) === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(String(opt.value));
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                      ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <span
                      className="w-5 h-5 rounded shadow-sm flex-shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="flex-1 text-sm text-gray-700">{opt.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Field>
    </div>
  );
};

export default ColorDropdownSelect;
