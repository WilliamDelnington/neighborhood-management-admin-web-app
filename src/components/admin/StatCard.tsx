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
        cardBg: "bg-ui_bg",
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

// So lon (vd tong nhan khau ca phuong) de tran, kho doc neu khong co dau
// phan cach hang nghin - chi dinh dang khi value la number "tho"; chuoi
// truyen san (vd formatMoney da dinh dang tien te) giu nguyen, khong dinh
// dang chong.
const formatStatValue = (value: string | number): string =>
    typeof value === "number"
        ? new Intl.NumberFormat("vi-VN").format(value)
        : value;

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
                    "absolute inset-y-0 left-0 w-1 rounded-l-xl",
                    style.accent,
                )}
            />
            {Icon && (
                <Icon
                    className={cn(
                        "pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 opacity-[0.07]",
                        style.iconColor,
                    )}
                />
            )}
            <div className="relative flex items-start justify-between gap-3 pl-2">
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
                        {formatStatValue(value)}
                    </div>
                </div>
                {Icon && (
                    <div
                        className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5",
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
                    "relative overflow-hidden rounded-xl border border-divider_01 p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg",
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
                "relative overflow-hidden rounded-xl border border-divider_01 p-4 shadow-sm",
                style.cardBg,
            )}
        >
            {body}
        </div>
    );
};

export default StatCard;
