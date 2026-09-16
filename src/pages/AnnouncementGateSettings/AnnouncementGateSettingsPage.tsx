import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { Button } from "@components/ui/button";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { resolveAssetUrl } from "@constants/common";
import { AppError } from "@dts";
import {
    deleteAnnouncementGateBillboard,
    deleteAnnouncementGateLogo,
    fetchAllSettings,
    uploadAnnouncementGateBillboard,
    uploadAnnouncementGateLogo,
} from "@service/settingsApi";

const BILLBOARD_KEY = "announcement_gate_billboard_url";
const LOGO_KEY = "announcement_gate_logo_url";

const AnnouncementGateSettingsPage: React.FC = () => (
    <AdminGuard permissions={["settings.update"]}>
        <AnnouncementGateSettingsContent />
    </AdminGuard>
);

const AnnouncementGateSettingsContent: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [billboardUrl, setBillboardUrl] = useState<string | null>(null);
    const [uploadingBillboard, setUploadingBillboard] = useState(false);
    const [removingBillboard, setRemovingBillboard] = useState(false);
    const billboardInputRef = useRef<HTMLInputElement>(null);

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [removingLogo, setRemovingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchAllSettings()
            .then(data => {
                const rawBillboard = data?.[BILLBOARD_KEY];
                setBillboardUrl(
                    typeof rawBillboard === "string" ? rawBillboard : null,
                );
                const rawLogo = data?.[LOGO_KEY];
                setLogoUrl(typeof rawLogo === "string" ? rawLogo : null);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleBillboardUploadClick = () => billboardInputRef.current?.click();

    const handleBillboardFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            setUploadingBillboard(true);
            const setting = await uploadAnnouncementGateBillboard(file);
            setBillboardUrl(setting.value);
            toast.success("Đã cập nhật ảnh banner");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingBillboard(false);
        }
    };

    const handleRemoveBillboard = async () => {
        try {
            setRemovingBillboard(true);
            await deleteAnnouncementGateBillboard();
            setBillboardUrl(null);
            toast.success("Đã xóa ảnh banner");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRemovingBillboard(false);
        }
    };

    const handleLogoUploadClick = () => logoInputRef.current?.click();

    const handleLogoFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            setUploadingLogo(true);
            const setting = await uploadAnnouncementGateLogo(file);
            setLogoUrl(setting.value);
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
            await deleteAnnouncementGateLogo();
            setLogoUrl(null);
            toast.success("Đã xóa logo");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRemovingLogo(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Cổng thông tin điện tử"
                description="Cấu hình ảnh banner và logo hiển thị trên trang Cổng thông tin điện tử của phường."
            />

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && (
                <>
                    <div className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <h2 className="mb-2 text-sm font-semibold">
                            Ảnh banner (billboard)
                        </h2>
                        <p className="mb-3 text-xs text-text_2">
                            Ảnh lớn hiển thị ở đầu trang chủ Cổng thông tin
                            điện tử. Kích thước tối đa 4MB.
                        </p>
                        {billboardUrl ? (
                            <div className="flex flex-col items-center gap-4">
                                <img
                                    src={resolveAssetUrl(billboardUrl)}
                                    alt="Ảnh banner hiện tại"
                                    className="max-h-56 w-full max-w-[560px] rounded-lg border border-divider_01 object-contain p-2"
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        loading={uploadingBillboard}
                                        onClick={handleBillboardUploadClick}
                                    >
                                        <Upload className="mr-1 h-3.5 w-3.5" />
                                        Đổi ảnh banner
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="!text-red-500"
                                        loading={removingBillboard}
                                        onClick={handleRemoveBillboard}
                                    >
                                        Xóa ảnh banner
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-text_2">
                                    Chưa có ảnh banner
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    loading={uploadingBillboard}
                                    onClick={handleBillboardUploadClick}
                                >
                                    <Upload className="mr-1 h-3.5 w-3.5" />
                                    Tải ảnh banner lên
                                </Button>
                            </div>
                        )}
                        <input
                            ref={billboardInputRef}
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleBillboardFileSelected}
                        />
                    </div>

                    <div className="mb-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <h2 className="mb-2 text-sm font-semibold">
                            Logo
                        </h2>
                        <p className="mb-3 text-xs text-text_2">
                            Logo hiển thị trên đầu trang Cổng thông tin điện
                            tử. Nếu không tải ảnh lên, biểu tượng chữ mặc định
                            sẽ được giữ nguyên.
                        </p>
                        {logoUrl ? (
                            <div className="flex flex-col items-center gap-4">
                                <img
                                    src={resolveAssetUrl(logoUrl)}
                                    alt="Logo hiện tại"
                                    className="h-28 max-w-[320px] rounded-lg border border-divider_01 object-contain p-2"
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        loading={uploadingLogo}
                                        onClick={handleLogoUploadClick}
                                    >
                                        <Upload className="mr-1 h-3.5 w-3.5" />
                                        Đổi logo
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="!text-red-500"
                                        loading={removingLogo}
                                        onClick={handleRemoveLogo}
                                    >
                                        Xóa logo
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-text_2">
                                    Chưa có logo, đang dùng biểu tượng chữ mặc
                                    định
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    loading={uploadingLogo}
                                    onClick={handleLogoUploadClick}
                                >
                                    <Upload className="mr-1 h-3.5 w-3.5" />
                                    Tải logo lên
                                </Button>
                            </div>
                        )}
                        <input
                            ref={logoInputRef}
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.svg,.webp"
                            onChange={handleLogoFileSelected}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default AnnouncementGateSettingsPage;
