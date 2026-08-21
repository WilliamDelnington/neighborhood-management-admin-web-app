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
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Complaint, ComplaintTypeDefinition, NhomPhanAnh, TrangThaiPhanAnh } from "@dts";
import {
    NHOM_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import { fetchComplaints } from "@service/complaintApi";
import { fetchComplaintTypeDefinitions } from "@service/complaintTypeApi";
import { useAuthStore } from "@store/authStore";

const ALL_STATUS = "all";
const ALL_CATEGORY = "all";
const BOOTSTRAP_NHOM_PHAN_ANH = Object.keys(NHOM_PHAN_ANH_LABEL) as NhomPhanAnh[];

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const ComplaintListPage: React.FC = () => (
    <AdminGuard permissions={["complaints.read"]}>
        <ComplaintListContent />
    </AdminGuard>
);

const ComplaintListContent: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const allowedCategories = useAuthStore(
        state => state.user?.allowedComplaintCategories,
    );

    // Danh sach day du (ke ca da ngung dung) - dung de hien nhan cho cac
    // phan anh cu, tranh hien key tho/trong neu loai da bi ngung dung sau khi
    // phan anh duoc tao.
    const [complaintTypes, setComplaintTypes] = useState<
        ComplaintTypeDefinition[]
    >([]);
    useEffect(() => {
        fetchComplaintTypeDefinitions({ limit: 200 })
            .then(res => setComplaintTypes(res.items))
            .catch(() => {
                /* giu fallback tinh (NHOM_PHAN_ANH_LABEL) neu goi API loi */
            });
    }, []);

    const labelByCategory = (key: NhomPhanAnh) =>
        complaintTypes.find(t => t.key === key)?.name ||
        NHOM_PHAN_ANH_LABEL[key] ||
        key;

    const activeCategoryOptions = complaintTypes.length
        ? complaintTypes
              .filter(t => t.active !== false)
              .map(t => t.key)
        : BOOTSTRAP_NHOM_PHAN_ANH;
    const visibleCategories = allowedCategories ?? activeCategoryOptions;

    const [status, setStatus] = useState<TrangThaiPhanAnh | "">(
        (searchParams.get("status") as TrangThaiPhanAnh | null) || "",
    );
    const [category, setCategory] = useState<NhomPhanAnh | "">(
        (searchParams.get("category") as NhomPhanAnh | null) || "",
    );
    const [search, setSearch] = useState("");
    const relatedAssetId = searchParams.get("relatedAssetId") || undefined;

    const [items, setItems] = useState<Complaint[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchComplaints({
            page: targetPage,
            limit: size,
            status: status || undefined,
            category: category || undefined,
            search: search || undefined,
            relatedAssetId,
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

            <div className="mb-4 flex items-center gap-2">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
                <Input
                    className="max-w-sm flex-1"
                    placeholder="Tìm theo mã phản ánh, tiêu đề..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

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
                        {visibleCategories.map(key => (
                            <SelectItem key={key} value={key}>
                                {labelByCategory(key)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có phản ánh nào phù hợp" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã — Tiêu đề</TableHead>
                                <TableHead>Thời gian gửi</TableHead>
                                <TableHead>Nhóm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((c, index) => (
                                <TableRow
                                    key={c._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/complaints/${c._id}`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {c.code} — {c.title}
                                    </TableCell>
                                    <TableCell className="text-text_2">
                                        {formatDateTime(c.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        {labelByCategory(c.category)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5">
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
                                            {!c.neighborhoodId && (
                                                <Badge tone="red">
                                                    Chưa xác định tổ dân phố
                                                </Badge>
                                            )}
                                        </div>
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}
        </div>
    );
};

export default ComplaintListPage;
