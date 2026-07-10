import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import { Complaint, NhomPhanAnh, TrangThaiPhanAnh } from "@dts";
import {
    NHOM_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import { fetchComplaints } from "@service/complaintApi";

const VIEW_ROLES = [
    "admin",
    "neighborhood_leader",
    "regional_police",
    "people_committee_official",
] as const;

const ALL_STATUS = "all";
const ALL_CATEGORY = "all";

const ComplaintListPage: React.FC = () => (
    <AdminGuard roles={[...VIEW_ROLES]}>
        <ComplaintListContent />
    </AdminGuard>
);

const ComplaintListContent: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [status, setStatus] = useState<TrangThaiPhanAnh | "">(
        (searchParams.get("status") as TrangThaiPhanAnh | null) || "",
    );
    const [category, setCategory] = useState<NhomPhanAnh | "">(
        (searchParams.get("category") as NhomPhanAnh | null) || "",
    );
    const [search, setSearch] = useState("");

    const [items, setItems] = useState<Complaint[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const load = (targetPage = 1) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchComplaints({
            page: targetPage,
            status: status || undefined,
            category: category || undefined,
            search: search || undefined,
        })
            .then(res => {
                setItems(prev =>
                    targetPage === 1 ? res.items : [...prev, ...res.items],
                );
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => {
                setLoading(false);
                setLoadingMore(false);
            });
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, category]);

    const handleStatusChange = (value: string) => {
        const next = (value === ALL_STATUS ? "" : value) as
            | TrangThaiPhanAnh
            | "";
        setStatus(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("status", next);
            } else {
                params.delete("status");
            }
            return params;
        });
    };

    const handleCategoryChange = (value: string) => {
        const next = (value === ALL_CATEGORY ? "" : value) as
            | NhomPhanAnh
            | "";
        setCategory(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("category", next);
            } else {
                params.delete("category");
            }
            return params;
        });
    };

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-lg font-semibold">Phản ánh kiến nghị</h1>
            </div>

            <Input
                className="mb-4 max-w-sm"
                placeholder="Tìm theo mã phản ánh, tiêu đề..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="mb-4 grid grid-cols-2 gap-3">
                <Select
                    value={status || ALL_STATUS}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_STATUS}>
                            Tất cả trạng thái
                        </SelectItem>
                        {(
                            Object.entries(TRANG_THAI_PHAN_ANH_LABEL) as [
                                TrangThaiPhanAnh,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={category || ALL_CATEGORY}
                    onValueChange={handleCategoryChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả nhóm" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_CATEGORY}>
                            Tất cả nhóm
                        </SelectItem>
                        {(
                            Object.entries(NHOM_PHAN_ANH_LABEL) as [
                                NhomPhanAnh,
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

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có phản ánh nào phù hợp" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã — Tiêu đề</TableHead>
                                <TableHead>Nhóm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(c => (
                                <TableRow
                                    key={c._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/complaints/${c._id}`)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {c.code} — {c.title}
                                    </TableCell>
                                    <TableCell>
                                        {NHOM_PHAN_ANH_LABEL[c.category]}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                TRANG_THAI_PHAN_ANH_TONE[
                                                    c.status
                                                ]
                                            }
                                        >
                                            {
                                                TRANG_THAI_PHAN_ANH_LABEL[
                                                    c.status
                                                ]
                                            }
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && page < totalPages && (
                <div className="mt-3">
                    <Button
                        variant="outline"
                        disabled={loadingMore}
                        onClick={() => load(page + 1)}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ComplaintListPage;
