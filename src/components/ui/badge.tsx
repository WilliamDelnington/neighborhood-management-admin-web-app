import * as React from "react";
import { cn } from "@lib/utils";

export type BadgeTone = "gray" | "blue" | "yellow" | "green" | "red";

const TONE_CLASS: Record<BadgeTone, string> = {
    gray: "bg-ng_10 text-text_2",
    blue: "bg-blue_10 text-primary",
    yellow: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
}

function Badge({ className, tone = "gray", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                TONE_CLASS[tone],
                className,
            )}
            {...props}
        />
    );
}

export { Badge };
