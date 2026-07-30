import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
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
import { BUSINESS_STATUS_LABEL, BUSINESS_STATUS_TONE } from "@constants/domain";
import { Business } from "@dts";
import { fetchBusinesses } from "@service/businessApi";

const BusinessListPage: React.FC = () => (
    <AdminGuard permissions={["businesses.read"]}>
        <BusinessListContent />
    </AdminGuard>
);

const houseIdOf = (b: Business): string =>
    typeof b.houseId === "string" ? b.houseId : b.houseId._id;

const houseLabelOf = (b: Business): string =>
    typeof b.houseId === "string" ? b.houseId : `${b.houseId.code} — ${b.houseId.address}`;

const BusinessListContent: React.FC = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Business[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, keyword = search) => {
        setLoading(true);
        setError(false);
        fetchBusinesses({ page: targetPage, search: keyword })
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

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Hộ kinh doanh</h1>
            </div>

            <Input
                className="mb-4 max-w-sm"
                placeholder="Tìm theo tên hộ kinh doanh..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có hộ kinh doanh nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên hộ kinh doanh</TableHead>
                                <TableHead>Nhà số</TableHead>
                                <TableHead>Cụm</TableHead>
                                <TableHead>Loại hình</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(b => (
                                <TableRow
                                    key={b._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/houses/${houseIdOf(b)}/businesses/${b._id}`,
                                        )
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {b.name}
                                    </TableCell>
                                    <TableCell>{houseLabelOf(b)}</TableCell>
                                    <TableCell>{b.cluster}</TableCell>
                                    <TableCell>
                                        {b.businessType?.name || "Chưa phân loại"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={BUSINESS_STATUS_TONE[b.status]}>
                                            {BUSINESS_STATUS_LABEL[b.status]}
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
        </div>
    );
};

export default BusinessListPage;
