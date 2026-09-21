import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Building2,
    FileText,
    Landmark,
    MapPin,
    Phone,
    StickyNote,
    User,
    UserCheck,
    Users,
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
import RequiredDocumentsPanel from "@components/admin/RequiredDocumentsPanel";
import { useAuthStore, usePermission } from "@store/authStore";
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { AppError, Company, VerificationStatus, House } from "@dts";
import {
    deleteCompany,
    fetchCompanyById,
    fetchCompanyRequiredDocuments,
    reviewCompanyDocument,
    updateCompany,
    updateCompanyStatus,
} from "@service/companyApi";
import CompanyForm, {
    CompanyFormValues,
    isCompanyFormValid,
    toCompanyInput,
} from "./CompanyForm";

const COMPANY_STATUS_OPTIONS: VerificationStatus[] = [
    "unverified",
    "pending",
    "verified",
    "denied",
    "locked",
];

const toFormValues = (c: Company): CompanyFormValues => {
    const rep =
        c.representativeUserId && typeof c.representativeUserId === "object"
            ? c.representativeUserId
            : null;
    const organization =
        c.organizationId && typeof c.organizationId === "object"
            ? c.organizationId
            : null;
    return {
        name: c.name,
        ownerName: c.ownerName || "",
        taxCode: c.taxCode || "",
        representativeUserId: rep?._id || "",
        representativeUserLabel: rep
            ? `${rep.displayName}${rep.phone ? ` · ${rep.phone}` : ""}`
            : "",
        organizationId: organization?._id || "",
        organizationLabel: organization?.name || "",
        businessTypeIds: (c.businessTypeIds || [])
            .map(bt => (typeof bt === "object" ? bt._id : bt))
            .filter(Boolean),
        companyTypeId:
            c.companyTypeId && typeof c.companyTypeId === "object"
                ? c.companyTypeId._id
                : c.companyTypeId || "",
        phone: c.phone || "",
        active: c.active,
        note: c.note || "",
    };
};

const CompanyDetailPage: React.FC = () => (
    <AdminGuard permissions={["companies.read"]}>
        <CompanyDetailContent />
    </AdminGuard>
);

