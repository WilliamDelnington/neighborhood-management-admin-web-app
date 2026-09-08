import React from "react";

interface ImportProgressBarProps {
    createdCount: number;
    skippedCount: number;
    errorCount: number;
    totalRows: number;
    label?: string;
}

/**
 * Thanh tien do hien thi trong luc commit import dang chay o background
 * (job.status === "committing") - xem pollImportJobUntilSettled o
 * importApi.ts. Phan tram va cac so lieu chi tiet (tao moi/da ton tai/loi)
 * do backend tra ve qua polling GET /api/import/jobs/:id - errorCount da gom
 * ca loi phat hien luc preview (co san tu dau) lan loi phat sinh luc commit
 * (hiem), nen tong ba so nay tien dan den totalRows khi job hoan tat.
 */
const ImportProgressBar: React.FC<ImportProgressBarProps> = ({
    createdCount,
    skippedCount,
    errorCount,
    totalRows,
    label = "Đang nhập dữ liệu...",
}) => {
    const processed = createdCount + skippedCount + errorCount;
    const percent =
        totalRows > 0
            ? Math.min(100, Math.round((processed / totalRows) * 100))
            : 0;

    return (
        <div className="space-y-2 rounded-lg border border-divider_01 bg-surface_2 p-3">
            <div className="flex items-center justify-between text-xs text-text_2">
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ng_10">
                <div
                    className="h-full rounded-full bg-main transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="text-xs text-text_2">
                {createdCount} dòng đã tạo · {skippedCount} dòng đã tồn tại
                (bỏ qua) · {errorCount} dòng lỗi
            </div>
        </div>
    );
};

export default ImportProgressBar;
