import React from "react";
import { Field, Label, Select } from "@headlessui/react";
import type { Option } from "@/lib/types";
import { getColorFromValue } from "@/lib/riskUtils";

type DropdownSelectProps = {
  label?: string;
  value: string;
  options?: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  className?: string;
  loading?: boolean;
  required?: boolean;
  useColorSystem?: boolean;
  disabled?: boolean;
  erpIframe?: boolean;
};

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  name,
  className = "",
  loading = false,
  required,
  useColorSystem = false,
  disabled = false,
  erpIframe = false,
}) => {
  const bgColor = useColorSystem
    ? getColorFromValue(value)
    : erpIframe
    ? "#1B1D22"
    : "white";

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
        <Select
          style={{
            backgroundColor: disabled
              ? erpIframe
                ? "#1B1D22"
                : "#F3F4F6"
              : bgColor,
          }}
          className={`block w-full truncate text-ellipsis pl-1 border-2 rounded-lg text-base
            ${
              erpIframe
                ? "border-gray-600 text-white"
                : "border-[#E5E7EB] text-black"
            }
            ${disabled ? "cursor-not-allowed opacity-70" : ""}
            ${className}`}
          name={name}
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          aria-placeholder={placeholder}
          aria-label={label}
          required={required}
          disabled={loading || disabled}
        >
          <option
            className={`text-sm ${
              erpIframe
                ? "bg-[#1B1D22] text-gray-300"
                : "bg-white text-[#6C737F]"
            }`}
            value=""
          >
            {loading ? "Loading..." : placeholder}
          </option>
          {options?.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className={`text-sm truncate text-ellipsis ${
                erpIframe ? "bg-[#1B1D22] text-white" : "bg-white text-black"
              }`}
              title={opt.label}
            >
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
};

export default DropdownSelect;