const CompanyDetailContent: React.FC = () => {
    const { houseId, companyId } = useParams<{
        houseId: string;
        companyId: string;
    }>();
    const navigate = useNavigate();
    const isAdmin = useAuthStore(state => !!state.user?.roles.includes("admin"));
    const canUpdate = usePermission("companies.update");
    const canDelete = usePermission("companies.delete");

    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<CompanyFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [overrideStatus, setOverrideStatus] = useState<VerificationStatus | "">(
        "",
    );
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [resubmitting, setResubmitting] = useState(false);

    const load = () => {
        if (!companyId) return;
        setLoading(true);
        setError(false);
        fetchCompanyById(companyId)
            .then(c => {
                setCompany(c);
                setForm(toFormValues(c));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const houseIdValue = (): string => {
        if (!company || !company.houseId) return "";
        return typeof company.houseId === "string"
            ? company.houseId
            : company.houseId._id;
    };

    const handleSave = async () => {
        if (!companyId || !form) return;
        if (!isCompanyFormValid(form)) {
            toast.error("Vui lòng nhập tên công ty");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateCompany(
                companyId,
                toCompanyInput(form, houseIdValue()),
            );
            setCompany(updated);
            setForm(toFormValues(updated));
            setEditing(false);
            toast.success("Đã cập nhật công ty");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!companyId) return;
        try {
            setDeleting(true);
            await deleteCompany(companyId);
            toast.success("Đã xóa công ty");
            navigate(houseId ? `/houses/${houseId}` : "/houses");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const house: House | null =
        company && typeof company.houseId !== "string" ? company.houseId : null;

    const handleOverrideStatus = async () => {
        if (!companyId || !overrideStatus) return;
        try {
            setStatusUpdating(true);
            const updated = await updateCompanyStatus(companyId, overrideStatus);
            setCompany(updated);
            setOverrideStatus("");
            toast.success("Đã ghi đè trạng thái công ty");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleResubmit = async () => {
        if (!companyId) return;
        try {
            setResubmitting(true);
            const updated = await updateCompanyStatus(companyId, "pending");
            setCompany(updated);
            toast.success("Đã gửi lại công ty để duyệt");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setResubmitting(false);
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
                <h1 className="text-lg font-semibold">Công ty</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && company && form && (
                <>
                    <div className="rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-main to-primary-dark ring-2 ring-blue_10">
                                    <Building2 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text_1">
                                        {company.name}
                                    </h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge
                                            tone={
                                                VERIFICATION_STATUS_TONE[
                                                    company.status
                                                ]
                                            }
                                        >
                                            {
                                                VERIFICATION_STATUS_LABEL[
                                                    company.status
                                                ]
                                            }
                                        </Badge>
                                        {!company.active && (
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
                                            company.status,
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
                                    {canUpdate && company.status === "denied" && (
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
                                <CompanyForm values={form} onChange={setForm} />
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setForm(toFormValues(company));
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
                                        icon={<FileText className="h-4 w-4" />}
                                        label="Mã số thuế"
                                        value={company.taxCode || "Chưa cập nhật"}
                                    />
                                    <Field
                                        icon={<User className="h-4 w-4" />}
                                        label="Người đại diện"
                                        value={company.ownerName || "Không có"}
                                    />
                                    <Field
                                        icon={<UserCheck className="h-4 w-4" />}
                                        label="Tài khoản đại diện"
                                        value={
                                            company.representativeUserId &&
                                            typeof company.representativeUserId ===
                                                "object"
                                                ? `${company.representativeUserId.displayName}${
                                                      company.representativeUserId
                                                          .phone
                                                          ? ` · ${company.representativeUserId.phone}`
                                                          : ""
                                                  }`
                                                : "Chưa liên kết"
                                        }
                                    />
                                    <Field
                                        icon={<Users className="h-4 w-4" />}
                                        label="Tổ chức liên kết"
                                        value={
                                            company.organizationId &&
                                            typeof company.organizationId ===
                                                "object"
                                                ? company.organizationId.name
                                                : "Không có"
                                        }
                                    />
                                    <Field
                                        icon={<Briefcase className="h-4 w-4" />}
                                        label="Loại hình kinh doanh"
                                        value={
                                            (company.businessTypeIds || [])
                                                .map(bt =>
                                                    typeof bt === "object"
                                                        ? bt.name
                                                        : null,
                                                )
                                                .filter(Boolean)
                                                .join(", ") || "Chưa phân loại"
                                        }
                                    />
                                    <Field
                                        icon={<Landmark className="h-4 w-4" />}
                                        label="Loại hình doanh nghiệp"
                                        value={
                                            company.companyTypeId &&
                                            typeof company.companyTypeId ===
                                                "object"
                                                ? company.companyTypeId.name
                                                : "Chưa chọn"
                                        }
                                    />
                                    <Field
                                        icon={<Phone className="h-4 w-4" />}
                                        label="Số điện thoại"
                                        value={company.phone || "Không có"}
                                    />
                                    <Field
                                        icon={<StickyNote className="h-4 w-4" />}
                                        label="Ghi chú"
                                        value={company.note || "Không có"}
                                        className="sm:col-span-2"
                                    />
                                    {company.status === "verified" &&
                                        company.approvalNote && (
                                            <Field
                                                icon={
                                                    <AlertCircle className="h-4 w-4" />
                                                }
                                                label="Ghi chú duyệt"
                                                value={company.approvalNote}
                                                className="sm:col-span-2"
                                            />
                                        )}
                                    {company.status === "denied" &&
                                        company.denialReason && (
                                            <Field
                                                icon={
                                                    <AlertCircle className="h-4 w-4" />
                                                }
                                                label="Lý do từ chối"
                                                value={company.denialReason}
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
                                                {COMPANY_STATUS_OPTIONS.map(
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

                    {companyId && (
                        <RequiredDocumentsPanel
                            entityId={companyId}
                            fetchItems={fetchCompanyRequiredDocuments}
                            onReview={reviewCompanyDocument}
                            verifyPermission="companies.verify"
                            onChanged={load}
                            emptyLabel="Loại hình doanh nghiệp này chưa có yêu cầu giấy tờ nào"
                        />
                    )}
                </>
            )}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa công ty?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa công ty {company?.name || ""}? Hành
                        động này không thể hoàn tác.
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

export default CompanyDetailPage;
