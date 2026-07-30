import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import RequiredDocumentsPanel from "@components/admin/RequiredDocumentsPanel";
import { useAuthStore, usePermission } from "@store/authStore";
import { BUSINESS_STATUS_LABEL, BUSINESS_STATUS_TONE } from "@constants/domain";
import { AppError, Business, BusinessStatus, FileAsset, House } from "@dts";
import {
    deleteBusiness,
    deleteBusinessAttachment,
    fetchBusinessAttachments,
    fetchBusinessById,
    updateBusiness,
    updateBusinessStatus,
} from "@service/businessApi";
import BusinessForm, {
    BusinessFormValues,
    isBusinessFormValid,
    toBusinessInput,
} from "./BusinessForm";

const BUSINESS_STATUS_OPTIONS: BusinessStatus[] = [
    "unverified",
    "pending_approval",
    "need_supplement",
    "verified",
];

const toFormValues = (b: Business): BusinessFormValues => ({
    name: b.name,
    businessType: b.businessType?._id || "",
    ownerName: b.ownerName || "",
    phone: b.phone || "",
    active: b.active,
    note: b.note || "",
});

const BusinessDetailPage: React.FC = () => (
    <AdminGuard permissions={["businesses.read"]}>
        <BusinessDetailContent />
    </AdminGuard>
);

const BusinessDetailContent: React.FC = () => {
    const { houseId, businessId } = useParams<{
        houseId: string;
        businessId: string;
    }>();
    const navigate = useNavigate();
    const isAdmin = useAuthStore(state => !!state.user?.roles.includes("admin"));
    const canUpdate = usePermission("businesses.update");
    const canDelete = usePermission("businesses.delete");
    const canVerify = usePermission("businesses.verify");
    const canManageAttachments = canUpdate || canVerify;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<BusinessFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [overrideStatus, setOverrideStatus] = useState<BusinessStatus | "">(
        "",
    );
    const [statusUpdating, setStatusUpdating] = useState(false);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);

    const load = () => {
        if (!businessId) return;
        setLoading(true);
        setError(false);
        fetchBusinessById(businessId)
            .then(b => {
                setBusiness(b);
                setForm(toFormValues(b));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const loadAttachments = () => {
        if (!businessId) return;
        setAttachmentsLoading(true);
        fetchBusinessAttachments(businessId)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    useEffect(() => {
        load();
        loadAttachments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId]);

    const houseIdValue = (): string => {
        if (!business) return "";
        return typeof business.houseId === "string"
            ? business.houseId
            : business.houseId._id;
    };

    const handleSave = async () => {
        if (!businessId || !form) return;
        if (!isBusinessFormValid(form)) {
            toast.error("Vui lòng nhập tên hộ kinh doanh");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateBusiness(
                businessId,
                toBusinessInput(form, houseIdValue()),
            );
            setBusiness(updated);
            setForm(toFormValues(updated));
            setEditing(false);
            toast.success("Đã cập nhật hộ kinh doanh");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!businessId) return;
        try {
            setDeleting(true);
            await deleteBusiness(businessId);
            toast.success("Đã xóa hộ kinh doanh");
            navigate(houseId ? `/houses/${houseId}` : "/houses");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const house: House | null =
        business && typeof business.houseId !== "string"
            ? business.houseId
            : null;

    const handleOverrideStatus = async () => {
        if (!businessId || !overrideStatus) return;
        try {
            setStatusUpdating(true);
            const updated = await updateBusinessStatus(
                businessId,
                overrideStatus,
            );
            setBusiness(updated);
            setOverrideStatus("");
            toast.success("Đã ghi đè trạng thái hộ kinh doanh");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleDeleteAttachment = async (fileId: string) => {
        if (!businessId) return;
        try {
            setDeletingAttachmentId(fileId);
            await deleteBusinessAttachment(businessId, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa tài liệu đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    const backHref = houseId ? `/houses/${houseId}` : "/houses";

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(backHref)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Hộ kinh doanh</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && business && form && (
                <>
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {business.name}
                            </h2>
                            <Badge tone={BUSINESS_STATUS_TONE[business.status]}>
                                {BUSINESS_STATUS_LABEL[business.status]}
                            </Badge>
                        </div>

                        {editing ? (
                            <>
                                <BusinessForm values={form} onChange={setForm} />
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setForm(toFormValues(business));
                                            setEditing(false);
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button loading={saving} onClick={handleSave}>
                                        Lưu
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {house && (
                                    <InfoRow
                                        label="Nhà số"
                                        value={`${house.code} — ${house.address}`}
                                    />
                                )}
                                <InfoRow
                                    label="Loại hình kinh doanh"
                                    value={
                                        business.businessType?.name ||
                                        "Chưa phân loại"
                                    }
                                />
                                <InfoRow
                                    label="Chủ hộ kinh doanh"
                                    value={business.ownerName || "Không có"}
                                />
                                <InfoRow
                                    label="Số điện thoại"
                                    value={business.phone || "Không có"}
                                />
                                <InfoRow
                                    label="Trạng thái hoạt động"
                                    value={
                                        business.active
                                            ? "Đang hoạt động"
                                            : "Ngừng hoạt động"
                                    }
                                />
                                <InfoRow
                                    label="Ghi chú"
                                    value={business.note || "Không có"}
                                />

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {canUpdate && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setEditing(true)}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                setConfirmDelete(true)
                                            }
                                        >
                                            Xóa
                                        </Button>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-divider_01 pt-4">
                                        <span className="text-sm text-text_2">
                                            Ghi đè trạng thái (Admin):
                                        </span>
                                        <Select
                                            value={overrideStatus || undefined}
                                            onValueChange={val =>
                                                setOverrideStatus(
                                                    val as BusinessStatus,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-56">
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BUSINESS_STATUS_OPTIONS.map(
                                                    s => (
                                                        <SelectItem
                                                            key={s}
                                                            value={s}
                                                        >
                                                            {
                                                                BUSINESS_STATUS_LABEL[
                                                                    s
                                                                ]
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            loading={statusUpdating}
                                            disabled={!overrideStatus}
                                            onClick={handleOverrideStatus}
                                        >
                                            Ghi đè
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <RequiredDocumentsPanel
                        businessId={business._id}
                        onChanged={load}
                    />

                    <AttachmentsPanel
                        attachments={attachments}
                        loading={attachmentsLoading}
                        canManage={canManageAttachments}
                        deletingId={deletingAttachmentId}
                        onDelete={handleDeleteAttachment}
                    />
                </>
            )}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa hộ kinh doanh?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa hộ kinh doanh {business?.name || ""}?
                        Hành động này không thể hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <div className="flex justify-between border-b border-divider_01 py-2 text-sm last:border-0">
        <span className="text-text_2">{label}</span>
        <span>{value}</span>
    </div>
);

export default BusinessDetailPage;
