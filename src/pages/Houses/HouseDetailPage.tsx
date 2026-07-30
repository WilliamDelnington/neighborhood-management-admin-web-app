import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import {
    LoadingState,
    EmptyState,
    ErrorState,
} from "@components/admin/DataStates";
import HouseholdPicker from "@components/admin/HouseholdPicker";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import { useAuthStore, usePermission } from "@store/authStore";
import {
    BUSINESS_STATUS_LABEL,
    BUSINESS_STATUS_TONE,
    HOUSE_AUDIT_ACTION_LABEL,
    HOUSE_STATUS_LABEL,
    HOUSE_STATUS_TONE,
} from "@constants/domain";
import { AppError, Business, FileAsset, House, HouseStatus, Household } from "@dts";
import {
    deleteHouse,
    deleteHouseAttachment,
    fetchHouseAttachments,
    fetchHouseAuditLogs,
    fetchHouseBusinesses,
    fetchHouseById,
    fetchHouseHouseholds,
    updateHouse,
    updateHouseStatus,
} from "@service/houseApi";
import { createHousehold, updateHousehold } from "@service/householdApi";
import { createBusiness } from "@service/businessApi";
import HouseholdForm, {
    EMPTY_HOUSEHOLD_FORM,
    HouseholdFormValues,
    isHouseholdFormValid,
    toHouseholdInput,
} from "@pages/Households/HouseholdForm";
import HouseForm, {
    HouseFormValues,
    isHouseFormValid,
    toHouseInput,
} from "./HouseForm";
import BusinessForm, {
    EMPTY_BUSINESS_FORM,
    isBusinessFormValid,
    toBusinessInput,
} from "./BusinessForm";

const toFormValues = (h: House): HouseFormValues => ({
    cluster: h.cluster,
    address: h.address,
    note: h.note || "",
    residenceDeclarationNumber: h.residenceDeclarationNumber || "",
});

const HouseDetailPage: React.FC = () => (
    <AdminGuard permissions={["houses.read"]}>
        <HouseDetailContent />
    </AdminGuard>
);

