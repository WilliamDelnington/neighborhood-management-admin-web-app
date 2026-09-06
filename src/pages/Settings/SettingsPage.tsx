import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import { resolveAssetUrl } from "@constants/common";
import { MODULES, ModuleItem } from "@constants/modules";
import { AppError } from "@dts";
import {
    deleteAppFavicon,
    deleteAppLogo,
    fetchAllSettings,
    upsertSetting,
    uploadAppFavicon,
    uploadAppLogo,
} from "@service/settingsApi";
import { useAppBrandStore } from "@store/appBrandStore";
import { useSectionDescriptionsStore } from "@store/sectionDescriptionsStore";

// Setting dung chung de admin ghi de mo ta hien thi tren cac muc menu sidebar
// (constants/modules.ts) VA phan mo ta dau trang cua tung trang tuong ung
// (PageHeader.tsx tu suy ra module theo route hien tai) ma khong can sua code
// - xem SectionDescriptionsPanel ben duoi va sectionDescriptionsStore.ts (cache
// dung chung ma AdminLayout.tsx/PageHeader.tsx doc lai gia tri nay).
const SECTION_DESCRIPTIONS_KEY = "section_descriptions";
const APP_LOGO_KEY = "app_logo_url";
const APP_TAB_TITLE_KEY = "app_tab_title";
const APP_FAVICON_KEY = "app_favicon_url";
// Cac key co man chinh sua rieng (Logo / Tab trinh duyet / section_descriptions
// o duoi) - an khoi danh sach cau hinh chung de tranh hien trung lap.
const HIDDEN_SETTING_KEYS = new Set([
    SECTION_DESCRIPTIONS_KEY,
    APP_LOGO_KEY,
    APP_TAB_TITLE_KEY,
    APP_FAVICON_KEY,
]);

type EditableSetting = {
    key: string;
    isComplex: boolean;
    text: string;
    originalType: "string" | "number" | "boolean" | "object";
};

const buildEditable = (key: string, value: unknown): EditableSetting => {
    if (value !== null && typeof value === "object") {
        return {
            key,
            isComplex: true,
            text: JSON.stringify(value, null, 2),
            originalType: "object",
        };
    }
    if (typeof value === "number") {
        return {
            key,
            isComplex: false,
            text: String(value),
            originalType: "number",
        };
    }
    if (typeof value === "boolean") {
        return {
            key,
            isComplex: false,
            text: String(value),
            originalType: "boolean",
        };
    }
    return {
        key,
        isComplex: false,
        text: value === undefined || value === null ? "" : String(value),
        originalType: "string",
    };
};

const coerceValue = (setting: EditableSetting): unknown => {
    if (setting.isComplex) return JSON.parse(setting.text);
    if (setting.originalType === "number") return Number(setting.text);
    if (setting.originalType === "boolean") return setting.text === "true";
    return setting.text;
};

const SEED_KEY_EXAMPLES = ["app_identity", "oa_info", "emergency_contacts"];

const SettingsPage: React.FC = () => (
    <AdminGuard roles={["admin"]}>
        <SettingsContent />
    </AdminGuard>
);

