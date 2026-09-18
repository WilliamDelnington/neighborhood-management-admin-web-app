import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@components/ui/button";
import {
    BoundaryGeometry,
    buildBoundaryPreviewPath,
    countBoundaryPoints,
    extractBoundaryGeometry,
} from "@lib/geoBoundary";

interface GeoJsonBoundaryInputProps {
    value?: BoundaryGeometry;
    onChange: (geometry: BoundaryGeometry | undefined) => void;
}

/**
 * O nhap ranh gioi tu file GeoJSON (.json/.geojson) cho form Them/Sua To dan
 * pho - chap nhan file xuat tu QGIS hoac tu tinh nang "Vẽ ranh giới tổ" cua du
 * an thu nghiem (xem lib/geoBoundary.ts). Hien phac thao hinh dang (khong dung
 * nen ban do ben thu ba) de nguoi nhap kiem tra nhanh hinh co hop ly khong.
 */
const GeoJsonBoundaryInput: React.FC<GeoJsonBoundaryInputProps> = ({
    value,
    onChange,
}) => {
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        try {
            const text = await file.text();
            const geometry = extractBoundaryGeometry(JSON.parse(text));
            setError(null);
            onChange(geometry);
        } catch (err) {
            setError((err as Error).message || "Không đọc được file GeoJSON");
        }
    };

    if (value) {
        const previewPath = buildBoundaryPreviewPath(value);
        return (
            <div className="flex items-center gap-3 rounded-lg border border-divider_01 p-3">
                {previewPath && (
                    <svg
                        viewBox="0 0 100 100"
                        className="h-16 w-16 shrink-0 rounded bg-ng_10"
                        role="img"
                        aria-label="Phác thảo ranh giới đã nhập"
                    >
                        <path d={previewPath} fill="#4f8ef7" fillOpacity={0.45} stroke="#2563eb" strokeWidth={2} />
                    </svg>
                )}
                <div className="flex-1 text-xs text-text_2">
                    <p className="font-medium text-text_1">
                        {value.type === "MultiPolygon" ? "Đa vùng (MultiPolygon)" : "Một vùng (Polygon)"}
                    </p>
                    <p>{countBoundaryPoints(value)} điểm tọa độ</p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onChange(undefined)}
                >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Xóa
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <input
                type="file"
                accept=".json,.geojson,application/geo+json,application/json"
                onChange={handleFileChange}
                className="block w-full text-sm text-text_1 file:mr-3 file:rounded-lg file:border-0 file:bg-main file:px-3 file:py-2 file:text-sm file:text-white"
            />
            <p className="text-xs text-text_2">
                Nhận file .json/.geojson chứa 1 vùng (Polygon/MultiPolygon) - có thể
                xuất từ QGIS hoặc công cụ vẽ ranh giới trên bản đồ.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default GeoJsonBoundaryInput;
