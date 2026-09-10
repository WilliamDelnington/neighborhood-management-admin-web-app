import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    Building2,
    Home,
    KeyRound,
    MapPin,
    Phone,
    Plus,
    StickyNote,
    User,
    Users,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
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
import { usePermission } from "@store/authStore";
import RequiredDocumentsPanel from "@components/admin/RequiredDocumentsPanel";
import { AppError, Citizen, Household, VerificationStatus } from "@dts";
import {
    HOUSEHOLD_STATE_LIST,
    LOAI_SO_HUU_LABEL,
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import {
    deleteHousehold,
    fetchHouseholdById,
    fetchHouseholdCitizens,
    fetchHouseholdRequiredDocuments,
    reviewHouseholdDocument,
    updateHousehold,
    updateHouseholdStatus,
} from "@service/householdApi";
import {
    createCitizen,
    deleteCitizen,
    updateCitizen,
} from "@service/citizenApi";
import CitizenForm, {
    CitizenFormValues,
    EMPTY_CITIZEN_FORM,
    isCitizenFormValid,
    toCitizenInput,
} from "@pages/Citizens/CitizenForm";
import HouseholdForm, {
    HouseholdFormValues,
    isHouseholdFormValid,
    toHouseholdInput,
} from "./HouseholdForm";

const toFormValues = (h: Household): HouseholdFormValues => ({
    cluster: h.cluster,
    address: h.address,
    headOfHousehold: h.headOfHousehold,
    headOfHouseholdUserId:
        typeof h.headOfHouseholdUserId === "object" && h.headOfHouseholdUserId
            ? h.headOfHouseholdUserId._id
            : h.headOfHouseholdUserId || "",
    headOfHouseholdUserLabel:
        typeof h.headOfHouseholdUserId === "object" && h.headOfHouseholdUserId
            ? h.headOfHouseholdUserId.displayName
            : "",
    phone: h.phone || "",
    memberCount: h.memberCount ? String(h.memberCount) : "",
    ownershipType: h.ownershipType,
    needsSupport: h.needsSupport,
    isNearPoor: h.isNearPoor,
    isMartyrFamilyHousehold: h.isMartyrFamilyHousehold,
    isLonelyElderly: h.isLonelyElderly,
    note: h.note || "",
});

const citizenToForm = (c: Citizen, householdId: string): CitizenFormValues => ({
    fullName: c.fullName,
    phone: c.phone || "",
    cccd: c.cccd || "",
    birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
    gender: c.gender,
    relationToHead: c.relationToHead || "",
    occupation: c.occupation || "",
    householdId,
    householdLabel: "",
    residenceType: c.residenceType,
    temporaryResidenceStartsAt: c.temporaryResidenceStartsAt
        ? c.temporaryResidenceStartsAt.slice(0, 10)
        : "",
    temporaryResidenceExpiresAt: c.temporaryResidenceExpiresAt
        ? c.temporaryResidenceExpiresAt.slice(0, 10)
        : "",
    isResidencyDeclared: c.isResidencyDeclared,
    isElderly: c.isElderly,
    isChild: c.isChild,
    isDisabledOrSupportNeeded: c.isDisabledOrSupportNeeded,
    isDisabledChild: c.isDisabledChild,
    isPartyMember: c.isPartyMember,
    isUnionMember: c.isUnionMember,
    isMartyr: c.isMartyr,
    isMartyrFamily: c.isMartyrFamily,
    isVeteran: c.isVeteran,
    isOtherSpecial: c.isOtherSpecial,
    otherSpecialLabel: c.otherSpecialLabel || "",
});

const initialsOf = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
};

const HouseholdDetailPage: React.FC = () => (
    <AdminGuard permissions={["households.read"]}>
        <HouseholdDetailContent />
    </AdminGuard>
);

