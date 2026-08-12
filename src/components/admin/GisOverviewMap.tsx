import React, { useMemo } from "react";
import { MapPinned } from "lucide-react";
import { DashboardSummary } from "@dts";

type Props = {
    data: DashboardSummary["gisOverview"];
    onOpenHouse: (houseId: string) => void;
};

const GisOverviewMap: React.FC<Props> = ({ data, onOpenHouse }) => {
    const plotted = useMemo(() => {
        if (data.points.length === 0) return [];
        const latitudes = data.points.map(point => point.latitude);
        const longitudes = data.points.map(point => point.longitude);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        const latRange = maxLat - minLat || 0.001;
        const lngRange = maxLng - minLng || 0.001;
        return data.points.map(point => ({
            ...point,
            x: 6 + ((point.longitude - minLng) / lngRange) * 88,
            // SVG y tang tu tren xuong; vi do cao hon phai nam phia tren.
            y: 94 - ((point.latitude - minLat) / latRange) * 88,
        }));
    }, [data.points]);

    return (
        <section className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <MapPinned className="h-4 w-4 text-main" />
                        <h2 className="text-sm font-semibold">Bản đồ tọa độ Nhà số</h2>
                    </div>
                    <p className="mt-1 text-xs text-text_2">
                        Dữ liệu thời gian thực trong phạm vi được phân công · không dùng
                        nền bản đồ bên thứ ba.
                    </p>
                </div>
                <span className="text-xs text-text_2">
                    {data.housesWithCoordinates}/{data.totalHouses} Nhà số đã có GIS
                </span>
            </div>

            {plotted.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-text_2">
                    Chưa có tọa độ hợp lệ để hiển thị. Có thể lấy GPS tại trang chi tiết
                    Nhà số; null hoặc 0/0 vẫn được giữ là “chưa có GIS”.
                </div>
            ) : (
                <>
                    <div className="relative overflow-hidden rounded-xl border border-divider_01 bg-ng_10">
                        <svg
                            viewBox="0 0 100 100"
                            className="h-[320px] w-full"
                            role="img"
                            aria-label="Phân bố tọa độ Nhà số"
                        >
                            <defs>
                                <pattern id="gis-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E9EBED" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#gis-grid)" />
                            {plotted.map(point => {
                                const critical = point.highRiskPccc || point.urgentSecurity;
                                const warning = !critical && point.openComplaintCount > 0;
                                return (
                                    <g
                                        key={point.houseId}
                                        className="cursor-pointer"
                                        onClick={() => onOpenHouse(point.houseId)}
                                    >
                                        <title>
                                            {`${point.code} · ${point.address}\n${point.citizenCount} nhân khẩu · ${point.openComplaintCount} phản ánh đang mở${point.highRiskPccc ? " · PCCC nguy cơ cao" : ""}${point.urgentSecurity ? " · An ninh khẩn cấp" : ""}`}
                                        </title>
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={critical ? 2.2 : 1.7}
                                            fill={critical ? "#dc2626" : warning ? "#f59e0b" : "#2563eb"}
                                            stroke="white"
                                            strokeWidth="0.7"
                                        />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-text_2">
                        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />Bình thường</span>
                        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />Có phản ánh đang mở</span>
                        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-600" />PCCC cao / an ninh khẩn</span>
                    </div>
                </>
            )}
        </section>
    );
};

export default GisOverviewMap;

