import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { usePermission } from "@store/authStore";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    formatFullAddress,
    HOUSE_STATUS_LABEL,
    HOUSE_STATUS_TONE,
} from "@constants/domain";
import { House, HouseStatus, AppError } from "@dts";
import { createHouse, fetchHouses } from "@service/houseApi";
import HouseForm, {
    EMPTY_HOUSE_FORM,
    HouseFormValues,
    isHouseFormValid,
    toHouseInput,
} from "./HouseForm";

const HouseListPage: React.FC = () => (
    <AdminGuard permissions={["houses.read"]}>
        <HouseListContent />
    </AdminGuard>
);

const ALL_STATUSES = "all";

const HouseListContent: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const neighborhoodId = searchParams.get("neighborhoodId") || undefined;
    const canCreate = usePermission("houses.create");

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
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search, status), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, neighborhoodId]);

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
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Quản lý nhà số</h1>
                {canCreate && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm nhà số
                    </Button>
                )}
            </div>
            {neighborhoodId && (
                <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <span>Đang lọc Nhà số theo Tổ dân phố đã chọn</span>
                    <Button size="sm" variant="outline" onClick={() => navigate("/houses")}>
                        Bỏ lọc
                    </Button>
                </div>
            )}

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
        </div>
    );
};

export default HouseListPage;
