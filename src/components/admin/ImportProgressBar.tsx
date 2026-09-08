import React from "react";

interface ImportProgressBarProps {
    committedCount: number;
    totalRows: number;
    label?: string;
}

/**
 * Thanh tien do hien thi trong luc commit import dang chay o background
 * (job.status === "committing") - xem pollImportJobUntilSettled o
 * importApi.ts. Phan tram tinh theo committedCount/totalRows do backend tra
 * ve qua polling GET /api/import/jobs/:id.
 */
const ImportProgressBar: React.FC<ImportProgressBarProps> = ({
    committedCount,
    totalRows,
    label = "Đang nhập dữ liệu...",
}) => {
    const percent =
        totalRows > 0
            ? Math.min(100, Math.round((committedCount / totalRows) * 100))
            : 0;

    return (
        <div className="space-y-2 rounded-lg border border-divider_01 bg-surface_2 p-3">
            <div className="flex items-center justify-between text-xs text-text_2">
                <span>{label}</span>
                <span>
                    {committedCount}/{totalRows} ({percent}%)
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ng_10">
                <div
                    className="h-full rounded-full bg-main transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

export default ImportProgressBar;
