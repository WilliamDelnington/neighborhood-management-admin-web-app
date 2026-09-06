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
                    <div className="rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {company.name}
                            </h2>
                            <Badge tone={VERIFICATION_STATUS_TONE[company.status]}>
                                {VERIFICATION_STATUS_LABEL[company.status]}
                            </Badge>
                        </div>

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
                                {house && (
                                    <InfoRow
                                        label="Nhà số"
                                        value={`${house.code} — ${house.address}`}
                                    />
                                )}
                                <InfoRow
                                    label="Người đại diện"
                                    value={company.ownerName || "Không có"}
                                />
                                <InfoRow
                                    label="Tổ chức liên kết"
                                    value={
                                        company.organizationId &&
                                        typeof company.organizationId === "object"
                                            ? company.organizationId.name
                                            : "Không có"
                                    }
                                />
                                <InfoRow
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
                                <InfoRow
                                    label="Số điện thoại"
                                    value={company.phone || "Không có"}
                                />
                                <InfoRow
                                    label="Trạng thái hoạt động"
                                    value={
                                        company.active
                                            ? "Đang hoạt động"
                                            : "Ngừng hoạt động"
                                    }
                                />
                                <InfoRow
                                    label="Ghi chú"
                                    value={company.note || "Không có"}
                                />

                                <div className="mt-4 flex flex-wrap gap-2">
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

                                {isAdmin && (
                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-divider_01 pt-4">
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

const InfoRow: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <div className="flex justify-between border-b border-divider_01 py-2 text-sm last:border-0">
        <span className="text-text_2">{label}</span>
        <span>{value}</span>
    </div>
);

export default CompanyDetailPage;
