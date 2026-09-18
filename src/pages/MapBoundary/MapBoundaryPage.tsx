import React from "react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import NeighborhoodZonesMap from "@components/admin/NeighborhoodZonesMap";

/**
 * Trang rieng cho cong cu "Tự vẽ ranh giới" (module "map_boundary" trong
 * constants/modules.ts) - tach khoi trang "/map" (chi xem) va widget Dashboard
 * de nguoi chi can XEM ban do khong bi roi voi cong cu ve. Mo theo permission
 * (neighborhoods.manage HOAC neighborhoods.update_gis rieng), KHONG khoa cung
 * theo role admin nhu SettingsPage.tsx - de cac vai tro chi duoc cap rieng
 * quyen update_gis (vd nhan vien GIS) van dung duoc, khong can la admin.
 */
const MapBoundaryPage: React.FC = () => (
    <AdminGuard permissions={["neighborhoods.manage", "neighborhoods.update_gis"]}>
        <PageHeader
            title="Ranh giới bản đồ"
            description="Vẽ/sửa ranh giới GeoJSON của Tổ dân phố trên bản đồ."
        />
        <NeighborhoodZonesMap autoShow showDrawTools alwaysFullscreen />
    </AdminGuard>
);

export default MapBoundaryPage;
