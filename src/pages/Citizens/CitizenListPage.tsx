import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, Plus, UploadCloud } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
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
import FilterBar from "@components/admin/FilterBar";
import { useLockedNeighborhoodId, usePermission } from "@store/authStore";
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, Citizen, Neighborhood } from "@dts";
import {
    createCitizen,
    fetchAllCitizens,
    fetchCitizens,
} from "@service/citizenApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { exportFileTimestamp, exportRowsToExcel } from "@lib/exportExcel";
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

const CitizenListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("citizens.create");
    // Rieng cho nut "Nhap tu Excel" - backend gate qua "imports.manage" (xem
    // /api/import/citizens), khac voi "citizens.create" - phai kiem tra rieng
    // giong HouseListPage.
    const canImport = usePermission("imports.manage");
    // To truong/To pho khoa cung vao 1 to dan pho thi bo loc "Tổ dân phố" la
    // vo nghia (backend da tu loc theo dung to do) - xem ghi chu o
    // HouseListPage.tsx.
    const lockedNeighborhoodId = useLockedNeighborhoodId();

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
    const [form, setForm] = useState<CitizenFormValues>(EMPTY_CITIZEN_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [importVisible, setImportVisible] = useState(false);
    const [exporting, setExporting] = useState(false);

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
        setForm(EMPTY_CITIZEN_FORM);
        setSheetVisible(true);
    };

    const handleSubmit = async () => {
        if (!isCitizenFormValid(form)) {
            toast.error("Vui lòng nhập họ tên và chọn hộ dân");
            return;
        }
        try {
            setSubmitting(true);
            await createCitizen(toCitizenInput(form));
            toast.success("Đã thêm nhân khẩu mới");
            setSheetVisible(false);
            load(page, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    // Xuat TOAN BO nhan khau khop bo loc hien tai ra file .xlsx - xem ghi chu
    // tuong tu o HouseListPage.tsx.
    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const rows = await fetchAllCitizens({
                search: search || undefined,
                neighborhoodId: neighborhoodId || undefined,
            });
            if (rows.length === 0) {
                toast.error("Không có nhân khẩu nào khớp bộ lọc để xuất");
                return;
            }
            await exportRowsToExcel(
                rows,
                `nhan-khau_${exportFileTimestamp()}.xlsx`,
                "Nhân khẩu",
                [
                    { label: "Họ tên", width: 26, value: c => c.fullName },
                    { label: "SĐT", width: 14, value: c => c.phone || "" },
                    { label: "CCCD", width: 16, value: c => c.cccd || "" },
                    {
                        label: "Giới tính",
                        width: 10,
                        value: c => GIOI_TINH_LABEL[c.gender],
                    },
                    {
                        label: "Hộ dân",
                        width: 34,
                        value: c => householdLabelOf(c.householdId),
                    },
                    {
                        label: "Quan hệ với chủ hộ",
                        width: 18,
                        value: c => c.relationToHead || "",
                    },
                    {
                        label: "Loại cư trú",
                        width: 16,
                        value: c => LOAI_CU_TRU_LABEL[c.residenceType],
                    },
                ],
            );
            toast.success(`Đã xuất ${rows.length} nhân khẩu`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Nhân khẩu"
                description="Xem danh sách nhân khẩu thuộc các hộ dân trên địa bàn."
                action={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            loading={exporting}
                            onClick={handleExportExcel}
                        >
                            <Download className="mr-1 h-4 w-4" />
                            Xuất Excel
                        </Button>
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
                }
            />

            <FilterBar>
                <div className="flex items-center gap-2">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, search, size);
                        }}
                    />
                    <Input
                        className="flex-1"
                        placeholder="Tìm theo họ tên, CCCD, SĐT, chủ hộ, mã hộ, địa chỉ..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {!lockedNeighborhoodId && (
                    <Select
                        value={neighborhoodId || ALL_NEIGHBORHOOD}
                        onValueChange={v =>
                            setNeighborhoodId(v === ALL_NEIGHBORHOOD ? "" : v)
                        }
                    >
                        <SelectTrigger>
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
                )}
            </FilterBar>

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
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/citizens/${c._id}`)}
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
                            Thêm nhân khẩu
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <CitizenForm
                            values={form}
                            onChange={setForm}
                        />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            Thêm nhân khẩu
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <CitizenImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />
        </div>
    );
};

export default CitizenListPage;
