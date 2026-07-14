import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { Household, AppError } from "@dts";
import { createHousehold, fetchHouseholds } from "@service/householdApi";
import HouseholdForm, {
    EMPTY_HOUSEHOLD_FORM,
    HouseholdFormValues,
    isHouseholdFormValid,
    toHouseholdInput,
} from "./HouseholdForm";

const HouseholdListPage: React.FC = () => (
    <AdminGuard permissions={["households.read"]}>
        <HouseholdListContent />
    </AdminGuard>
);

const HouseholdListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("households.create");

    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Household[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<HouseholdFormValues>(EMPTY_HOUSEHOLD_FORM);
    const [submitting, setSubmitting] = useState(false);

    const load = (targetPage = 1, keyword = search) => {
        setLoading(true);
        setError(false);
        fetchHouseholds({ page: targetPage, search: keyword })
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
    }, [search]);

    const openCreate = () => {
        setForm(EMPTY_HOUSEHOLD_FORM);
        setCreateVisible(true);
    };

    const handleCreate = async () => {
        if (!isHouseholdFormValid(form)) {
            toast.error("Vui lòng nhập đầy đủ cụm dân cư, địa chỉ, chủ hộ");
            return;
        }
        try {
            setSubmitting(true);
            await createHousehold(toHouseholdInput(form));
            toast.success("Đã thêm hộ dân mới");
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
                <h1 className="text-lg font-semibold">Quản lý hộ dân</h1>
                {canCreate && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm hộ dân
                    </Button>
                )}
            </div>

            <Input
                className="mb-4 max-w-sm"
                placeholder="Tìm theo mã hộ, chủ hộ, địa chỉ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có hộ dân nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã hộ</TableHead>
                                <TableHead>Chủ hộ</TableHead>
                                <TableHead>Địa chỉ</TableHead>
                                <TableHead>Tổ dân phố</TableHead>
                                <TableHead>Nhân khẩu</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(h => (
                                <TableRow
                                    key={h._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/households/${h._id}`)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {h.code}
                                    </TableCell>
                                    <TableCell>{h.headOfHousehold}</TableCell>
                                    <TableCell>{h.address}</TableCell>
                                    <TableCell>{h.cluster}</TableCell>
                                    <TableCell>{h.memberCount}</TableCell>
                                    <TableCell>
                                        {h.needsSupport && (
                                            <Badge tone="yellow">
                                                Cần hỗ trợ
                                            </Badge>
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
                        <SheetTitle>Thêm hộ dân</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <HouseholdForm values={form} onChange={setForm} />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleCreate}
                        >
                            Lưu hộ dân
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default HouseholdListPage;
