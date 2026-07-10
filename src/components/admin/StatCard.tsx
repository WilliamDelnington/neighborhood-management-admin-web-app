import React from "react";
import { cn } from "@lib/utils";

export interface StatCardProps {
    label: string;
    value: string | number;
    tone?: "default" | "warning" | "danger" | "success";
    onClick?: () => void;
}

const TONE_CLASS: Record<NonNullable<StatCardProps["tone"]>, string> = {
    default: "text-main",
    warning: "text-amber-500",
    danger: "text-red-500",
    success: "text-green-600",
};

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    tone = "default",
    onClick,
}) => {
    const body = (
        <>
            <div className="text-xs text-text_2">{label}</div>
            <div className={cn("mt-1 text-2xl font-semibold", TONE_CLASS[tone])}>
                {value}
            </div>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                className="rounded-2xl border border-divider_01 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                onClick={onClick}
            >
                {body}
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
            {body}
        </div>
    );
};

export default StatCard;
