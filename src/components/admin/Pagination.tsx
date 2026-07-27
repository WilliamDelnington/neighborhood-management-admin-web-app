import React from "react";
import { Button } from "@components/ui/button";

type PageToken = number | "ellipsis";

const buildPageList = (page: number, totalPages: number): PageToken[] => {
    const delta = 1;
    const middle: number[] = [];
    for (
        let i = Math.max(2, page - delta);
        i <= Math.min(totalPages - 1, page + delta);
        i++
    ) {
        middle.push(i);
    }

    const tokens: PageToken[] = [1];
    if (middle[0] > 2) tokens.push("ellipsis");
    tokens.push(...middle);
    if (middle[middle.length - 1] < totalPages - 1) tokens.push("ellipsis");
    tokens.push(totalPages);
    return tokens;
};

export interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    onPageChange,
    disabled,
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-3 flex items-center justify-center gap-1">
            <Button
                variant="outline"
                size="sm"
                disabled={disabled || page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                Trước
            </Button>
            {buildPageList(page, totalPages).map((token, index) =>
                token === "ellipsis" ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm text-text_2"
                    >
                        …
                    </span>
                ) : (
                    <Button
                        key={token}
                        variant={token === page ? "default" : "outline"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => onPageChange(token)}
                    >
                        {token}
                    </Button>
                ),
            )}
            <Button
                variant="outline"
                size="sm"
                disabled={disabled || page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Sau
            </Button>
        </div>
    );
};

export default Pagination;
