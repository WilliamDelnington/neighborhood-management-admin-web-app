import React from "react";
import { cn } from "@lib/utils";

/**
 * Boc thanh bo loc (page size/tim kiem/cac select) trong 1 card dong bo voi
 * card cua bang ben duoi, dung grid tu dong xuong hang deu thay vi flex-wrap
 * (de khong bi lech hang khi so luong bo loc khac nhau giua cac trang).
 */
const FilterBar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    className,
    children,
    ...props
}) => (
    <div
        className={cn(
            "mb-4 grid grid-cols-1 gap-3 rounded-lg border border-divider_01 bg-ui_bg p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            className,
        )}
        {...props}
    >
        {children}
    </div>
);

export default FilterBar;
