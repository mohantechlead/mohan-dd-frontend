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
  /**
   * When the typed text matches more than one option’s display (e.g. same name, different internal codes),
   * prefer the option whose `internalCode` equals this hint (usually the line’s current internal_code).
   */
  tieBreakHint?: string;
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
  tieBreakHint,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  /** Sync local input to a real list selection so form state (e.g. item_name) is not left empty after typing. */
  function commitQueryOnBlur() {
    const q = query.trim();
    if (!q) {
      onChange("", undefined);
      setQuery("");
      setShowDropdown(false);
      return;
    }
    const lower = q.toLowerCase();
    const matches = options.filter(
      (o) => o.display.trim().toLowerCase() === lower
    );
    if (matches.length === 0) {
      setQuery(value);
      setShowDropdown(false);
      return;
    }
    let pick: DropdownOption | undefined;
    if (matches.length === 1) {
      pick = matches[0];
    } else {
      const hint = String(tieBreakHint ?? "").trim();
      if (hint) {
        pick = matches.find(
          (o) =>
            String((o as { internalCode?: string }).internalCode ?? "").trim() === hint
        );
      }
    }
    if (!pick) {
      setQuery(value);
      setShowDropdown(false);
      return;
    }
    onChange(pick.value, pick);
    setQuery(pick.display);
    setShowDropdown(false);
  }

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
        onBlur={commitQueryOnBlur}
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
          {filtered.map((opt, idx) => (
            <button
              type="button"
              key={`${String(opt.value)}-${idx}-${opt.display}`}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
              style={{ backgroundColor: "#ffffff" }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
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
