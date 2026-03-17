"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  display: string;
  subtext?: string;
  [key: string]: string | undefined; // allow extra fields like internalCode
}

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string, option?: DropdownOption) => void;
  options: DropdownOption[];
  placeholder?: string;
  filterKey?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = "Search...",
  filterKey = "display",
  className,
  inputClassName,
  disabled,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options
    .filter((opt) =>
      opt[filterKey as keyof DropdownOption]
        ?.toString()
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .slice(0, 20);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={cn(
          "flex h-9 w-full rounded-md border border-input px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          inputClassName
        )}
        style={{ backgroundColor: "#ffffff" }}
      />
      {showDropdown && filtered.length > 0 && (
        <div
          className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg"
          style={{ backgroundColor: "#ffffff" }}
        >
          {filtered.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
              style={{ backgroundColor: "#ffffff" }}
              onClick={() => {
                onChange(opt.value, opt);
                setQuery(opt.display);
                setShowDropdown(false);
              }}
            >
              {opt.display}
              {opt.subtext ? (
                <span className="ml-2 text-xs text-muted-foreground">{opt.subtext}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
