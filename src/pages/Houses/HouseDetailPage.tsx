import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    LoadingState,
    EmptyState,
    ErrorState,
} from "@components/admin/DataStates";
import HouseholdPicker from "@components/admin/HouseholdPicker";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import HouseOwnershipPanel from "@components/admin/HouseOwnershipPanel";
import { useAuthStore, usePermission } from "@store/authStore";
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
    HOUSE_AUDIT_ACTION_LABEL,
    HOUSE_PHYSICAL_STATUS_LABEL,
    HOUSE_STATUS_LABEL,
    HOUSE_STATUS_TONE,
    HOUSE_USAGE_TYPE_LABEL,
} from "@constants/domain";
import {
    AppError,
    Business,
    Company,
    FileAsset,
    House,
    HouseStatus,
    Household,
    HouseUsageType,
    HouseUsageUnit,
} from "@dts";
import {
    deleteHouse,
    deleteHouseAttachment,
    fetchHouseAttachments,
    fetchHouseAuditLogs,
    fetchHouseBusinesses,
    fetchHouseById,
    fetchHouseCompanies,
    fetchHouseHouseholds,
    updateHouse,
    updateHouseStatus,
} from "@service/houseApi";
import { createHousehold, updateHousehold } from "@service/householdApi";
import { fetchOrganizationById } from "@service/organizationApi";
import { createBusiness } from "@service/businessApi";
import { createCompany } from "@service/companyApi";
import {
    createHouseUsageUnit,
    deleteHouseUsageUnit,
    fetchHouseUsageUnits,
} from "@service/houseUsageUnitApi";
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
import CompanyForm, {
    EMPTY_COMPANY_FORM,
    isCompanyFormValid,
    toCompanyInput,
} from "./CompanyForm";

const streetName = (streetId: House["streetId"]): string | null => {
    if (!streetId) return null;
    return typeof streetId === "string" ? null : streetId.name;
};

const neighborhoodName = (
    neighborhoodId: House["neighborhoodId"],
): string | null => {
    if (!neighborhoodId) return null;
    return typeof neighborhoodId === "string" ? null : neighborhoodId.name;
};

