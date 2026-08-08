// Danh sach tinh nang tren trang chu Mini App - mirror thu cong tu
// APP_UTINITIES + MORE_FEATURES trong neighborhood-management/src/constants/utinities.ts.
// Chi dung de hien thi label trong man quan tri nay (icon/path/permission van
// chi ton tai ben Mini App) - neu Mini App them/bot/doi ten tinh nang, danh
// sach nay phai duoc cap nhat theo tay.
export type MiniAppFeatureCatalogEntry = {
    key: string;
    label: string;
};

export const MINI_APP_FEATURE_CATALOG: MiniAppFeatureCatalogEntry[] = [
    { key: "complaints", label: "Phản ánh của tôi" },
    { key: "meetings", label: "Lịch họp" },
    { key: "surveys", label: "Khảo sát" },
    { key: "files", label: "Biểu mẫu" },
    { key: "admin-houses", label: "Nhà số của tôi" },
    { key: "admin-households", label: "Hộ dân" },
    { key: "admin-citizens", label: "Nhân khẩu" },
    { key: "support", label: "Hỗ trợ" },
    { key: "admin-business-types", label: "Loại hình kinh doanh" },
    { key: "election", label: "Bầu cử" },
];

export type MiniAppFeatureConfigEntry = {
    key: string;
    order: number;
    visible: boolean;
};

/**
 * Ghep catalog (co dinh, chi co label) voi config da luu (Setting key
 * "mini_app_features") thanh danh sach dong de hien thi/chinh sua trong man
 * quan tri - tinh nang chua co trong config (moi them vao catalog) duoc gan
 * "order" noi tiep sau cung va "visible" mac dinh true, giong hanh vi fallback
 * cua resolveFeatureOrder ben Mini App.
 */
export function mergeFeatureConfig(
    config: MiniAppFeatureConfigEntry[] | undefined,
): MiniAppFeatureConfigEntry[] {
    const byKey = new Map((config || []).map(c => [c.key, c]));
    const maxConfiguredOrder = (config || []).reduce(
        (max, c) => Math.max(max, c.order),
        -1,
    );
    let nextOrder = maxConfiguredOrder + 1;
    return MINI_APP_FEATURE_CATALOG.map(item => {
        const existing = byKey.get(item.key);
        if (existing) return existing;
        return { key: item.key, order: nextOrder++, visible: true };
    });
}