const SettingsContent: React.FC = () => {
    const [settings, setSettings] = useState<Record<string, EditableSetting>>(
        {},
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [addingNew, setAddingNew] = useState(false);

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [removingLogo, setRemovingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [removingFavicon, setRemovingFavicon] = useState(false);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const [tabTitle, setTabTitle] = useState("");
    const [savingTabTitle, setSavingTabTitle] = useState(false);

    const setSharedBrand = useAppBrandStore(state => state.setBrand);

    const [sectionDescOverrides, setSectionDescOverrides] = useState<
        Record<string, string>
    >({});
    const [sectionDescDrafts, setSectionDescDrafts] = useState<
        Record<string, string>
    >({});
    const [savingSectionKey, setSavingSectionKey] = useState<string | null>(
        null,
    );

    const load = () => {
        setLoading(true);
        setError(false);
        fetchAllSettings()
            .then(data => {
                const mapped: Record<string, EditableSetting> = {};
                Object.entries(data || {}).forEach(([key, value]) => {
                    // Cac key co man chinh sua rieng (xem HIDDEN_SETTING_KEYS)
                    // - khong hien lai duoi dang JSON tho trong danh sach cau
                    // hinh chung.
                    if (HIDDEN_SETTING_KEYS.has(key)) return;
                    mapped[key] = buildEditable(key, value);
                });
                setSettings(mapped);
                const rawLogo = data?.[APP_LOGO_KEY];
                setLogoUrl(typeof rawLogo === "string" ? rawLogo : null);
                const rawFavicon = data?.[APP_FAVICON_KEY];
                setFaviconUrl(typeof rawFavicon === "string" ? rawFavicon : null);
                const rawTabTitle = data?.[APP_TAB_TITLE_KEY];
                setTabTitle(typeof rawTabTitle === "string" ? rawTabTitle : "");

                const rawOverrides = data?.[SECTION_DESCRIPTIONS_KEY];
                const overrides =
                    rawOverrides && typeof rawOverrides === "object"
                        ? (rawOverrides as Record<string, string>)
                        : {};
                setSectionDescOverrides(overrides);
                const drafts: Record<string, string> = {};
                MODULES.forEach(m => {
                    drafts[m.key] = overrides[m.key] ?? m.description ?? "";
                });
                setSectionDescDrafts(drafts);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleLogoUploadClick = () => logoInputRef.current?.click();

    const handleLogoFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            setUploadingLogo(true);
            const setting = await uploadAppLogo(file);
            setLogoUrl(setting.value);
            setSharedBrand({ logoUrl: setting.value });
            toast.success("Đã cập nhật logo");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = async () => {
        try {
            setRemovingLogo(true);
            await deleteAppLogo();
            setLogoUrl(null);
            setSharedBrand({ logoUrl: null });
            toast.success("Đã xóa logo, quay về chữ mặc định");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRemovingLogo(false);
        }
    };

    const handleFaviconUploadClick = () => faviconInputRef.current?.click();

    const handleFaviconFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            setUploadingFavicon(true);
            const setting = await uploadAppFavicon(file);
            setFaviconUrl(setting.value);
            setSharedBrand({ faviconUrl: setting.value });
            toast.success("Đã cập nhật biểu tượng tab");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingFavicon(false);
        }
    };

    const handleRemoveFavicon = async () => {
        try {
            setRemovingFavicon(true);
            await deleteAppFavicon();
            setFaviconUrl(null);
            setSharedBrand({ faviconUrl: null });
            toast.success("Đã xóa biểu tượng tab, quay về mặc định");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRemovingFavicon(false);
        }
    };

    const handleSaveTabTitle = async () => {
        const text = tabTitle.trim();
        try {
            setSavingTabTitle(true);
            await upsertSetting(APP_TAB_TITLE_KEY, text);
            setSharedBrand({ tabTitle: text || null });
            toast.success("Đã lưu tiêu đề tab");
        } catch (err) {
            toast.error((err as AppError).message || "Có lỗi xảy ra");
        } finally {
            setSavingTabTitle(false);
        }
    };

    const handleTextChange = (key: string, text: string) => {
        setSettings(prev => ({ ...prev, [key]: { ...prev[key], text } }));
    };

    const handleSave = async (key: string) => {
        const setting = settings[key];
        if (!setting) return;
        let value: unknown;
        try {
            value = coerceValue(setting);
        } catch {
            toast.error("Giá trị JSON không hợp lệ");
            return;
        }
        try {
            setSavingKey(key);
            await upsertSetting(key, value);
            toast.success("Đã lưu cấu hình");
        } catch (err) {
            toast.error((err as AppError).message || "Có lỗi xảy ra");
        } finally {
            setSavingKey(null);
        }
    };

    const handleSectionDescChange = (key: string, text: string) => {
        setSectionDescDrafts(prev => ({ ...prev, [key]: text }));
    };

    const setSharedSectionDescOverrides = useSectionDescriptionsStore(
        state => state.setOverrides,
    );

    const saveSectionDescOverrides = async (
        key: string,
        overrides: Record<string, string>,
    ) => {
        try {
            setSavingSectionKey(key);
            await upsertSetting(SECTION_DESCRIPTIONS_KEY, overrides);
            setSectionDescOverrides(overrides);
            // Cap nhat ngay cache dung chung de sidebar/PageHeader o cac trang
            // khac phan anh mo ta moi ma khong can doi lan fetchPublicSettings
            // tiep theo - xem sectionDescriptionsStore.ts.
            setSharedSectionDescOverrides(overrides);
            toast.success("Đã lưu mô tả mục menu");
        } catch (err) {
            toast.error((err as AppError).message || "Có lỗi xảy ra");
        } finally {
            setSavingSectionKey(null);
        }
    };

    const handleSaveSectionDesc = (module: ModuleItem) => {
        const text = (sectionDescDrafts[module.key] || "").trim();
        saveSectionDescOverrides(module.key, {
            ...sectionDescOverrides,
            [module.key]: text,
        });
    };

    const handleResetSectionDesc = (module: ModuleItem) => {
        const next = { ...sectionDescOverrides };
        delete next[module.key];
        setSectionDescDrafts(prev => ({
            ...prev,
            [module.key]: module.description || "",
        }));
        saveSectionDescOverrides(module.key, next);
    };

    const handleAddNew = async () => {
        if (!newKey.trim()) {
            toast.error("Vui lòng nhập khóa cấu hình (key)");
            return;
        }
        let value: unknown = newValue;
        try {
            value = JSON.parse(newValue);
        } catch {
            // Khong phai JSON hop le -> giu nguyen dang chuoi text
            value = newValue;
        }
        try {
            setAddingNew(true);
            await upsertSetting(
                newKey.trim(),
                value,
                newDescription.trim() || undefined,
            );
            toast.success("Đã thêm cấu hình mới");
            setShowAddForm(false);
            setNewKey("");
            setNewValue("");
            setNewDescription("");
            load();
        } catch (err) {
            toast.error((err as AppError).message || "Có lỗi xảy ra");
        } finally {
            setAddingNew(false);
        }
    };

    const entries = Object.values(settings);

    return (
        <div>
            <PageHeader
                title="Cài đặt"
                description="Cấu hình chung của hệ thống."
            />

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && (
                <>
                    <div className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <h2 className="mb-2 text-sm font-semibold">
                            Logo ứng dụng
                        </h2>
                        <p className="mb-3 text-xs text-text_2">
                            Thay thế chữ &quot;Quản lý Tổ dân phố&quot; trên
                            header và trang đăng nhập bằng logo riêng. Nếu
                            không tải ảnh lên, chữ mặc định sẽ được giữ
                            nguyên.
                        </p>
                        <div className="flex items-center gap-4">
                            {logoUrl ? (
                                <img
                                    src={resolveAssetUrl(logoUrl)}
                                    alt="Logo hiện tại"
                                    className="h-12 max-w-[200px] rounded-lg border border-divider_01 object-contain p-1"
                                />
                            ) : (
                                <span className="text-sm text-text_2">
                                    Chưa có logo, đang dùng chữ mặc định
                                </span>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                loading={uploadingLogo}
                                onClick={handleLogoUploadClick}
                            >
                                <Upload className="mr-1 h-3.5 w-3.5" />
                                {logoUrl ? "Đổi logo" : "Tải logo lên"}
                            </Button>
                            {logoUrl && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="!text-red-500"
                                    loading={removingLogo}
                                    onClick={handleRemoveLogo}
                                >
                                    Xóa logo
                                </Button>
                            )}
                            <input
                                ref={logoInputRef}
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.svg,.webp"
                                onChange={handleLogoFileSelected}
                            />
                        </div>
                    </div>

                    <div className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <h2 className="mb-2 text-sm font-semibold">
                            Tab trình duyệt
                        </h2>
                        <p className="mb-3 text-xs text-text_2">
                            Đổi tiêu đề và biểu tượng hiển thị trên tab trình
                            duyệt. Tiêu đề mục đang xem sẽ được thêm phía
                            trước, ví dụ &quot;Cài đặt - {tabTitle || "Quản trị Tổ dân phố Hòa Bình"}
                            &quot;.
                        </p>

                        <div className="mb-4 flex items-end gap-2">
                            <div className="flex-1">
                                <Label>Tiêu đề tab</Label>
                                <Input
                                    className="mt-1"
                                    placeholder="Quản trị Tổ dân phố Hòa Bình"
                                    value={tabTitle}
                                    onChange={e => setTabTitle(e.target.value)}
                                />
                            </div>
                            <Button
                                size="sm"
                                loading={savingTabTitle}
                                onClick={handleSaveTabTitle}
                            >
                                Lưu
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            {faviconUrl ? (
                                <img
                                    src={resolveAssetUrl(faviconUrl)}
                                    alt="Biểu tượng tab hiện tại"
                                    className="h-10 w-10 rounded-lg border border-divider_01 object-contain p-1"
                                />
                            ) : (
                                <span className="text-sm text-text_2">
                                    Chưa có biểu tượng riêng, đang dùng mặc
                                    định
                                </span>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                loading={uploadingFavicon}
                                onClick={handleFaviconUploadClick}
                            >
                                <Upload className="mr-1 h-3.5 w-3.5" />
                                {faviconUrl
                                    ? "Đổi biểu tượng"
                                    : "Tải biểu tượng lên"}
                            </Button>
                            {faviconUrl && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="!text-red-500"
                                    loading={removingFavicon}
                                    onClick={handleRemoveFavicon}
                                >
                                    Xóa biểu tượng
                                </Button>
                            )}
                            <input
                                ref={faviconInputRef}
                                type="file"
                                className="hidden"
                                accept=".ico,.png,.svg,.webp"
                                onChange={handleFaviconFileSelected}
                            />
                        </div>
                    </div>

                    <details className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <summary className="cursor-pointer text-sm font-semibold">
                            Mô tả các mục menu
                        </summary>
                        <p className="mb-3 mt-2 text-xs text-text_2">
                            Sửa lại phần mô tả hiển thị cho từng mục trong menu
                            điều hướng và phần mô tả đầu trang tương ứng, không
                            cần sửa code. Để trống và lưu, hoặc bấm &quot;Khôi
                            phục mặc định&quot; để quay lại mô tả gốc.
                        </p>
                        <div className="space-y-3">
                            {MODULES.map(m => {
                                const isOverridden =
                                    sectionDescOverrides[m.key] !== undefined;
                                return (
                                    <div
                                        key={m.key}
                                        className="rounded-md border border-divider_01 p-3"
                                    >
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {m.label}
                                            </span>
                                            {isOverridden && (
                                                <span className="text-xs text-text_2">
                                                    Đã tuỳ chỉnh
                                                </span>
                                            )}
                                        </div>
                                        <Textarea
                                            rows={2}
                                            value={sectionDescDrafts[m.key] || ""}
                                            onChange={e =>
                                                handleSectionDescChange(
                                                    m.key,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <div className="mt-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                loading={
                                                    savingSectionKey === m.key
                                                }
                                                onClick={() =>
                                                    handleSaveSectionDesc(m)
                                                }
                                            >
                                                Lưu
                                            </Button>
                                            {isOverridden && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={
                                                        savingSectionKey ===
                                                        m.key
                                                    }
                                                    onClick={() =>
                                                        handleResetSectionDesc(
                                                            m,
                                                        )
                                                    }
                                                >
                                                    Khôi phục mặc định
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </details>

                    {entries.length === 0 && !showAddForm && (
                        <EmptyState
                            label={`Chưa có cấu hình nào. Có thể thêm các khóa gợi ý như: ${SEED_KEY_EXAMPLES.join(
                                ", ",
                            )}`}
                        />
                    )}

                    {entries.map(setting => (
                        <div
                            key={setting.key}
                            className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm"
                        >
                            <h2 className="mb-2 text-sm font-semibold">
                                {setting.key}
                            </h2>
                            {setting.isComplex ? (
                                <Textarea
                                    rows={5}
                                    value={setting.text}
                                    onChange={e =>
                                        handleTextChange(
                                            setting.key,
                                            e.target.value,
                                        )
                                    }
                                />
                            ) : (
                                <Input
                                    value={setting.text}
                                    onChange={e =>
                                        handleTextChange(
                                            setting.key,
                                            e.target.value,
                                        )
                                    }
                                />
                            )}
                            <div className="mt-2">
                                <Button
                                    size="sm"
                                    loading={savingKey === setting.key}
                                    onClick={() => handleSave(setting.key)}
                                >
                                    Lưu
                                </Button>
                            </div>
                        </div>
                    ))}

                    {showAddForm ? (
                        <div className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold">
                                Thêm cấu hình mới
                            </h2>
                            <div className="mb-3">
                                <Label>Khóa (key)</Label>
                                <Input
                                    className="mt-1"
                                    placeholder={`Ví dụ: ${SEED_KEY_EXAMPLES[0]}`}
                                    value={newKey}
                                    onChange={e => setNewKey(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Giá trị (chuỗi hoặc JSON)</Label>
                                <Textarea
                                    className="mt-1"
                                    rows={4}
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Mô tả (nếu có)</Label>
                                <Input
                                    className="mt-1"
                                    value={newDescription}
                                    onChange={e =>
                                        setNewDescription(e.target.value)
                                    }
                                />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="w-full"
                                    loading={addingNew}
                                    onClick={handleAddNew}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setShowAddForm(true)}
                        >
                            + Thêm cấu hình
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default SettingsPage;
