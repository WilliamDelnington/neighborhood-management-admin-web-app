import React from "react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import NeighborhoodZonesMap from "@components/admin/NeighborhoodZonesMap";

/**
 * Trang rieng cho "Bản đồ ranh giới Tổ dân phố" (module "map" trong
 * constants/modules.ts) - tach ra khoi widget nho o Dashboard de co khong
 * gian lam viec rong hon, dung chung component NeighborhoodZonesMap.tsx.
 * autoShow=true: nguoi dung da chu dong bam vao menu "Bản đồ" nen khoi tao
 * ban do ngay, khong can bam them "Xem bản đồ" nhu tren Dashboard.
 */
const MapPage: React.FC = () => (
    <AdminGuard permissions={["neighborhoods.read"]}>
        <PageHeader
            title="Bản đồ"
            description="Bản đồ ranh giới các Tổ dân phố - xem, tìm kiếm địa chỉ và vẽ/sửa ranh giới."
        />
        <NeighborhoodZonesMap autoShow mapHeightClassName="h-[75vh]" />
    </AdminGuard>
);

export default MapPage;
