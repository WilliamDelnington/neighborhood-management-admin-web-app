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
    { text: string; iconBg: string; iconColor: string; accent: string; cardBg: string }
> = {
    default: {
        text: "text-text_1",
        iconBg: "bg-blue_10",
        iconColor: "text-main",
        accent: "bg-main",
        cardBg: "bg-white",
    },
    warning: {
        text: "text-warning",
        iconBg: "bg-warning-soft",
        iconColor: "text-warning",
        accent: "bg-warning",
        cardBg: "bg-warning-soft/40",
    },
    danger: {
        text: "text-danger",
        iconBg: "bg-danger-soft",
        iconColor: "text-danger",
        accent: "bg-danger",
        cardBg: "bg-danger-soft/40",
    },
    success: {
        text: "text-success",
        iconBg: "bg-success-soft",
        iconColor: "text-success",
        accent: "bg-success",
        cardBg: "bg-success-soft/40",
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
                    "absolute inset-y-0 left-0 w-1 rounded-l-lg",
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
                            "mt-1.5 text-[28px] font-bold leading-tight tabular-nums",
                            style.text,
                        )}
                    >
                        {value}
                    </div>
                </div>
                {Icon && (
                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
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
                className={cn(
                    "relative overflow-hidden rounded-lg border border-divider_01 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    style.cardBg,
                )}
                onClick={onClick}
            >
                {body}
            </button>
        );
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg border border-divider_01 p-4 shadow-sm",
                style.cardBg,
            )}
        >
            {body}
        </div>
    );
};

export default StatCard;
