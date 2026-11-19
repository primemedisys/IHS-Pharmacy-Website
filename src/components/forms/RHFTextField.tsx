"use client";

import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";

export type RHFTextFieldProps<T extends FieldValues> = {
  name: Path<T>;
} & Omit<TextFieldProps, "name" | "error" | "helperText" | "value" | "defaultValue">;

export function RHFTextField<T extends FieldValues>({ name, helperText, ...props }: RHFTextFieldProps<T> & { helperText?: string }) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? helperText}
          {...props}
        />
      )}
    />
  );
}
