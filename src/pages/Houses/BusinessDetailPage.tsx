import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    FileText,
    MapPin,
    Phone,
    StickyNote,
    Store,
    User,
    UserCheck,
} from "lucide-react";
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
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { AppError, Business, VerificationStatus, FileAsset, House } from "@dts";
import {
    deleteBusiness,
    deleteBusinessAttachment,
    fetchBusinessAttachments,
    fetchBusinessById,
    fetchRequiredDocuments,
    reviewBusinessDocument,
    updateBusiness,
    updateBusinessStatus,
} from "@service/businessApi";
import BusinessForm, {
    BusinessFormValues,
    isBusinessFormValid,
    toBusinessInput,
} from "./BusinessForm";

const BUSINESS_STATUS_OPTIONS: VerificationStatus[] = [
    "unverified",
    "pending",
    "verified",
    "denied",
    "locked",
];

const toFormValues = (b: Business): BusinessFormValues => {
    const rep =
        b.representativeUserId && typeof b.representativeUserId === "object"
            ? b.representativeUserId
            : null;
    return {
        name: b.name,
        businessType: b.businessType?._id || "",
        ownerName: b.ownerName || "",
        taxCode: b.taxCode || "",
        representativeUserId: rep?._id || "",
        representativeUserLabel: rep
            ? `${rep.displayName}${rep.phone ? ` · ${rep.phone}` : ""}`
            : "",
        phone: b.phone || "",
        active: b.active,
        note: b.note || "",
    };
};

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

    const [overrideStatus, setOverrideStatus] = useState<VerificationStatus | "">(
        "",
    );
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [resubmitting, setResubmitting] = useState(false);

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
        if (!business || !business.houseId) return "";
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

    const handleResubmit = async () => {
        if (!businessId) return;
        try {
            setResubmitting(true);
            const updated = await updateBusinessStatus(businessId, "pending");
            setBusiness(updated);
            toast.success("Đã gửi lại hộ kinh doanh để duyệt");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setResubmitting(false);
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
                    <div className="rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-main to-primary-dark ring-2 ring-blue_10">
                                    <Store className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text_1">
                                        {business.name}
                                    </h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge
                                            tone={
                                                VERIFICATION_STATUS_TONE[
                                                    business.status
                                                ]
                                            }
                                        >
                                            {
                                                VERIFICATION_STATUS_LABEL[
                                                    business.status
                                                ]
                                            }
                                        </Badge>
                                        {!business.active && (
                                            <Badge tone="gray">
                                                Ngừng hoạt động
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!editing && (
                                <div className="flex flex-wrap gap-2">
                                    {canUpdate &&
                                        ["unverified", "pending"].includes(
                                            business.status,
                                        ) && (
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
                                    {canUpdate && business.status === "denied" && (
                                        <Button
                                            loading={resubmitting}
                                            onClick={handleResubmit}
                                        >
                                            Gửi lại
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="my-5 border-t border-divider_01" />

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
                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                    {house && (
                                        <Field
                                            icon={<MapPin className="h-4 w-4" />}
                                            label="Nhà số"
                                            value={`${house.code} — ${house.address}`}
                                        />
                                    )}
                                    <Field
                                        icon={<Briefcase className="h-4 w-4" />}
                                        label="Loại hình kinh doanh"
                                        value={
                                            business.businessType?.name ||
                                            "Chưa phân loại"
                                        }
                                    />
                                    <Field
                                        icon={<User className="h-4 w-4" />}
                                        label="Chủ hộ kinh doanh"
                                        value={business.ownerName || "Không có"}
                                    />
                                    <Field
                                        icon={<UserCheck className="h-4 w-4" />}
                                        label="Tài khoản đại diện"
                                        value={
                                            business.representativeUserId &&
                                            typeof business.representativeUserId ===
                                                "object"
                                                ? `${business.representativeUserId.displayName}${
                                                      business.representativeUserId
                                                          .phone
                                                          ? ` · ${business.representativeUserId.phone}`
                                                          : ""
                                                  }`
                                                : "Chưa liên kết"
                                        }
                                    />
                                    <Field
                                        icon={<FileText className="h-4 w-4" />}
                                        label="Mã số thuế"
                                        value={business.taxCode || "Chưa cập nhật"}
                                    />
                                    <Field
                                        icon={<Phone className="h-4 w-4" />}
                                        label="Số điện thoại"
                                        value={business.phone || "Không có"}
                                    />
                                    <Field
                                        icon={<StickyNote className="h-4 w-4" />}
                                        label="Ghi chú"
                                        value={business.note || "Không có"}
                                        className="sm:col-span-2"
                                    />
                                    {business.status === "verified" &&
                                        business.approvalNote && (
                                            <Field
                                                icon={
                                                    <AlertCircle className="h-4 w-4" />
                                                }
                                                label="Ghi chú duyệt"
                                                value={business.approvalNote}
                                                className="sm:col-span-2"
                                            />
                                        )}
                                    {business.status === "denied" &&
                                        business.denialReason && (
                                            <Field
                                                icon={
                                                    <AlertCircle className="h-4 w-4" />
                                                }
                                                label="Lý do từ chối"
                                                value={business.denialReason}
                                                className="sm:col-span-2"
                                            />
                                        )}
                                </div>

                                {isAdmin && (
                                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-divider_01 pt-4">
                                        <span className="text-sm text-text_2">
                                            Ghi đè trạng thái (Admin):
                                        </span>
                                        <Select
                                            value={overrideStatus || undefined}
                                            onValueChange={val =>
                                                setOverrideStatus(
                                                    val as VerificationStatus,
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
                                                                VERIFICATION_STATUS_LABEL[
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
                        entityId={business._id}
                        fetchItems={fetchRequiredDocuments}
                        onReview={reviewBusinessDocument}
                        verifyPermission="businesses.verify"
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

const Field: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    className?: string;
}> = ({ icon, label, value, className }) => (
    <div className={`flex items-start gap-3 ${className || ""}`}>
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-icon_bg text-primary">
            {icon}
        </div>
        <div className="min-w-0">
            <div className="text-xs text-text_2">{label}</div>
            <div className="break-words text-sm font-medium text-text_1">
                {value}
            </div>
        </div>
    </div>
);

export default BusinessDetailPage;
