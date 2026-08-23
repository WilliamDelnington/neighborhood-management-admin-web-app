import * as React from "react";
import { cn } from "@lib/utils";

export type BadgeTone = "gray" | "blue" | "yellow" | "green" | "red";

const TONE_CLASS: Record<BadgeTone, string> = {
    gray: "bg-ng_10 text-text_2",
    blue: "bg-blue_10 text-primary",
    yellow: "bg-warning-soft text-warning",
    green: "bg-success-soft text-success",
    red: "bg-danger-soft text-danger",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
}

function Badge({ className, tone = "gray", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex h-[26px] items-center rounded-md px-2 text-xs font-medium",
                TONE_CLASS[tone],
                className,
            )}
            {...props}
        />
    );
}

export { Badge };
