import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import FilterableSelect from "@components/admin/FilterableSelect";
import Pagination from "@components/admin/Pagination";
import PageHeader from "@components/admin/PageHeader";
import HouseMapPanel from "@components/admin/HouseMapPanel";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { usePermission } from "@store/authStore";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    formatFullAddress,
    HOUSE_STATUS_LABEL,
    HOUSE_STATUS_TONE,
} from "@constants/domain";
import { House, HouseStatus, Neighborhood, AppError } from "@dts";
import {
    BulkHouseActionResult,
    bulkAssignHouseNeighborhood,
    bulkUpdateHouseStatus,
    createHouse,
    fetchHouses,
} from "@service/houseApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import HouseForm, {
    EMPTY_HOUSE_FORM,
    HouseFormValues,
    isHouseFormValid,
    toHouseInput,
} from "./HouseForm";
import HouseImportSheet from "./HouseImportSheet";

const HouseListPage: React.FC = () => (
    <AdminGuard permissions={["houses.read"]}>
        <HouseListContent />
    </AdminGuard>
);

const ALL_STATUSES = "all";

/** Bao ket qua thao tac hang loat qua toast - thanh cong het thi 1 dong, co
 * loi thi liet ke ly do tung nha that bai (toi da 3 dong, con lai gom số
 * lượng) de khong tran toast qua dai. */
function reportBulkResult(result: BulkHouseActionResult, verb: string) {
    if (result.failed.length === 0) {
        toast.success(`Đã ${verb} ${result.succeededIds.length} nhà số`);
        return;
    }
    const shown = result.failed.slice(0, 3).map(f => f.message);
    const more = result.failed.length > 3 ? ` và ${result.failed.length - 3} lỗi khác` : "";
    toast.error(
        `${verb.charAt(0).toUpperCase()}${verb.slice(1)} thành công ${result.succeededIds.length}/${
            result.succeededIds.length + result.failed.length
        } nhà số. Lỗi: ${shown.join("; ")}${more}`,
    );
}