const HouseholdDetailContent: React.FC = () => {
    const { houseId, id } = useParams<{ houseId: string; id: string }>();
    const navigate = useNavigate();
    const canUpdate = usePermission("households.update");
    const canDelete = usePermission("households.delete");
    const canVerify = usePermission("households.verify");
    const canCreateCitizen = usePermission("citizens.create");
    const canUpdateCitizen = usePermission("citizens.update");
    const canDeleteCitizen = usePermission("citizens.delete");

    const [household, setHousehold] = useState<Household | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [citizens, setCitizens] = useState<Citizen[]>([]);
    const [citizensLoading, setCitizensLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<HouseholdFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusDialogTarget, setStatusDialogTarget] =
        useState<VerificationStatus | null>(null);
    const [statusNote, setStatusNote] = useState("");

    const [citizenSheetVisible, setCitizenSheetVisible] = useState(false);
    const [editingCitizenId, setEditingCitizenId] = useState<string | null>(
        null,
    );
    const [citizenForm, setCitizenForm] = useState<CitizenFormValues>(
        EMPTY_CITIZEN_FORM,
    );
    const [submittingCitizen, setSubmittingCitizen] = useState(false);
    const [confirmDeleteCitizenId, setConfirmDeleteCitizenId] = useState<
        string | null
    >(null);
    const [deletingCitizen, setDeletingCitizen] = useState(false);

    const backPath = houseId ? `/houses/${houseId}` : "/households";

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchHouseholdById(id)
            .then(h => {
                setHousehold(h);
                setForm(toFormValues(h));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const loadCitizens = () => {
        if (!id) return;
        setCitizensLoading(true);
        fetchHouseholdCitizens(id)
            .then((res: any) => setCitizens(res.items || res))
            .catch(() => setCitizens([]))
            .finally(() => setCitizensLoading(false));
    };

    useEffect(() => {
        load();
        loadCitizens();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        if (!id || !form) return;
        if (!isHouseholdFormValid(form)) {
            toast.error("Vui lòng nhập đầy đủ cụm dân cư, địa chỉ, chủ hộ");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateHousehold(id, toHouseholdInput(form));
            setHousehold(updated);
            setForm(toFormValues(updated));
            setEditing(false);
            toast.success("Đã cập nhật hộ dân");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await deleteHousehold(id);
            toast.success("Đã xóa hộ dân");
            navigate(backPath);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleStatusChange = async (status: VerificationStatus, note?: string) => {
        if (!id) return;
        try {
            setStatusUpdating(true);
            const updated = await updateHouseholdStatus(id, status, note);
            setHousehold(updated);
            toast.success("Đã cập nhật trạng thái hộ dân");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const openStatusDialog = (status: VerificationStatus) => {
        setStatusNote("");
        setStatusDialogTarget(status);
    };

    const confirmStatusChange = async () => {
        if (!statusDialogTarget) return;
        if (statusDialogTarget === "denied" && !statusNote.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        await handleStatusChange(statusDialogTarget, statusNote.trim() || undefined);
        setStatusDialogTarget(null);
    };

    const openCreateCitizen = () => {
        setEditingCitizenId(null);
        setCitizenForm({ ...EMPTY_CITIZEN_FORM, householdId: id || "" });
        setCitizenSheetVisible(true);
    };

    const openEditCitizen = (c: Citizen) => {
        if (!canUpdateCitizen || !id) return;
        setEditingCitizenId(c._id);
        setCitizenForm(citizenToForm(c, id));
        setCitizenSheetVisible(true);
    };

    const handleSubmitCitizen = async () => {
        if (!isCitizenFormValid(citizenForm)) {
            toast.error("Vui lòng nhập họ tên");
            return;
        }
        try {
            setSubmittingCitizen(true);
            if (editingCitizenId) {
                await updateCitizen(editingCitizenId, toCitizenInput(citizenForm));
                toast.success("Đã cập nhật nhân khẩu");
            } else {
                await createCitizen(toCitizenInput(citizenForm));
                toast.success("Đã thêm nhân khẩu mới");
            }
            setCitizenSheetVisible(false);
            loadCitizens();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmittingCitizen(false);
        }
    };

    const handleDeleteCitizen = async () => {
        if (!confirmDeleteCitizenId) return;
        try {
            setDeletingCitizen(true);
            await deleteCitizen(confirmDeleteCitizenId);
            toast.success("Đã xóa nhân khẩu");
            setConfirmDeleteCitizenId(null);
            setCitizenSheetVisible(false);
            loadCitizens();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingCitizen(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(backPath)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Hộ dân</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && household && form && (
                <>
                    <div className="rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-main to-primary-dark text-white ring-2 ring-blue_10">
                                    <Home className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text_1">
                                        {household.code}
                                    </h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        {HOUSEHOLD_STATE_LIST.filter(
                                            s => household[s.key],
                                        ).map(s => (
                                            <Badge key={s.key} tone={s.tone}>
                                                {s.label}
                                            </Badge>
                                        ))}
                                        <Badge
                                            tone={
                                                VERIFICATION_STATUS_TONE[
                                                    household.status
                                                ]
                                            }
                                        >
                                            {
                                                VERIFICATION_STATUS_LABEL[
                                                    household.status
                                                ]
                                            }
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {!editing && (
                                <div className="flex flex-wrap gap-2">
                                    {canUpdate &&
                                        ["unverified", "pending"].includes(
                                            household.status,
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
                                    {canUpdate &&
                                        (household.status === "unverified" ||
                                            household.status === "denied") && (
                                            <Button
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    handleStatusChange("pending")
                                                }
                                            >
                                                Gửi duyệt
                                            </Button>
                                        )}
                                    {canVerify && household.status === "pending" && (
                                        <>
                                            <Button
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    openStatusDialog("verified")
                                                }
                                            >
                                                Duyệt
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    openStatusDialog("denied")
                                                }
                                            >
                                                Từ chối
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="my-5 border-t border-divider_01" />

                        {editing ? (
                            <>
                                <HouseholdForm
                                    values={form}
                                    onChange={setForm}
                                    lockedCluster={
                                        household.houseId
                                            ? household.cluster
                                            : undefined
                                    }
                                />
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setForm(toFormValues(household));
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
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <Field
                                    icon={<Building2 className="h-4 w-4" />}
                                    label="Cụm dân cư"
                                    value={household.cluster}
                                />
                                <Field
                                    icon={<MapPin className="h-4 w-4" />}
                                    label="Địa chỉ"
                                    value={household.address}
                                />
                                <Field
                                    icon={<User className="h-4 w-4" />}
                                    label="Chủ hộ"
                                    value={household.headOfHousehold}
                                />
                                <Field
                                    icon={<Phone className="h-4 w-4" />}
                                    label="Số điện thoại"
                                    value={household.phone || "Chưa cập nhật"}
                                />
                                <Field
                                    icon={<Users className="h-4 w-4" />}
                                    label="Số nhân khẩu"
                                    value={String(household.memberCount ?? 0)}
                                />
                                <Field
                                    icon={<KeyRound className="h-4 w-4" />}
                                    label="Hình thức sở hữu"
                                    value={
                                        LOAI_SO_HUU_LABEL[household.ownershipType]
                                    }
                                />
                                <Field
                                    icon={<StickyNote className="h-4 w-4" />}
                                    label="Ghi chú"
                                    value={household.note || "Không có"}
                                    className="sm:col-span-2"
                                />
                            </div>
                        )}
                    </div>

                    {id && (
                        <RequiredDocumentsPanel
                            entityId={id}
                            fetchItems={fetchHouseholdRequiredDocuments}
                            onReview={reviewHouseholdDocument}
                            verifyPermission="households.verify"
                            onChanged={load}
                        />
                    )}

                    <div className="mt-4 rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-text_2" />
                                <h2 className="text-base font-semibold text-text_1">
                                    Nhân khẩu trong hộ
                                </h2>
                            </div>
                            {canCreateCitizen && (
                                <Button size="sm" onClick={openCreateCitizen}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm nhân khẩu
                                </Button>
                            )}
                        </div>
                        {citizensLoading && <LoadingState />}
                        {!citizensLoading && citizens.length === 0 && (
                            <EmptyState label="Chưa có nhân khẩu nào trong hộ" />
                        )}
                        {!citizensLoading &&
                            citizens.map(c => (
                                <button
                                    key={c._id}
                                    type="button"
                                    className={`flex w-full items-center gap-3 rounded-md border-b border-divider_01 px-2 py-3 text-left last:border-0${
                                        canUpdateCitizen ? " hover:bg-ng_10" : ""
                                    }`}
                                    onClick={() => openEditCitizen(c)}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-icon_bg text-xs font-semibold text-primary">
                                        {initialsOf(c.fullName)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-text_1">
                                            {c.fullName}
                                        </div>
                                        <div className="truncate text-xs text-text_2">
                                            {c.cccd || c.phone || "Chưa cập nhật"}
                                        </div>
                                    </div>
                                    {c.relationToHead && (
                                        <Badge tone="gray">
                                            {c.relationToHead}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                    </div>
                </>
            )}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa hộ dân?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa hộ {household?.code || ""}? Hành
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

            <Sheet open={citizenSheetVisible} onOpenChange={setCitizenSheetVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingCitizenId ? "Sửa nhân khẩu" : "Thêm nhân khẩu"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <CitizenForm
                            key={editingCitizenId || "new"}
                            values={citizenForm}
                            onChange={setCitizenForm}
                            hideHouseholdPicker
                        />
                    </div>
                    <SheetFooter>
                        {canDeleteCitizen && editingCitizenId && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() =>
                                    setConfirmDeleteCitizenId(editingCitizenId)
                                }
                            >
                                Xóa nhân khẩu
                            </Button>
                        )}
                        <Button
                            className="w-full"
                            loading={submittingCitizen}
                            onClick={handleSubmitCitizen}
                        >
                            {editingCitizenId ? "Lưu thay đổi" : "Thêm nhân khẩu"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!confirmDeleteCitizenId}
                onOpenChange={open => !open && setConfirmDeleteCitizenId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa nhân khẩu?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa nhân khẩu này? Hành động này
                        không thể hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDeleteCitizenId(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={deletingCitizen}
                            onClick={handleDeleteCitizen}
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!statusDialogTarget}
                onOpenChange={open => !open && setStatusDialogTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {statusDialogTarget === "denied"
                                ? "Từ chối hộ dân"
                                : "Duyệt hộ dân"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label className="text-sm text-text_2">
                            {statusDialogTarget === "denied"
                                ? "Lý do từ chối (bắt buộc)"
                                : "Ghi chú duyệt (không bắt buộc)"}
                        </Label>
                        <Textarea
                            value={statusNote}
                            onChange={e => setStatusNote(e.target.value)}
                            placeholder={
                                statusDialogTarget === "denied"
                                    ? "VD: Thiếu giấy tờ, sai địa chỉ..."
                                    : "Ghi chú thêm (nếu có)"
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setStatusDialogTarget(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant={
                                statusDialogTarget === "denied"
                                    ? "destructive"
                                    : "default"
                            }
                            loading={statusUpdating}
                            onClick={confirmStatusChange}
                        >
                            {statusDialogTarget === "denied" ? "Từ chối" : "Duyệt"}
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

export default HouseholdDetailPage;
