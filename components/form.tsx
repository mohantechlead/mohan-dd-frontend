"use client";

import {
  FormProvider,
  useForm,
  FieldValues,
  Path,
  PathValue,
  DefaultValues,
} from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SearchableDropdown, type DropdownOption } from "./searchable-dropdown";

interface DropdownConfig {
  url: string;
  displayKey: string;
}

interface DependentDropdownConfig {
  dependsOn: Path<FieldValues>;
  urlTemplate: string; // e.g. "/api/inventory/shipping-invoices?order_number={value}"
  displayKey: string;
}

interface Field<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  dropdownConfig?: DropdownConfig;
  dependentDropdownConfig?: DependentDropdownConfig;
}

interface FormProps<T extends FieldValues> {
  fields: Field<T>[];
  onSubmit: (values: T) => void;
  submitText: string;
  defaultValues?: DefaultValues<T>;
  children?: React.ReactNode;
}

function FormField<T extends FieldValues>({
  field,
  methods,
}: {
  field: Field<T>;
  methods: ReturnType<typeof useForm<T>>;
}) {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const value = methods.watch(field.name) as string;
  const dependentValue = field.dependentDropdownConfig
    ? (methods.watch(field.dependentDropdownConfig.dependsOn as Path<T>) as string)
    : undefined;

  useEffect(() => {
    if (field.dropdownConfig) {
      const { url, displayKey } = field.dropdownConfig;
      fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Record<string, unknown>[]) => {
          setOptions(
            data.map((item) => ({
              value: String(item[displayKey] ?? ""),
              display: String(item[displayKey] ?? ""),
            }))
          );
        })
        .catch(() => {});
      return;
    }
    if (field.dependentDropdownConfig) {
      const { urlTemplate, displayKey } = field.dependentDropdownConfig;
      const depVal = dependentValue?.trim();
      if (!depVal) {
        setOptions([]);
        return;
      }
      const url = urlTemplate.replace("{value}", encodeURIComponent(depVal));
      fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Record<string, unknown>[]) => {
          const newOptions = data.map((item) => ({
            value: String(item[displayKey] ?? ""),
            display: String(item[displayKey] ?? ""),
          }));
          setOptions(newOptions);
          const currentVal = methods.getValues(field.name);
          if (currentVal && !newOptions.some((o) => o.value === currentVal)) {
            methods.setValue(field.name, "" as PathValue<T, Path<T>>);
          }
        })
        .catch(() => setOptions([]));
    }
  }, [
    field.dropdownConfig?.url,
    field.dropdownConfig?.displayKey,
    field.dependentDropdownConfig?.urlTemplate,
    field.dependentDropdownConfig?.displayKey,
    field.dependentDropdownConfig?.dependsOn,
    dependentValue,
  ]);

  // Clear dependent field when parent is cleared
  useEffect(() => {
    if (field.dependentDropdownConfig && value && !dependentValue?.trim()) {
      methods.setValue(field.name, "" as PathValue<T, Path<T>>);
    }
  }, [dependentValue]);

  if (field.dropdownConfig || field.dependentDropdownConfig) {
    const isDisabled = field.dependentDropdownConfig && !dependentValue?.trim();
    return (
      <div className="flex flex-col gap-1">
        <Label>{field.label}</Label>
        <SearchableDropdown
          value={value || ""}
          onChange={(val) => methods.setValue(field.name, val as PathValue<T, Path<T>>)}
          options={options}
          placeholder={
            isDisabled
              ? "Select Order No first"
              : field.placeholder
          }
          disabled={isDisabled}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Label>{field.label}</Label>
      <Input
        type={field.type || "text"}
        placeholder={field.placeholder}
        {...methods.register(field.name)}
      />
    </div>
  );
}

export function Form<T extends FieldValues>({
  fields,
  onSubmit,
  submitText,
  defaultValues,
  children,
}: FormProps<T>) {
  const methods = useForm<T>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form
        className="flex flex-col gap-4"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        {fields.map((field) => (
          <FormField key={String(field.name)} field={field} methods={methods} />
        ))}

        {children}

        <Button type="submit">{submitText}</Button>
      </form>
    </FormProvider>
  );
}