const HouseDetailContent: React.FC = () => {
    const { houseId } = useParams<{ houseId: string }>();
    const navigate = useNavigate();
    const currentUserId = useAuthStore(state => state.user?.id);
    const canUpdate = usePermission("houses.update");
    const canDelete = usePermission("houses.delete");
    const canVerify = usePermission("houses.verify");
    const canLock = usePermission("houses.lock");
    const canCreateHousehold = usePermission("households.create");
    const canCreateBusiness = usePermission("businesses.create");
    const canManageAttachments = canUpdate || canVerify;

    const [house, setHouse] = useState<House | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<HouseFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const [households, setHouseholds] = useState<Household[]>([]);
    const [householdsLoading, setHouseholdsLoading] = useState(true);
    const [createHouseholdVisible, setCreateHouseholdVisible] = useState(false);
    const [householdForm, setHouseholdForm] = useState<HouseholdFormValues>(
        EMPTY_HOUSEHOLD_FORM,
    );
    const [submittingHousehold, setSubmittingHousehold] = useState(false);
    const [attachVisible, setAttachVisible] = useState(false);
    const [attaching, setAttaching] = useState(false);

    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [businessesLoading, setBusinessesLoading] = useState(true);
    const [businessSheetVisible, setBusinessSheetVisible] = useState(false);
    const [businessForm, setBusinessForm] = useState(EMPTY_BUSINESS_FORM);
    const [submittingBusiness, setSubmittingBusiness] = useState(false);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);

    const load = () => {
        if (!houseId) return;
        setLoading(true);
        setError(false);
        fetchHouseById(houseId)
            .then(h => {
                setHouse(h);
                setForm(toFormValues(h));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const loadHouseholds = () => {
        if (!houseId) return;
        setHouseholdsLoading(true);
        fetchHouseHouseholds(houseId)
            .then((res: any) => setHouseholds(res.items || res))
            .catch(() => setHouseholds([]))
            .finally(() => setHouseholdsLoading(false));
    };

    const loadBusinesses = () => {
        if (!houseId) return;
        setBusinessesLoading(true);
        fetchHouseBusinesses(houseId)
            .then((res: any) => setBusinesses(res.items || res))
            .catch(() => setBusinesses([]))
            .finally(() => setBusinessesLoading(false));
    };

    const loadAttachments = () => {
        if (!houseId) return;
        setAttachmentsLoading(true);
        fetchHouseAttachments(houseId)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    useEffect(() => {
        load();
        loadHouseholds();
        loadBusinesses();
        loadAttachments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [houseId]);

    const handleDeleteAttachment = async (fileId: string) => {
        if (!houseId) return;
        try {
            setDeletingAttachmentId(fileId);
            await deleteHouseAttachment(houseId, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa tài liệu đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    const handleSave = async () => {
        if (!houseId || !form) return;
        if (!isHouseFormValid(form)) {
            toast.error("Vui lòng nhập đầy đủ cụm dân cư, địa chỉ");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateHouse(houseId, toHouseInput(form));
            setHouse(updated);
            setForm(toFormValues(updated));
            setEditing(false);
            toast.success("Đã cập nhật nhà số");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!houseId) return;
        try {
            setDeleting(true);
            await deleteHouse(houseId);
            toast.success("Đã xóa nhà số");
            navigate("/houses");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    let ownerId: string | undefined;
    if (house?.ownerId) {
        ownerId =
            typeof house.ownerId === "string"
                ? house.ownerId
                : house.ownerId._id;
    }
    const isOwner = !!ownerId && ownerId === currentUserId;

    const handleStatusChange = async (status: HouseStatus) => {
        if (!houseId) return;
        try {
            setStatusUpdating(true);
            const updated = await updateHouseStatus(houseId, status);
            setHouse(updated);
            toast.success("Đã cập nhật trạng thái nhà số");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const openCreateHousehold = () => {
        setHouseholdForm(EMPTY_HOUSEHOLD_FORM);
        setCreateHouseholdVisible(true);
    };

    const handleCreateHousehold = async () => {
        if (!houseId || !isHouseholdFormValid(householdForm)) {
            toast.error("Vui lòng nhập đầy đủ cụm dân cư, địa chỉ, chủ hộ");
            return;
        }
        try {
            setSubmittingHousehold(true);
            await createHousehold(toHouseholdInput(householdForm, houseId));
            toast.success("Đã thêm hộ dân mới");
            setCreateHouseholdVisible(false);
            loadHouseholds();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmittingHousehold(false);
        }
    };

    const handleAttachHousehold = async (id: string) => {
        if (!houseId) return;
        try {
            setAttaching(true);
            await updateHousehold(id, { houseId });
            toast.success("Đã gắn hộ dân vào nhà số");
            setAttachVisible(false);
            loadHouseholds();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAttaching(false);
        }
    };

    const openCreateBusiness = () => {
        setBusinessForm(EMPTY_BUSINESS_FORM);
        setBusinessSheetVisible(true);
    };

    const handleSubmitBusiness = async () => {
        if (!houseId || !isBusinessFormValid(businessForm)) {
            toast.error("Vui lòng nhập tên hộ kinh doanh");
            return;
        }
        try {
            setSubmittingBusiness(true);
            await createBusiness(toBusinessInput(businessForm, houseId));
            toast.success("Đã thêm hộ kinh doanh mới");
            setBusinessSheetVisible(false);
            loadBusinesses();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmittingBusiness(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/houses")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Nhà số</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && house && form && (
                <>
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {house.code}
                            </h2>
                            <Badge tone={HOUSE_STATUS_TONE[house.status]}>
                                {HOUSE_STATUS_LABEL[house.status]}
                            </Badge>
                        </div>

                        {editing ? (
                            <>
                                <HouseForm values={form} onChange={setForm} />
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setForm(toFormValues(house));
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
                                <InfoRow label="Cụm dân cư" value={house.cluster} />
                                <InfoRow label="Địa chỉ" value={house.address} />
                                <InfoRow
                                    label="Ghi chú"
                                    value={house.note || "Không có"}
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
                                    {isOwner &&
                                        (house.status === "unverified" ||
                                            house.status === "denied") && (
                                            <Button
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    handleStatusChange(
                                                        "pending",
                                                    )
                                                }
                                            >
                                                Gửi duyệt
                                            </Button>
                                        )}
                                    {canVerify && house.status === "pending" && (
                                        <>
                                            <Button
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    handleStatusChange(
                                                        "verified",
                                                    )
                                                }
                                            >
                                                Duyệt
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    handleStatusChange(
                                                        "denied",
                                                    )
                                                }
                                            >
                                                Từ chối
                                            </Button>
                                        </>
                                    )}
                                    {canLock && house.status !== "locked" && (
                                        <Button
                                            variant="outline"
                                            loading={statusUpdating}
                                            onClick={() =>
                                                handleStatusChange("locked")
                                            }
                                        >
                                            Khóa
                                        </Button>
                                    )}
                                    {canLock && house.status === "locked" && (
                                        <Button
                                            variant="outline"
                                            loading={statusUpdating}
                                            onClick={() =>
                                                handleStatusChange("pending")
                                            }
                                        >
                                            Mở khóa
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Hộ dân trong nhà
                            </h2>
                            {canCreateHousehold && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAttachVisible(true)}
                                    >
                                        Gắn hộ dân có sẵn
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={openCreateHousehold}
                                    >
                                        <Plus className="mr-1 h-4 w-4" />
                                        Thêm hộ dân mới
                                    </Button>
                                </div>
                            )}
                        </div>
                        {householdsLoading && <LoadingState />}
                        {!householdsLoading && households.length === 0 && (
                            <EmptyState label="Chưa có hộ dân nào trong nhà" />
                        )}
                        {!householdsLoading &&
                            households.map(h => (
                                <button
                                    key={h._id}
                                    type="button"
                                    className="block w-full border-b border-divider_01 py-2 text-left last:border-0 hover:bg-ng_10"
                                    onClick={() =>
                                        navigate(
                                            `/houses/${houseId}/households/${h._id}`,
                                        )
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">
                                            {h.code} — {h.headOfHousehold}
                                        </div>
                                        {h.needsSupport && (
                                            <Badge tone="yellow">
                                                Cần hỗ trợ
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {h.memberCount} nhân khẩu
                                    </div>
                                </button>
                            ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Hộ kinh doanh
                            </h2>
                            {canCreateBusiness && (
                                <Button size="sm" onClick={openCreateBusiness}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm hộ kinh doanh
                                </Button>
                            )}
                        </div>
                        {businessesLoading && <LoadingState />}
                        {!businessesLoading && businesses.length === 0 && (
                            <EmptyState label="Chưa có hộ kinh doanh nào" />
                        )}
                        {!businessesLoading &&
                            businesses.map(b => (
                                <button
                                    key={b._id}
                                    type="button"
                                    className="block w-full border-b border-divider_01 py-2 text-left last:border-0 hover:bg-ng_10"
                                    onClick={() =>
                                        navigate(
                                            `/houses/${houseId}/businesses/${b._id}`,
                                        )
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">
                                            {b.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge tone={BUSINESS_STATUS_TONE[b.status]}>
                                                {BUSINESS_STATUS_LABEL[b.status]}
                                            </Badge>
                                            {!b.active && (
                                                <Badge tone="gray">
                                                    Ngừng hoạt động
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {b.businessType?.name || "Chưa phân loại"}
                                    </div>
                                </button>
                            ))}
                    </div>

                    <AttachmentsPanel
                        attachments={attachments}
                        loading={attachmentsLoading}
                        canManage={canManageAttachments}
                        deletingId={deletingAttachmentId}
                        onDelete={handleDeleteAttachment}
                    />

                    {houseId && (
                        <RecordHistorySection
                            fetchHistory={params =>
                                fetchHouseAuditLogs(houseId, params)
                            }
                            actionLabels={HOUSE_AUDIT_ACTION_LABEL}
                            historyHref={`/houses/${houseId}/history`}
                        />
                    )}
                </>
            )}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa nhà số?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa nhà {house?.code || ""}? Hành động
                        này không thể hoàn tác.
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

            <Sheet
                open={createHouseholdVisible}
                onOpenChange={setCreateHouseholdVisible}
            >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Thêm hộ dân mới</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <HouseholdForm
                            values={householdForm}
                            onChange={setHouseholdForm}
                            lockedCluster={house?.cluster}
                        />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submittingHousehold}
                            onClick={handleCreateHousehold}
                        >
                            Lưu hộ dân
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog open={attachVisible} onOpenChange={setAttachVisible}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gắn hộ dân có sẵn</DialogTitle>
                    </DialogHeader>
                    <HouseholdPicker
                        label="Chọn hộ dân chưa gán nhà số"
                        unassignedOnly
                        disabled={attaching}
                        onChange={householdId =>
                            handleAttachHousehold(householdId)
                        }
                    />
                </DialogContent>
            </Dialog>

            <Sheet
                open={businessSheetVisible}
                onOpenChange={setBusinessSheetVisible}
            >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Thêm hộ kinh doanh</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <BusinessForm
                            values={businessForm}
                            onChange={setBusinessForm}
                        />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submittingBusiness}
                            onClick={handleSubmitBusiness}
                        >
                            Thêm hộ kinh doanh
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
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

export default HouseDetailPage;
