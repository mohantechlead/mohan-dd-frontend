"use client";

import { FormProvider, useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Field {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}

interface FormProps<T> {
  fields: Field[];
  onSubmit: (values: T) => void;
  submitText: string;
  children?: React.ReactNode;
}

export function Form<T>({ fields, onSubmit, submitText, children }: FormProps<T>) {
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
              {...methods.register(field.name as any)}
            />
          </div>
        ))}

        {children}

        <Button type="submit">{submitText}</Button>
      </form>
    </FormProvider>
  );
}

