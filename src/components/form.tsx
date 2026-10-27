import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
  error,
  id: providedId,
  ...inputProps
}: any) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        {...inputProps}
      />
      {(error || hint) && (
        <p
          id={`${id}-help`}
          role={error ? "alert" : undefined}
          className={cn(
            "text-xs leading-5",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function SelectField({ label, value, onChange, items, hint }: any) {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item: any) => (
            <SelectItem key={item.value || item} value={item.value || item}>
              {item.label || item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
export function Panel({ title, description, children, className }: any) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
