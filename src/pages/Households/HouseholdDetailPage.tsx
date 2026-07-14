import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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

const HouseholdDetailPage: React.FC = () => (
    <AdminGuard permissions={["households.read"]}>
        <HouseholdDetailContent />
    </AdminGuard>
);

const HouseholdDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canUpdate = usePermission("households.update");
    const canDelete = usePermission("households.delete");

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
            navigate("/households");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div>
            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && household && form && (
                <>
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h1 className="text-lg font-semibold">
                                {household.code}
                            </h1>
                            {household.needsSupport && (
                                <Badge tone="yellow">Cần hỗ trợ</Badge>
                            )}
                        </div>

                        {editing ? (
                            <>
                                <HouseholdForm values={form} onChange={setForm} />
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
                        <h2 className="mb-2 text-base font-semibold">
                            Nhân khẩu trong hộ
                        </h2>
                        {citizensLoading && <LoadingState />}
                        {!citizensLoading && citizens.length === 0 && (
                            <EmptyState label="Chưa có nhân khẩu nào trong hộ" />
                        )}
                        {!citizensLoading &&
                            citizens.map(c => (
                                <button
                                    key={c._id}
                                    type="button"
                                    className="block w-full border-b border-divider_01 py-2 text-left last:border-0 hover:bg-ng_10"
                                    onClick={() => navigate("/citizens")}
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
