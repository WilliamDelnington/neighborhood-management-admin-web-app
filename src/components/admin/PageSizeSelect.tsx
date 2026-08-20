import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";

export interface PageSizeSelectProps {
    value: number;
    onChange: (value: number) => void;
    options?: number[];
    disabled?: boolean;
}

const DEFAULT_OPTIONS = [10, 20, 50, 100];

/** Dropdown chon so dong/trang - dat cung hang voi thanh tim kiem/loc, tach
 * rieng voi thanh dieu huong trang (Pagination) o cuoi bang. */
const PageSizeSelect: React.FC<PageSizeSelectProps> = ({
    value,
    onChange,
    options = DEFAULT_OPTIONS,
    disabled,
}) => (
    <div className="flex shrink-0 items-center gap-2 text-sm text-text_2">
        <span className="whitespace-nowrap">Số dòng/trang</span>
        <Select
            value={String(value)}
            onValueChange={v => onChange(Number(v))}
            disabled={disabled}
        >
            <SelectTrigger className="h-9 w-[76px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem key={option} value={String(option)}>
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

export default PageSizeSelect;
