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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { usePermission } from "@store/authStore";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, Neighborhood, NeighborhoodStatus, Street, User } from "@dts";
import { createNeighborhood, fetchNeighborhoods } from "@service/neighborhoodApi";
import { fetchStreets } from "@service/streetApi";
import { fetchUsers } from "@service/userApi";
import NeighborhoodForm, {
    EMPTY_NEIGHBORHOOD_FORM,
    NeighborhoodFormValues,
    isNeighborhoodFormValid,
    toNeighborhoodInput,
} from "./NeighborhoodForm";

const STATUS_ALL = "all";
const LEADER_ALL = "all";
const STREET_ALL = "all";

const STATUS_LABEL: Record<NeighborhoodStatus, string> = {
    ACTIVE: "Đang hoạt động",
    INACTIVE: "Ngừng hoạt động",
    MERGED: "Đã sáp nhập",
    CLOSED: "Đã giải thể",
};

const NeighborhoodListPage: React.FC = () => (
    <AdminGuard permissions={["neighborhoods.read"]}>
        <NeighborhoodListContent />
    </AdminGuard>
);

const NeighborhoodListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("neighborhoods.manage");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<NeighborhoodStatus | "">("");
    const [streetId, setStreetId] = useState("");
    const [leaderId, setLeaderId] = useState("");
    const [streets, setStreets] = useState<Street[]>([]);
    const [leaders, setLeaders] = useState<User[]>([]);
    const [items, setItems] = useState<Neighborhood[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<NeighborhoodFormValues>(
        EMPTY_NEIGHBORHOOD_FORM,
    );
    const [submitting, setSubmitting] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchNeighborhoods({
            page: targetPage,
            search: keyword,
            limit: size,
            status: status || undefined,
            streetId: streetId || undefined,
            filterLeaderUserId: leaderId || undefined,
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
    }, [search, status, streetId, leaderId]);

    useEffect(() => {
        fetchStreets({ active: true, limit: 200 })
            .then(result => setStreets(result.items))
            .catch(() => setStreets([]));
        fetchUsers(1, 200, undefined, "neighborhood_leader")
            .then(result => setLeaders(result.items))
            .catch(() => setLeaders([]));
    }, []);

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

            <div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                        placeholder="Tìm theo tên hoặc mã tổ dân phố..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={status || STATUS_ALL}
                    onValueChange={v => setStatus(v === STATUS_ALL ? "" : v as NeighborhoodStatus)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={STATUS_ALL}>
                            Tất cả trạng thái
                        </SelectItem>
                        <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                        <SelectItem value="MERGED">Đã sáp nhập</SelectItem>
                        <SelectItem value="CLOSED">Đã giải thể</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={streetId || STREET_ALL}
                    onValueChange={value => setStreetId(value === STREET_ALL ? "" : value)}
                >
                    <SelectTrigger><SelectValue placeholder="Tất cả tuyến đường" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={STREET_ALL}>Tất cả tuyến đường</SelectItem>
                        {streets.map(street => (
                            <SelectItem key={street._id} value={street._id}>{street.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={leaderId || LEADER_ALL}
                    onValueChange={value => setLeaderId(value === LEADER_ALL ? "" : value)}
                >
                    <SelectTrigger><SelectValue placeholder="Tất cả tổ trưởng" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={LEADER_ALL}>Tất cả tổ trưởng</SelectItem>
                        {leaders.map(leader => (
                            <SelectItem key={leader.id} value={leader.id}>{leader.displayName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">
                    {total} tổ dân phố
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
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
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Phường/Xã</TableHead>
                                <TableHead>Tuyến đường</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Tổ trưởng</TableHead>
                                <TableHead>Tổ phó</TableHead>
                                <TableHead>Nhiệm kỳ</TableHead>
                                <TableHead>Số nhà</TableHead>
                                <TableHead>Hồ sơ</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((n, index) => (
                                <TableRow
                                    key={n._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/neighborhoods/${n._id}`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {n.code}
                                    </TableCell>
                                    <TableCell>{n.name}</TableCell>
                                    <TableCell>
                                        {n.wardName || (
                                            <span className="text-text_2">
                                                Chưa gán
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="min-w-40">
                                        {n.streetIds?.map(street => street.name).join(", ") || "Chưa gán"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={n.status === "ACTIVE" ? "green" : "gray"}>
                                            {STATUS_LABEL[n.status]}
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
                                    <TableCell>
                                        {n.coleaders?.map(user => user.displayName).join(", ") || "Chưa có"}
                                    </TableCell>
                                    <TableCell>
                                        {n.currentTerm?.name || "Chưa có"}
                                        {n.termRemainingDays !== null &&
                                            n.termRemainingDays !== undefined &&
                                            n.termRemainingDays <= 30 && (
                                                <span className="block text-xs text-orange-500">
                                                    Còn {Math.max(0, n.termRemainingDays)} ngày
                                                </span>
                                            )}
                                    </TableCell>
                                    <TableCell>{n.houseCount}</TableCell>
                                    <TableCell>{n.attachmentCount || 0}</TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                navigate(`/neighborhoods/${n._id}`)
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
