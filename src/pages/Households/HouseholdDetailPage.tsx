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
import { usePermission } from "@store/authStore";
import { AppError, Citizen, Household } from "@dts";
import { LOAI_SO_HUU_LABEL } from "@constants/domain";
import {
    deleteHousehold,
    fetchHouseholdById,
    fetchHouseholdCitizens,
    updateHousehold,
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
    phone: h.phone || "",
    memberCount: h.memberCount ? String(h.memberCount) : "",
    ownershipType: h.ownershipType,
    needsSupport: h.needsSupport,
    note: h.note || "",
});

const citizenToForm = (c: Citizen, householdId: string): CitizenFormValues => ({
    fullName: c.fullName,
    phone: c.phone || "",
    cccd: c.cccd || "",
    birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
    gender: c.gender,
    relationToHead: c.relationToHead || "",
    householdId,
    householdLabel: "",
    residenceType: c.residenceType,
    isElderly: c.isElderly,
    isChild: c.isChild,
    isDisabledOrSupportNeeded: c.isDisabledOrSupportNeeded,
    isPartyMember: c.isPartyMember,
    isUnionMember: c.isUnionMember,
});

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

    const backPath = houseId ? `/houses/${houseId}` : "/houses";

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
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {household.code}
                            </h2>
                            {household.needsSupport && (
                                <Badge tone="yellow">Cần hỗ trợ</Badge>
                            )}
                        </div>

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
                            <>
                                <InfoRow
                                    label="Cụm dân cư"
                                    value={household.cluster}
                                />
                                <InfoRow
                                    label="Địa chỉ"
                                    value={household.address}
                                />
                                <InfoRow
                                    label="Chủ hộ"
                                    value={household.headOfHousehold}
                                />
                                <InfoRow
                                    label="Số điện thoại"
                                    value={household.phone || "Chưa cập nhật"}
                                />
                                <InfoRow
                                    label="Số nhân khẩu"
                                    value={String(household.memberCount ?? 0)}
                                />
                                <InfoRow
                                    label="Hình thức sở hữu"
                                    value={
                                        LOAI_SO_HUU_LABEL[household.ownershipType]
                                    }
                                />
                                <InfoRow
                                    label="Ghi chú"
                                    value={household.note || "Không có"}
                                />

                                <div className="mt-4 flex gap-2">
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
                            </>
                        )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Nhân khẩu trong hộ
                            </h2>
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
                                    className={
                                        canUpdateCitizen
                                            ? "block w-full border-b border-divider_01 py-2 text-left last:border-0 hover:bg-ng_10"
                                            : "block w-full border-b border-divider_01 py-2 text-left last:border-0"
                                    }
                                    onClick={() => openEditCitizen(c)}
                                >
                                    <div className="text-sm font-medium">
                                        {c.fullName}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {c.cccd || c.phone || c.relationToHead}
                                    </div>
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

export default HouseholdDetailPage;
