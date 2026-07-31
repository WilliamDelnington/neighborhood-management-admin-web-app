import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { usePermission } from "@store/authStore";
import { AppError, Neighborhood } from "@dts";
import { createNeighborhood, fetchNeighborhoods } from "@service/neighborhoodApi";
import NeighborhoodForm, {
    EMPTY_NEIGHBORHOOD_FORM,
    NeighborhoodFormValues,
    isNeighborhoodFormValid,
    toNeighborhoodInput,
} from "./NeighborhoodForm";

const ACTIVE_ALL = "all";

const NeighborhoodListPage: React.FC = () => (
    <AdminGuard permissions={["neighborhoods.read"]}>
        <NeighborhoodListContent />
    </AdminGuard>
);

const NeighborhoodListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("neighborhoods.manage");

    const [search, setSearch] = useState("");
    const [active, setActive] = useState<"" | "true" | "false">("");
    const [items, setItems] = useState<Neighborhood[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<NeighborhoodFormValues>(
        EMPTY_NEIGHBORHOOD_FORM,
    );
    const [submitting, setSubmitting] = useState(false);

    const load = (targetPage = 1, keyword = search) => {
        setLoading(true);
        setError(false);
        fetchNeighborhoods({
            page: targetPage,
            search: keyword,
            limit: 30,
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
        setForm(EMPTY_NEIGHBORHOOD_FORM);
        setCreateVisible(true);
    };

    const handleCreate = async () => {
        if (!isNeighborhoodFormValid(form, "create")) {
            toast.error("Vui lòng nhập đầy đủ tên, mã và số thứ tự hợp lệ");
            return;
        }
        try {
            setSubmitting(true);
            await createNeighborhood(toNeighborhoodInput(form));
            toast.success("Đã thêm tổ dân phố mới");
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
                <h1 className="text-lg font-semibold">Tổ dân phố</h1>
                {canCreate && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm tổ dân phố
                    </Button>
                )}
            </div>

            <div className="mb-3 grid max-w-xl grid-cols-2 gap-3">
                <Input
                    placeholder="Tìm theo tên hoặc mã tổ dân phố..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
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
                    {total} tổ dân phố
                </div>
            )}

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có tổ dân phố nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Tổ trưởng</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(n => (
                                <TableRow
                                    key={n._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/neighborhoods/${n._id}`)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {n.code}
                                    </TableCell>
                                    <TableCell>{n.name}</TableCell>
                                    <TableCell>
                                        <Badge tone={n.active ? "green" : "gray"}>
                                            {n.active
                                                ? "Đang hoạt động"
                                                : "Ngừng hoạt động"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {n.leaderUserId
                                            ? n.leaderUserId.displayName
                                            : (
                                                <span className="text-text_2">
                                                    Chưa có tổ trưởng
                                                </span>
                                            )}
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
                        <SheetTitle>Thêm tổ dân phố</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <NeighborhoodForm
                            values={form}
                            onChange={setForm}
                            mode="create"
                        />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleCreate}
                        >
                            Lưu tổ dân phố
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default NeighborhoodListPage;
