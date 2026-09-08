import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CreditCard,
    Home,
    MapPin,
    Phone,
    User,
    Users,
} from "lucide-react";
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
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { AppError, Citizen, Household } from "@dts";
import { deleteCitizen, fetchCitizenById, updateCitizen } from "@service/citizenApi";
import CitizenForm, {
    CitizenFormValues,
    isCitizenFormValid,
    toCitizenInput,
} from "./CitizenForm";

const citizenToForm = (c: Citizen): CitizenFormValues => {
    const household =
        typeof c.householdId === "string" ? null : c.householdId;
    return {
        fullName: c.fullName,
        phone: c.phone || "",
        cccd: c.cccd || "",
        birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
        gender: c.gender,
        relationToHead: c.relationToHead || "",
        occupation: c.occupation || "",
        householdId: household ? household._id : (c.householdId as string),
        householdLabel: household
            ? `${household.code} — ${household.address}`
            : "",
        residenceType: c.residenceType,
        isElderly: c.isElderly,
        isChild: c.isChild,
        isDisabledOrSupportNeeded: c.isDisabledOrSupportNeeded,
        isPartyMember: c.isPartyMember,
        isUnionMember: c.isUnionMember,
    };
};

const initialsOf = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
};

const ageOf = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const beforeBirthday =
        now.getMonth() < d.getMonth() ||
        (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
};

const CitizenDetailPage: React.FC = () => (
    <AdminGuard permissions={["citizens.read"]}>
        <CitizenDetailContent />
    </AdminGuard>
);

const CitizenDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canUpdate = usePermission("citizens.update");
    const canDelete = usePermission("citizens.delete");

    const [citizen, setCitizen] = useState<Citizen | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<CitizenFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchCitizenById(id)
            .then(c => {
                setCitizen(c);
                setForm(citizenToForm(c));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const household: Household | null =
        citizen && typeof citizen.householdId !== "string"
            ? citizen.householdId
            : null;

    const handleSave = async () => {
        if (!id || !form) return;
        if (!isCitizenFormValid(form)) {
            toast.error("Vui lòng nhập họ tên và chọn hộ dân");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateCitizen(id, toCitizenInput(form));
            setCitizen(updated);
            setForm(citizenToForm(updated));
            setEditing(false);
            toast.success("Đã cập nhật nhân khẩu");
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
            await deleteCitizen(id);
            toast.success("Đã xóa nhân khẩu");
            navigate("/citizens");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const age = citizen ? ageOf(citizen.birthDate) : null;
    const birthDateLabel = citizen?.birthDate
        ? `${new Date(citizen.birthDate).toLocaleDateString("vi-VN")}${
              age !== null ? ` (${age} tuổi)` : ""
          }`
        : "Chưa cập nhật";

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/citizens")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Nhân khẩu</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && citizen && form && (
                <>
                    <div className="rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-main to-primary-dark text-lg font-semibold text-white ring-2 ring-blue_10">
                                    {initialsOf(citizen.fullName)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text_1">
                                        {citizen.fullName}
                                    </h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <Badge
                                            tone={
                                                citizen.residenceType ===
                                                "thuong_tru"
                                                    ? "green"
                                                    : "gray"
                                            }
                                        >
                                            {
                                                LOAI_CU_TRU_LABEL[
                                                    citizen.residenceType
                                                ]
                                            }
                                        </Badge>
                                        {citizen.isElderly && (
                                            <Badge tone="blue">
                                                Người cao tuổi
                                            </Badge>
                                        )}
                                        {citizen.isChild && (
                                            <Badge tone="blue">Trẻ em</Badge>
                                        )}
                                        {citizen.isDisabledOrSupportNeeded && (
                                            <Badge tone="yellow">
                                                Khuyết tật / cần hỗ trợ
                                            </Badge>
                                        )}
                                        {citizen.isPartyMember && (
                                            <Badge tone="gray">
                                                Đảng viên
                                            </Badge>
                                        )}
                                        {citizen.isUnionMember && (
                                            <Badge tone="gray">
                                                Đoàn viên / hội viên
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!editing && (
                                <div className="flex flex-wrap gap-2">
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
                            )}
                        </div>

                        <div className="my-5 border-t border-divider_01" />

                        {editing ? (
                            <>
                                <CitizenForm values={form} onChange={setForm} />
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setForm(citizenToForm(citizen));
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
                                    icon={<Phone className="h-4 w-4" />}
                                    label="Số điện thoại"
                                    value={citizen.phone || "Chưa cập nhật"}
                                />
                                <Field
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="Số CCCD"
                                    value={citizen.cccd || "Chưa cập nhật"}
                                />
                                <Field
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Ngày sinh"
                                    value={birthDateLabel}
                                />
                                <Field
                                    icon={<User className="h-4 w-4" />}
                                    label="Giới tính"
                                    value={GIOI_TINH_LABEL[citizen.gender]}
                                />
                                <Field
                                    icon={<Users className="h-4 w-4" />}
                                    label="Quan hệ với chủ hộ"
                                    value={citizen.relationToHead || "—"}
                                />
                                <Field
                                    icon={<Briefcase className="h-4 w-4" />}
                                    label="Nghề nghiệp/nơi làm việc"
                                    value={citizen.occupation || "—"}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-text_2" />
                                <h2 className="text-base font-semibold text-text_1">
                                    Hộ dân
                                </h2>
                            </div>
                            {household && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        navigate(`/households/${household._id}`)
                                    }
                                >
                                    Xem chi tiết hộ dân
                                </Button>
                            )}
                        </div>
                        {household ? (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <Field
                                    icon={<Home className="h-4 w-4" />}
                                    label="Mã hộ"
                                    value={household.code}
                                />
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
                                    value={
                                        household.headOfHousehold ||
                                        "Chưa cập nhật"
                                    }
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-text_2">
                                Không có thông tin hộ dân
                            </p>
                        )}
                    </div>
                </>
            )}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa nhân khẩu?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa nhân khẩu {citizen?.fullName || ""}
                        ? Hành động này không thể hoàn tác.
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
}> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
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

export default CitizenDetailPage;