const HouseListContent: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const neighborhoodId = searchParams.get("neighborhoodId") || undefined;
    const canCreate = usePermission("houses.create");
    // Rieng cho nut "Nhap tu Excel" - backend gate qua "imports.manage" (xem
    // /api/import/houses), KHAC voi "houses.create" ma to truong cung co -
    // phai kiem tra rieng de khong hien nut cho vai tro se bi 403 khi bam.
    const canImport = usePermission("imports.manage");
    // Rieng cho cac thao tac hang loat - "Gán tổ dân phố" can houses.update,
    // "Duyệt đã chọn" can houses.verify (giong endpoint don le tuong ung).
    const canBulkAssignNeighborhood = usePermission("houses.update");
    const canBulkVerify = usePermission("houses.verify");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<HouseStatus | "">("");
    const [items, setItems] = useState<House[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<HouseFormValues>(EMPTY_HOUSE_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [importVisible, setImportVisible] = useState(false);

    // Chon nhieu dong de thao tac hang loat (vd gan to dan pho cho cac nha
    // nhap tu Excel con thieu, duyet nhanh cac nha dang cho duyet).
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [bulkNeighborhoodDialogOpen, setBulkNeighborhoodDialogOpen] =
        useState(false);
    const [bulkNeighborhoodId, setBulkNeighborhoodId] = useState("");
    const [bulkAssigning, setBulkAssigning] = useState(false);
    const [bulkVerifying, setBulkVerifying] = useState(false);

    const load = (
        targetPage = 1,
        keyword = search,
        statusFilter = status,
        size = pageSize,
    ) => {
        setLoading(true);
        setError(false);
        fetchHouses({
            page: targetPage,
            limit: size,
            search: keyword,
            status: statusFilter || undefined,
            neighborhoodId,
        })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
                setSelectedIds([]);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search, status), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, neighborhoodId]);

    useEffect(() => {
        if (!canBulkAssignNeighborhood) return;
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canBulkAssignNeighborhood]);

    const allOnPageSelected =
        items.length > 0 && items.every(h => selectedIds.includes(h._id));
    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? items.map(h => h._id) : []);
    };
    const toggleSelectOne = (id: string, checked: boolean) => {
        setSelectedIds(current =>
            checked ? [...current, id] : current.filter(item => item !== id),
        );
    };

    const handleBulkAssignNeighborhood = async () => {
        if (!bulkNeighborhoodId || selectedIds.length === 0) return;
        try {
            setBulkAssigning(true);
            const result = await bulkAssignHouseNeighborhood(
                selectedIds,
                bulkNeighborhoodId,
            );
            reportBulkResult(result, "gán tổ dân phố cho");
            setBulkNeighborhoodDialogOpen(false);
            setBulkNeighborhoodId("");
            load(page, search, status);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setBulkAssigning(false);
        }
    };

    const handleBulkVerify = async () => {
        if (selectedIds.length === 0) return;
        if (
            !window.confirm(
                `Duyệt ${selectedIds.length} nhà số đã chọn? Chỉ những nhà đang "Chờ duyệt" mới được xử lý.`,
            )
        ) {
            return;
        }
        try {
            setBulkVerifying(true);
            const result = await bulkUpdateHouseStatus(selectedIds, "verified");
            reportBulkResult(result, "duyệt");
            load(page, search, status);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setBulkVerifying(false);
        }
    };

    const openCreate = () => {
        setForm(EMPTY_HOUSE_FORM);
        setCreateVisible(true);
    };

    const handleCreate = async () => {
        if (!isHouseFormValid(form)) {
            toast.error(
                "Vui lòng chọn đường/phố hoặc nhập cụm dân cư, địa chỉ, và họ tên + số điện thoại chủ nhà (nếu có chọn)",
            );
            return;
        }
        try {
            setSubmitting(true);
            await createHouse(toHouseInput(form));
            toast.success("Đã thêm nhà số mới");
            setCreateVisible(false);
            load(1, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Quản lý nhà số"
                description="Quản lý thông tin nhà số, chủ nhà và trạng thái xác minh."
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
                                    Thêm nhà số
                                </Button>
                            )}
                        </div>
                    )
                }
            />
            {neighborhoodId && (
                <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <span>Đang lọc Nhà số theo Tổ dân phố đã chọn</span>
                    <Button size="sm" variant="outline" onClick={() => navigate("/houses")}>
                        Bỏ lọc
                    </Button>
                </div>
            )}

            <HouseMapPanel />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, search, status, size);
                    }}
                />
                <Input
                    className="max-w-sm"
                    placeholder="Tìm theo mã nhà, địa chỉ..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Select
                    value={status || ALL_STATUSES}
                    onValueChange={v =>
                        setStatus(v === ALL_STATUSES ? "" : (v as HouseStatus))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_STATUSES}>
                            Tất cả trạng thái
                        </SelectItem>
                        {(
                            Object.entries(HOUSE_STATUS_LABEL) as [
                                HouseStatus,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedIds.length > 0 && (canBulkAssignNeighborhood || canBulkVerify) && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-divider_01 bg-bg_2 px-3 py-2 text-sm">
                    <span className="font-medium">
                        Đã chọn {selectedIds.length} nhà số
                    </span>
                    {canBulkAssignNeighborhood && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBulkNeighborhoodDialogOpen(true)}
                        >
                            Gán tổ dân phố
                        </Button>
                    )}
                    {canBulkVerify && (
                        <Button
                            size="sm"
                            variant="outline"
                            loading={bulkVerifying}
                            onClick={handleBulkVerify}
                        >
                            Duyệt đã chọn
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                        onClick={() => setSelectedIds([])}
                    >
                        Bỏ chọn
                    </Button>
                </div>
            )}

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có nhà số nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {(canBulkAssignNeighborhood || canBulkVerify) && (
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={allOnPageSelected}
                                            onCheckedChange={checked =>
                                                toggleSelectAll(checked === true)
                                            }
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã nhà</TableHead>
                                <TableHead>Địa chỉ</TableHead>
                                <TableHead>Tổ dân phố</TableHead>
                                <TableHead>GIS</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((h, index) => (
                                <TableRow
                                    key={h._id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/houses/${h._id}`)}
                                >
                                    {(canBulkAssignNeighborhood || canBulkVerify) && (
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(h._id)}
                                                onCheckedChange={checked =>
                                                    toggleSelectOne(h._id, checked === true)
                                                }
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {h.code}
                                    </TableCell>
                                    <TableCell>{formatFullAddress(h)}</TableCell>
                                    <TableCell>
                                        {h.neighborhoodId &&
                                        typeof h.neighborhoodId !== "string"
                                            ? h.neighborhoodId.name
                                            : "Chưa gán"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                h.gisLatitude && h.gisLongitude
                                                    ? "green"
                                                    : "gray"
                                            }
                                        >
                                            {h.gisLatitude && h.gisLongitude
                                                ? "Đã gắn"
                                                : "Chưa có"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={HOUSE_STATUS_TONE[h.status]}>
                                            {HOUSE_STATUS_LABEL[h.status]}
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
                                                navigate(`/houses/${h._id}`)
                                            }
                                        >
                                            Chi tiết
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
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

            <Sheet open={createVisible} onOpenChange={setCreateVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Thêm nhà số</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <HouseForm values={form} onChange={setForm} />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleCreate}
                        >
                            Lưu nhà số
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <HouseImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />

            <Dialog
                open={bulkNeighborhoodDialogOpen}
                onOpenChange={open => {
                    setBulkNeighborhoodDialogOpen(open);
                    if (!open) setBulkNeighborhoodId("");
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Gán tổ dân phố cho {selectedIds.length} nhà số
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-text_2">
                        Nhà số đã xác thực sẽ không được gán qua đây (phải gửi
                        yêu cầu thay đổi thông tin) - kết quả sẽ báo rõ nhà nào
                        thành công/thất bại.
                    </p>
                    <FilterableSelect
                        label="Tổ dân phố"
                        placeholder="Chọn tổ dân phố..."
                        searchPlaceholder="Tìm theo tên tổ dân phố..."
                        items={neighborhoods}
                        getId={n => n._id}
                        getLabel={n => n.name}
                        value={bulkNeighborhoodId}
                        valueLabel={
                            neighborhoods.find(n => n._id === bulkNeighborhoodId)
                                ?.name
                        }
                        onChange={id => setBulkNeighborhoodId(id || "")}
                    />
                    <DialogFooter>
                        <Button
                            className="w-full"
                            disabled={!bulkNeighborhoodId}
                            loading={bulkAssigning}
                            onClick={handleBulkAssignNeighborhood}
                        >
                            Gán tổ dân phố
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HouseListPage;
