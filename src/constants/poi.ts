import {
    Building2,
    Bus,
    Coffee,
    CreditCard,
    Fuel,
    GraduationCap,
    Home,
    Landmark,
    Mail,
    ShieldCheck,
    ShoppingBag,
    Stethoscope,
    Users,
    Utensils,
} from "lucide-react";
import { PoiCategory } from "@dts";

// Danh sach danh muc "Điểm tiện ích" DUNG CHUNG boi:
// - NeighborhoodZonesMap.tsx (the danh muc + cham tren "Bản đồ tiện ích")
// - PoiListPage.tsx (trang quan tri /pois - loc/them/sua theo danh muc)
// Phai khop voi POI_CATEGORIES trong models/Poi.ts o backend.
export interface PoiCategoryMeta {
    key: PoiCategory;
    label: string;
    icon: typeof Users;
    color: string;
}

export const POI_CATEGORY_LIST: PoiCategoryMeta[] = [
    { key: "ubnd", label: "UBND", icon: Landmark, color: "#2563eb" },
    { key: "police", label: "Công an", icon: ShieldCheck, color: "#dc2626" },
    { key: "atm", label: "Ngân hàng ATM", icon: CreditCard, color: "#0d9488" },
    { key: "clinic", label: "Trạm y tế", icon: Stethoscope, color: "#7c3aed" },
    { key: "school", label: "Trường học", icon: GraduationCap, color: "#16a34a" },
    { key: "post", label: "Bưu điện", icon: Mail, color: "#db2777" },
    { key: "gas", label: "Cây xăng", icon: Fuel, color: "#ea580c" },
    { key: "market", label: "Chợ / Siêu thị", icon: ShoppingBag, color: "#9333ea" },
    { key: "restaurant", label: "Quán ăn ngon", icon: Utensils, color: "#dc2626" },
    { key: "cafe", label: "Quán cafe", icon: Coffee, color: "#c2410c" },
    { key: "bus", label: "Trạm xe buýt", icon: Bus, color: "#2563eb" },
    { key: "apartment", label: "Căn hộ / Chung cư", icon: Building2, color: "#ea580c" },
    // Diem gan voi 1 Household cu the (xem householdId trong Poi) - tao tu cong
    // cu "Gắn hộ dân lên bản đồ" o /map-boundary, KHONG the "Quét lại" duoc.
    { key: "household", label: "Hộ dân", icon: Home, color: "#0891b2" },
];

export const POI_CATEGORY_LABEL: Record<PoiCategory, string> = POI_CATEGORY_LIST.reduce(
    (acc, item) => ({ ...acc, [item.key]: item.label }),
    {} as Record<PoiCategory, string>,
);
