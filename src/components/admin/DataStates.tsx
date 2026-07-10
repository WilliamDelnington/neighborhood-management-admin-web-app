import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";

export const LoadingState: React.FC<{ label?: string }> = ({
    label = "Đang tải...",
}) => (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Loader2 className="h-6 w-6 animate-spin text-main" />
        <div className="text-sm text-text_2">{label}</div>
    </div>
);

export const EmptyState: React.FC<{ label?: string }> = ({
    label = "Chưa có dữ liệu",
}) => (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
        <div className="text-sm text-text_2">{label}</div>
    </div>
);

export const ErrorState: React.FC<{ label?: string; onRetry?: () => void }> = ({
    label = "Đã xảy ra lỗi, vui lòng thử lại",
    onRetry,
}) => (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
        <div className="text-sm text-red-500">{label}</div>
        {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
                Thử lại
            </Button>
        )}
    </div>
);
