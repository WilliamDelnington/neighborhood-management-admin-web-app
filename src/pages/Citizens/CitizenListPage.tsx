import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { usePermission } from "@store/authStore";
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, Citizen, Neighborhood } from "@dts";
import {
    createCitizen,
    deleteCitizen,
    fetchCitizens,
    updateCitizen,
} from "@service/citizenApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import CitizenForm, {
    EMPTY_CITIZEN_FORM,
    CitizenFormValues,
    isCitizenFormValid,
    toCitizenInput,
} from "./CitizenForm";
import CitizenImportSheet from "./CitizenImportSheet";

const ALL_NEIGHBORHOOD = "all";

const CitizenListPage: React.FC = () => (
    <AdminGuard permissions={["citizens.read"]}>
        <CitizenListContent />
    </AdminGuard>
);

const householdLabelOf = (householdId: Citizen["householdId"]): string => {
    if (!householdId) return "—";
    return typeof householdId === "string"
        ? householdId
        : `${householdId.code} — ${householdId.address}`;
};

const householdIdOf = (householdId: Citizen["householdId"]): string =>
    !householdId || typeof householdId === "string" ? "" : householdId._id;

const citizenToForm = (c: Citizen): CitizenFormValues => ({
    fullName: c.fullName,
    phone: c.phone || "",
    cccd: c.cccd || "",
    birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
    gender: c.gender,
    relationToHead: c.relationToHead || "",
    occupation: c.occupation || "",
    householdId: householdIdOf(c.householdId),
    householdLabel: householdLabelOf(c.householdId),
    residenceType: c.residenceType,
    temporaryResidenceStartsAt: c.temporaryResidenceStartsAt
        ? c.temporaryResidenceStartsAt.slice(0, 10)
        : "",
    temporaryResidenceExpiresAt: c.temporaryResidenceExpiresAt
        ? c.temporaryResidenceExpiresAt.slice(0, 10)
        : "",
    isResidencyDeclared: c.isResidencyDeclared,
    isUnemployed: c.isUnemployed,
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

const CitizenListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("citizens.create");
    const canUpdate = usePermission("citizens.update");
    const canDelete = usePermission("citizens.delete");
    // Rieng cho nut "Nhap tu Excel" - backend gate qua "imports.manage" (xem
    // /api/import/citizens), khac voi "citizens.create" - phai kiem tra rieng
    // giong HouseListPage.
    const canImport = usePermission("imports.manage");

    const [search, setSearch] = useState("");
    const [neighborhoodId, setNeighborhoodId] = useState("");
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [items, setItems] = useState<Citizen[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetVisible, setSheetVisible] = useState(false);
    const [editingCitizenId, setEditingCitizenId] = useState<string | null>(
        null,
    );
    const [form, setForm] = useState<CitizenFormValues>(EMPTY_CITIZEN_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [importVisible, setImportVisible] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchCitizens({
            page: targetPage,
            limit: size,
            search: keyword,
            neighborhoodId: neighborhoodId || undefined,
        })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, neighborhoodId]);

    useEffect(() => {
        fetchNeighborhoods({ limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, []);

    const openCreate = () => {
        setEditingCitizenId(null);
        setForm(EMPTY_CITIZEN_FORM);
        setSheetVisible(true);
    };

    const openEdit = (c: Citizen) => {
        if (!canUpdate) return;
        setEditingCitizenId(c._id);
        setForm(citizenToForm(c));
        setSheetVisible(true);
    };

    const handleSubmit = async () => {
        if (!isCitizenFormValid(form)) {
            toast.error("Vui lòng nhập họ tên và chọn hộ dân");
            return;
        }
        try {
            setSubmitting(true);
            if (editingCitizenId) {
                await updateCitizen(editingCitizenId, toCitizenInput(form));
                toast.success("Đã cập nhật nhân khẩu");
            } else {
                await createCitizen(toCitizenInput(form));
                toast.success("Đã thêm nhân khẩu mới");
            }
            setSheetVisible(false);
            load(page, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            setDeleting(true);
            await deleteCitizen(confirmDeleteId);
            toast.success("Đã xóa nhân khẩu");
            setConfirmDeleteId(null);
            setSheetVisible(false);
            load(page, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Nhân khẩu"
                description="Xem danh sách nhân khẩu thuộc các hộ dân trên địa bàn."
                action={
                    (canCreate || canImport) && (
                        <div className="flex gap-2">
                            {canImport && (
                                <Button
                                    variant="outline"
                                    onClick={() => setImportVisible(true)}
                                >
                                    <UploadCloud className="mr-1 h-4 w-4" />
                                    Nhập từ Excel
                                </Button>
                            )}
                            {canCreate && (
                                <Button onClick={openCreate}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm nhân khẩu
                                </Button>
                            )}
                        </div>
                    )
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, search, size);
                    }}
                />
                <Input
                    className="max-w-sm"
                    placeholder="Tìm theo họ tên, CCCD, SĐT, chủ hộ, mã hộ, địa chỉ..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Select
                    value={neighborhoodId || ALL_NEIGHBORHOOD}
                    onValueChange={v =>
                        setNeighborhoodId(v === ALL_NEIGHBORHOOD ? "" : v)
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Tất cả tổ dân phố" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_NEIGHBORHOOD}>
                            Tất cả tổ dân phố
                        </SelectItem>
                        {neighborhoods.map(n => (
                            <SelectItem key={n._id} value={n._id}>
                                {n.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có nhân khẩu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>SĐT</TableHead>
                                <TableHead>CCCD</TableHead>
                                <TableHead>Giới tính</TableHead>
                                <TableHead>Hộ dân</TableHead>
                                <TableHead>Quan hệ với chủ hộ</TableHead>
                                <TableHead>Loại cư trú</TableHead>
                                <TableHead className="text-right">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((c, index) => {
                                return (
                                    <TableRow
                                        key={c._id}
                                        className={canUpdate ? "cursor-pointer" : undefined}
                                        onClick={() => openEdit(c)}
                                    >
                                        <TableCell className="text-center text-text_2">
                                            {(page - 1) * pageSize + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {c.fullName}
                                        </TableCell>
                                        <TableCell>{c.phone || "—"}</TableCell>
                                        <TableCell>{c.cccd || "—"}</TableCell>
                                        <TableCell>
                                            {GIOI_TINH_LABEL[c.gender]}
                                        </TableCell>
                                        <TableCell>
                                            {householdLabelOf(c.householdId)}
                                        </TableCell>
                                        <TableCell>
                                            {c.relationToHead || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge tone={c.residenceType === "thuong_tru" ? "green" : "gray"}>
                                                {LOAI_CU_TRU_LABEL[c.residenceType]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell
                                            className="text-right"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    navigate(`/citizens/${c._id}`)
                                                }
                                            >
                                                Chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={p => load(p, search)}
                    disabled={loading}
                />
            )}

            <Sheet open={sheetVisible} onOpenChange={setSheetVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingCitizenId ? "Sửa nhân khẩu" : "Thêm nhân khẩu"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <CitizenForm
                            key={editingCitizenId || "new"}
                            values={form}
                            onChange={setForm}
                        />
                    </div>
                    <SheetFooter>
                        {canDelete && editingCitizenId && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() =>
                                    setConfirmDeleteId(editingCitizenId)
                                }
                            >
                                Xóa nhân khẩu
                            </Button>
                        )}
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            {editingCitizenId ? "Lưu thay đổi" : "Thêm nhân khẩu"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!confirmDeleteId}
                onOpenChange={open => !open && setConfirmDeleteId(null)}
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
                            onClick={() => setConfirmDeleteId(null)}
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

            <CitizenImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />
        </div>
    );
};

export default CitizenListPage;