const toFormValues = (h: House): HouseFormValues => ({
    cluster: h.cluster,
    streetId:
        h.streetId && typeof h.streetId !== "string" ? h.streetId._id : "",
    neighborhoodId:
        h.neighborhoodId && typeof h.neighborhoodId !== "string"
            ? h.neighborhoodId._id
            : "",
    address: h.address,
    provinceCode: h.provinceCode ? String(h.provinceCode) : "",
    provinceName: h.provinceName || "",
    wardCode: h.wardCode ? String(h.wardCode) : "",
    wardName: h.wardName || "",
    physicalStatus: h.physicalStatus || "",
    usageTypes: h.usageTypes || [],
    otherUsageNote: h.otherUsageNote || "",
    note: h.note || "",
    // Khong the doi chu nha sau khi tao (xem HouseForm.tsx) - khong can dien lai.
    ownerKind: "none",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    createOwnerAccount: false,
    orgName: "",
    orgTaxCode: "",
    orgAddress: "",
    orgPhone: "",
    orgEmail: "",
    createRepresentativeAccount: false,
    repName: "",
    repPhone: "",
    repEmail: "",
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
    const canCreateCompany = usePermission("companies.create");
    const canCreateUsageUnit = usePermission("usage_units.create");
    const canDeleteUsageUnit = usePermission("usage_units.delete");
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
    const [statusDialogTarget, setStatusDialogTarget] =
        useState<HouseStatus | null>(null);
    const [statusNote, setStatusNote] = useState("");

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

    const [companies, setCompanies] = useState<Company[]>([]);
    const [companiesLoading, setCompaniesLoading] = useState(true);
    const [companySheetVisible, setCompanySheetVisible] = useState(false);
    const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
    const [submittingCompany, setSubmittingCompany] = useState(false);

    const [usageUnits, setUsageUnits] = useState<HouseUsageUnit[]>([]);
    const [usageUnitsLoading, setUsageUnitsLoading] = useState(true);
    const [addUnitVisible, setAddUnitVisible] = useState(false);
    const [unitLabel, setUnitLabel] = useState("");
    const [unitUsageType, setUnitUsageType] = useState<HouseUsageType>("household");
    const [unitOccupantId, setUnitOccupantId] = useState("");
    const [submittingUnit, setSubmittingUnit] = useState(false);
    const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

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

    const loadCompanies = () => {
        if (!houseId) return;
        setCompaniesLoading(true);
        fetchHouseCompanies(houseId)
            .then((res: any) => setCompanies(res.items || res))
            .catch(() => setCompanies([]))
            .finally(() => setCompaniesLoading(false));
    };

    const loadUsageUnits = () => {
        if (!houseId) return;
        setUsageUnitsLoading(true);
        fetchHouseUsageUnits(houseId)
            .then(setUsageUnits)
            .catch(() => setUsageUnits([]))
            .finally(() => setUsageUnitsLoading(false));
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
        loadCompanies();
        loadUsageUnits();
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
            toast.error("Vui lòng chọn đường/phố hoặc nhập cụm dân cư, và địa chỉ");
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

    const [isOwner, setIsOwner] = useState(false);
    useEffect(() => {
        if (!house?.ownerId) {
            setIsOwner(false);
            return;
        }
        const ownerId =
            typeof house.ownerId === "string" ? house.ownerId : house.ownerId._id;
        if (house.ownerType !== "organization") {
            setIsOwner(ownerId === currentUserId);
            return;
        }
        // Chu la to chuc - phai tra ve nguoi dai dien cua to chuc do de so
        // sanh, vi to chuc khong tu dang nhap duoc (xem resolveOwnerActingUserId
        // o backend). ownerId khong duoc backend populate san nen goi rieng.
        let cancelled = false;
        fetchOrganizationById(ownerId)
            .then(org => {
                if (cancelled) return;
                // To chuc duoc khai bao luc tao nha so co the chua co nguoi
                // dai dien nao dang nhap duoc (xem HouseForm.tsx).
                if (!org.representativeUserId) {
                    setIsOwner(false);
                    return;
                }
                const representativeId =
                    typeof org.representativeUserId === "string"
                        ? org.representativeUserId
                        : org.representativeUserId._id;
                setIsOwner(representativeId === currentUserId);
            })
            .catch(() => {
                if (!cancelled) setIsOwner(false);
            });
        // eslint-disable-next-line consistent-return
        return () => {
            cancelled = true;
        };
    }, [house?.ownerId, house?.ownerType, currentUserId]);

    const handleStatusChange = async (status: HouseStatus, note?: string) => {
        if (!houseId) return;
        try {
            setStatusUpdating(true);
            const updated = await updateHouseStatus(houseId, status, note);
            setHouse(updated);
            toast.success("Đã cập nhật trạng thái nhà số");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const openStatusDialog = (status: HouseStatus) => {
        setStatusNote("");
        setStatusDialogTarget(status);
    };

    const confirmStatusChange = async () => {
        if (!statusDialogTarget) return;
        if (statusDialogTarget === "denied" && !statusNote.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        if (statusDialogTarget === "needs_update" && !statusNote.trim()) {
            toast.error("Vui lòng nhập chi tiết cần cập nhật");
            return;
        }
        await handleStatusChange(statusDialogTarget, statusNote.trim() || undefined);
        setStatusDialogTarget(null);
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

    const openCreateCompany = () => {
        setCompanyForm(EMPTY_COMPANY_FORM);
        setCompanySheetVisible(true);
    };

    const handleSubmitCompany = async () => {
        if (!houseId || !isCompanyFormValid(companyForm)) {
            toast.error("Vui lòng nhập tên công ty");
            return;
        }
        try {
            setSubmittingCompany(true);
            await createCompany(toCompanyInput(companyForm, houseId));
            toast.success("Đã thêm công ty mới");
            setCompanySheetVisible(false);
            loadCompanies();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmittingCompany(false);
        }
    };

    // Cac householdId/businessId/companyId da duoc gan vao mot don vi su
    // dung khac - loai khoi danh sach chon o dialog "Thêm đơn vị" (moi doi
    // tuong chi duoc gan vao TOI DA mot don vi, xem houseUsageUnitService.ts).
    const linkedOccupantIds = (type: HouseUsageType): Set<string> => {
        const ids = usageUnits
            .filter(u => u.usageType === type)
            .map(u => {
                const ref =
                    type === "household"
                        ? u.householdId
                        : type === "business"
                          ? u.businessId
                          : u.companyId;
                if (!ref) return undefined;
                return typeof ref === "string" ? ref : ref._id;
            })
            .filter((id): id is string => !!id);
        return new Set(ids);
    };

    const availableOccupants = (): { _id: string; label: string }[] => {
        if (unitUsageType === "household") {
            const linked = linkedOccupantIds("household");
            return households
                .filter(h => !linked.has(h._id))
                .map(h => ({ _id: h._id, label: `${h.code} — ${h.headOfHousehold}` }));
        }
        if (unitUsageType === "business") {
            const linked = linkedOccupantIds("business");
            return businesses
                .filter(b => !linked.has(b._id))
                .map(b => ({ _id: b._id, label: b.name }));
        }
        const linked = linkedOccupantIds("company");
        return companies
            .filter(c => !linked.has(c._id))
            .map(c => ({ _id: c._id, label: c.name }));
    };

    const openAddUnit = () => {
        setUnitLabel("");
        setUnitUsageType("household");
        setUnitOccupantId("");
        setAddUnitVisible(true);
    };

    const handleCreateUnit = async () => {
        if (!houseId || !unitLabel.trim() || !unitOccupantId) {
            toast.error("Vui lòng nhập tên đơn vị và chọn đối tượng sử dụng");
            return;
        }
        try {
            setSubmittingUnit(true);
            await createHouseUsageUnit(houseId, {
                unitLabel: unitLabel.trim(),
                usageType: unitUsageType,
                householdId: unitUsageType === "household" ? unitOccupantId : undefined,
                businessId: unitUsageType === "business" ? unitOccupantId : undefined,
                companyId: unitUsageType === "company" ? unitOccupantId : undefined,
            });
            toast.success("Đã thêm đơn vị sử dụng");
            setAddUnitVisible(false);
            loadUsageUnits();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmittingUnit(false);
        }
    };

    const handleDeleteUnit = async (unitId: string) => {
        try {
            setDeletingUnitId(unitId);
            await deleteHouseUsageUnit(unitId);
            setUsageUnits(prev => prev.filter(u => u._id !== unitId));
            toast.success("Đã xóa đơn vị sử dụng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingUnitId(null);
        }
    };

    const unitOccupantLabel = (unit: HouseUsageUnit): string => {
        const ref =
            unit.usageType === "household"
                ? unit.householdId
                : unit.usageType === "business"
                  ? unit.businessId
                  : unit.companyId;
        if (!ref || typeof ref === "string") return "—";
        return unit.usageType === "household"
            ? `${(ref as Household).code} — ${(ref as Household).headOfHousehold}`
            : (ref as Business | Company).name;
    };

    const unitOccupantHref = (unit: HouseUsageUnit): string | null => {
        const ref =
            unit.usageType === "household"
                ? unit.householdId
                : unit.usageType === "business"
                  ? unit.businessId
                  : unit.companyId;
        if (!ref) return null;
        const id = typeof ref === "string" ? ref : ref._id;
        if (unit.usageType === "household") return `/houses/${houseId}/households/${id}`;
        if (unit.usageType === "business") return `/houses/${houseId}/businesses/${id}`;
        return `/houses/${houseId}/companies/${id}`;
    };

    // Phong ngua truong hop du lieu cu/chua kip dong bo khong co usageTypes
    // (vd nha tao truoc khi co tinh nang khai bao muc dich su dung) - tranh
    // crash trang trang khi goi .includes()/.map() tren undefined.
    const houseUsageTypes = house?.usageTypes || [];

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
                                <HouseForm
                                    values={form}
                                    onChange={setForm}
                                    mode="edit"
                                />
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
                                {house.provinceName && (
                                    <InfoRow
                                        label="Tỉnh/Thành phố"
                                        value={house.provinceName}
                                    />
                                )}
                                {house.wardName && (
                                    <InfoRow
                                        label="Phường/Xã"
                                        value={house.wardName}
                                    />
                                )}
                                <InfoRow label="Cụm dân cư" value={house.cluster} />
                                {streetName(house.streetId) && (
                                    <InfoRow
                                        label="Đường/phố"
                                        value={streetName(house.streetId)!}
                                    />
                                )}
                                {neighborhoodName(house.neighborhoodId) && (
                                    <InfoRow
                                        label="Tổ dân phố"
                                        value={neighborhoodName(house.neighborhoodId)!}
                                    />
                                )}
                                <InfoRow label="Địa chỉ" value={house.address} />
                                <InfoRow
                                    label="Tình trạng công trình"
                                    value={
                                        house.physicalStatus
                                            ? HOUSE_PHYSICAL_STATUS_LABEL[
                                                  house.physicalStatus
                                              ]
                                            : "Chưa cập nhật"
                                    }
                                />
                                <InfoRow
                                    label="Mục đích sử dụng"
                                    value={
                                        [
                                            ...houseUsageTypes.map(
                                                t => HOUSE_USAGE_TYPE_LABEL[t],
                                            ),
                                            ...(house.otherUsageNote
                                                ? [house.otherUsageNote]
                                                : []),
                                        ].join(", ") || "Chưa khai báo"
                                    }
                                />
                                <InfoRow
                                    label="Ghi chú"
                                    value={house.note || "Không có"}
                                />
                                {house.status === "verified" &&
                                    house.approvalNote && (
                                        <InfoRow
                                            label="Ghi chú duyệt"
                                            value={house.approvalNote}
                                        />
                                    )}
                                {house.status === "denied" &&
                                    house.denialReason && (
                                        <InfoRow
                                            label="Lý do từ chối"
                                            value={house.denialReason}
                                        />
                                    )}
                                {house.status === "needs_update" &&
                                    house.needsUpdateNote && (
                                        <InfoRow
                                            label="Cần cập nhật"
                                            value={house.needsUpdateNote}
                                        />
                                    )}

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
                                            house.status === "denied" ||
                                            house.status ===
                                                "needs_update") && (
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
                                                    openStatusDialog(
                                                        "verified",
                                                    )
                                                }
                                            >
                                                Duyệt
                                            </Button>
                                            <Button
                                                variant="outline"
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    openStatusDialog(
                                                        "needs_update",
                                                    )
                                                }
                                            >
                                                Yêu cầu cập nhật
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                loading={statusUpdating}
                                                onClick={() =>
                                                    openStatusDialog(
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

                    {houseId && (
                        <HouseOwnershipPanel
                            houseId={houseId}
                            canManage={canUpdate}
                        />
                    )}

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
                        {houseUsageTypes.includes("household") &&
                            !householdsLoading &&
                            households.length === 0 && (
                                <UsageWarningBanner text="Nhà đã khai báo có hộ dân sinh sống nhưng chưa khai báo hộ dân nào. Vui lòng bổ sung để việc xác thực được đầy đủ." />
                            )}
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
                                        <div className="flex items-center gap-2">
                                            {h.needsSupport && (
                                                <Badge tone="yellow">
                                                    Cần hỗ trợ
                                                </Badge>
                                            )}
                                            <Badge tone={VERIFICATION_STATUS_TONE[h.status]}>
                                                {VERIFICATION_STATUS_LABEL[h.status]}
                                            </Badge>
                                        </div>
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
                        {houseUsageTypes.includes("business") &&
                            !businessesLoading &&
                            businesses.length === 0 && (
                                <UsageWarningBanner text="Nhà đã khai báo có hộ kinh doanh nhưng chưa khai báo hộ kinh doanh nào. Vui lòng bổ sung để việc xác thực được đầy đủ." />
                            )}
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
                                            <Badge tone={VERIFICATION_STATUS_TONE[b.status]}>
                                                {VERIFICATION_STATUS_LABEL[b.status]}
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

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-base font-semibold">Công ty</h2>
                            {canCreateCompany && (
                                <Button size="sm" onClick={openCreateCompany}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm công ty
                                </Button>
                            )}
                        </div>
                        {houseUsageTypes.includes("company") &&
                            !companiesLoading &&
                            companies.length === 0 && (
                                <UsageWarningBanner text="Nhà đã khai báo có công ty nhưng chưa khai báo công ty nào. Vui lòng bổ sung để việc xác thực được đầy đủ." />
                            )}
                        {companiesLoading && <LoadingState />}
                        {!companiesLoading && companies.length === 0 && (
                            <EmptyState label="Chưa có công ty nào" />
                        )}
                        {!companiesLoading &&
                            companies.map(c => (
                                <button
                                    key={c._id}
                                    type="button"
                                    className="block w-full border-b border-divider_01 py-2 text-left last:border-0 hover:bg-ng_10"
                                    onClick={() =>
                                        navigate(
                                            `/houses/${houseId}/companies/${c._id}`,
                                        )
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">
                                            {c.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge tone={VERIFICATION_STATUS_TONE[c.status]}>
                                                {VERIFICATION_STATUS_LABEL[c.status]}
                                            </Badge>
                                            {!c.active && (
                                                <Badge tone="gray">
                                                    Ngừng hoạt động
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Đơn vị sử dụng
                            </h2>
                            {canCreateUsageUnit && (
                                <Button size="sm" onClick={openAddUnit}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm đơn vị
                                </Button>
                            )}
                        </div>
                        {usageUnitsLoading && <LoadingState />}
                        {!usageUnitsLoading && usageUnits.length === 0 && (
                            <EmptyState label="Nhà chưa được chia thành đơn vị sử dụng nào" />
                        )}
                        {!usageUnitsLoading &&
                            usageUnits.map(u => {
                                const href = unitOccupantHref(u);
                                return (
                                    <div
                                        key={u._id}
                                        className="flex items-center justify-between border-b border-divider_01 py-2 last:border-0"
                                    >
                                        <button
                                            type="button"
                                            className="flex-1 text-left hover:underline disabled:cursor-default disabled:no-underline"
                                            disabled={!href}
                                            onClick={() => href && navigate(href)}
                                        >
                                            <div className="text-sm font-medium">
                                                {u.unitLabel} —{" "}
                                                {unitOccupantLabel(u)}
                                            </div>
                                            <div className="text-xs text-text_2">
                                                {HOUSE_USAGE_TYPE_LABEL[u.usageType]}
                                            </div>
                                        </button>
                                        {canDeleteUsageUnit && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                loading={deletingUnitId === u._id}
                                                onClick={() =>
                                                    handleDeleteUnit(u._id)
                                                }
                                            >
                                                Gỡ
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
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

            <Dialog
                open={!!statusDialogTarget}
                onOpenChange={open => !open && setStatusDialogTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {statusDialogTarget === "denied"
                                ? "Từ chối nhà số"
                                : statusDialogTarget === "needs_update"
                                  ? "Yêu cầu cập nhật nhà số"
                                  : "Duyệt nhà số"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label className="text-sm text-text_2">
                            {statusDialogTarget === "denied"
                                ? "Lý do từ chối (bắt buộc)"
                                : statusDialogTarget === "needs_update"
                                  ? "Chi tiết cần cập nhật (bắt buộc)"
                                  : "Ghi chú duyệt (không bắt buộc)"}
                        </Label>
                        <Textarea
                            value={statusNote}
                            onChange={e => setStatusNote(e.target.value)}
                            placeholder={
                                statusDialogTarget === "denied"
                                    ? "VD: Thiếu giấy tờ, sai địa chỉ..."
                                    : statusDialogTarget === "needs_update"
                                      ? "VD: Bổ sung ảnh mặt tiền, cập nhật số điện thoại liên hệ..."
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
                            {statusDialogTarget === "denied"
                                ? "Từ chối"
                                : statusDialogTarget === "needs_update"
                                  ? "Gửi yêu cầu cập nhật"
                                  : "Duyệt"}
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

            <Sheet
                open={companySheetVisible}
                onOpenChange={setCompanySheetVisible}
            >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Thêm công ty</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <CompanyForm
                            values={companyForm}
                            onChange={setCompanyForm}
                        />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submittingCompany}
                            onClick={handleSubmitCompany}
                        >
                            Thêm công ty
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog open={addUnitVisible} onOpenChange={setAddUnitVisible}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thêm đơn vị sử dụng</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Tên đơn vị</Label>
                            <Input
                                placeholder="VD: Tầng 1, Phòng 101..."
                                value={unitLabel}
                                onChange={e => setUnitLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Loại sử dụng</Label>
                            <Select
                                value={unitUsageType}
                                onValueChange={v => {
                                    setUnitUsageType(v as HouseUsageType);
                                    setUnitOccupantId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(
                                            HOUSE_USAGE_TYPE_LABEL,
                                        ) as [HouseUsageType, string][]
                                    ).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Đối tượng sử dụng</Label>
                            <Select
                                value={unitOccupantId || undefined}
                                onValueChange={setUnitOccupantId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn đối tượng đã có trong nhà" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOccupants().map(o => (
                                        <SelectItem key={o._id} value={o._id}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availableOccupants().length === 0 && (
                                <p className="text-xs text-text_2">
                                    Không còn đối tượng nào chưa được gán đơn
                                    vị - hãy thêm hộ dân/hộ kinh doanh/công ty
                                    mới trước.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAddUnitVisible(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={submittingUnit}
                            onClick={handleCreateUnit}
                        >
                            Thêm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const UsageWarningBanner: React.FC<{ text: string }> = ({ text }) => (
    <div className="mb-2 rounded-lg border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        {text}
    </div>
);

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
