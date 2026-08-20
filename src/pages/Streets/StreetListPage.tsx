import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, FileSpreadsheet } from "lucide-react";
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
import { AppError, Street } from "@dts";
import { createStreet, fetchStreets } from "@service/streetApi";
import StreetForm, {
    EMPTY_STREET_FORM,
    StreetFormValues,
    isStreetFormValid,
    toStreetInput,
} from "./StreetForm";
import StreetImportSheet from "./StreetImportSheet";

const ACTIVE_ALL = "all";

const StreetListPage: React.FC = () => (
    <AdminGuard permissions={["streets.read"]}>
        <StreetListContent />
    </AdminGuard>
);

const StreetListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("streets.manage");
    const canImport = usePermission("imports.manage");

    const [search, setSearch] = useState("");
    const [active, setActive] = useState<"" | "true" | "false">("");
    const [items, setItems] = useState<Street[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<StreetFormValues>(EMPTY_STREET_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [importVisible, setImportVisible] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchStreets({
            page: targetPage,
            search: keyword,
            limit: size,
            active: active === "" ? undefined : active === "true",
        })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
                setTotal(res.total);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, active]);

    const openCreate = () => {
        setForm(EMPTY_STREET_FORM);
        setCreateVisible(true);
    };

    const handleCreate = async () => {
        if (!isStreetFormValid(form, "create")) {
            toast.error("Vui lòng nhập đầy đủ tên và mã đường/phố");
            return;
        }
        try {
            setSubmitting(true);
            await createStreet(toStreetInput(form));
            toast.success("Đã thêm đường/phố mới");
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
                <h1 className="text-lg font-semibold">Đường / phố</h1>
                <div className="flex items-center gap-2">
                    {canImport && (
                        <Button
                            variant="outline"
                            onClick={() => setImportVisible(true)}
                        >
                            <FileSpreadsheet className="mr-1 h-4 w-4" />
                            Nhập từ Excel
                        </Button>
                    )}
                    {canCreate && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm đường/phố
                        </Button>
                    )}
                </div>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                        placeholder="Tìm theo tên hoặc mã đường/phố..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={active || ACTIVE_ALL}
                    onValueChange={v =>
                        setActive(v === ACTIVE_ALL ? "" : (v as "true" | "false"))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ACTIVE_ALL}>
                            Tất cả trạng thái
                        </SelectItem>
                        <SelectItem value="true">Đang hoạt động</SelectItem>
                        <SelectItem value="false">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">
                    {total} đường/phố
                </div>
            )}

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có đường/phố nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((s, index) => (
                                <TableRow
                                    key={s._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/streets/${s._id}`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {s.code}
                                    </TableCell>
                                    <TableCell>{s.name}</TableCell>
                                    <TableCell>
                                        <Badge tone={s.active ? "green" : "gray"}>
                                            {s.active
                                                ? "Đang hoạt động"
                                                : "Ngừng hoạt động"}
                                        </Badge>
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
                        <SheetTitle>Thêm đường/phố</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <StreetForm values={form} onChange={setForm} mode="create" />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleCreate}
                        >
                            Lưu đường/phố
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <StreetImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />
        </div>
    );
};

export default StreetListPage;
