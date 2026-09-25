import * as React from "react";
import { cn } from "@lib/utils";
import { DATE_INPUT_TYPES, DateInput, type DateInputType } from "./date-input";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        // Ngay/thang luon hien thi dd/mm/yyyy bat ke ngon ngu trinh duyet
        // (xem date-input.tsx).
        if (type && DATE_INPUT_TYPES.includes(type)) {
            return (
                <DateInput
                    ref={ref}
                    type={type as DateInputType}
                    className={className}
                    {...props}
                />
            );
        }
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all duration-150 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:border-text_3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Input.displayName = "Input";

export { Input };
