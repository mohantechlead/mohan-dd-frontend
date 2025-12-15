"use client";

import { FormProvider, useForm, FieldValues, Path } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Field<T extends FieldValues> {
  name: Path<T>; // key of the form data type
  label: string;
  type?: string;
  placeholder?: string;
}

interface FormProps<T extends FieldValues> {
  fields: Field<T>[];
  onSubmit: (values: T) => void;
  submitText: string;
  children?: React.ReactNode;
}

export function Form<T extends FieldValues>({
  fields,
  onSubmit,
  submitText,
  children,
}: FormProps<T>) {
  const methods = useForm<T>();

  return (
    <FormProvider {...methods}>
      <form
        className="flex flex-col gap-4"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1">
            <Label>{field.label}</Label>
            <Input
              type={field.type || "text"}
              placeholder={field.placeholder}
              {...methods.register(field.name)}
            />
          </div>
        ))}

        {children}

        <Button type="submit">{submitText}</Button>
      </form>
    </FormProvider>
  );
}
