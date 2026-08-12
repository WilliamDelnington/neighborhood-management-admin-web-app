import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@lib/utils";

export interface StatCardProps {
    label: string;
    value: string | number;
    tone?: "default" | "warning" | "danger" | "success";
    icon?: LucideIcon;
    onClick?: () => void;
}

const TONE_STYLES: Record<
    NonNullable<StatCardProps["tone"]>,
    { text: string; iconBg: string; iconColor: string; accent: string }
> = {
    default: {
        text: "text-text_1",
        iconBg: "bg-blue_10",
        iconColor: "text-main",
        accent: "bg-main",
    },
    warning: {
        text: "text-amber-600",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        accent: "bg-amber-400",
    },
    danger: {
        text: "text-red-600",
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
        accent: "bg-red-500",
    },
    success: {
        text: "text-green-600",
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
        accent: "bg-green-500",
    },
};

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    tone = "default",
    icon: Icon,
    onClick,
}) => {
    const style = TONE_STYLES[tone];

    const body = (
        <>
            <span
                className={cn(
                    "absolute inset-y-0 left-0 w-1 rounded-l-2xl",
                    style.accent,
                )}
            />
            <div className="flex items-start justify-between gap-3 pl-2">
                <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-text_2">
                        {label}
                    </div>
                    <div
                        className={cn(
                            "mt-1.5 text-2xl font-bold tabular-nums",
                            style.text,
                        )}
                    >
                        {value}
                    </div>
                </div>
                {Icon && (
                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            style.iconBg,
                        )}
                    >
                        <Icon className={cn("h-[18px] w-[18px]", style.iconColor)} />
                    </div>
                )}
            </div>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                className="relative overflow-hidden rounded-2xl border border-divider_01 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={onClick}
            >
                {body}
            </button>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
            {body}
        </div>
    );
};

export default StatCard;
