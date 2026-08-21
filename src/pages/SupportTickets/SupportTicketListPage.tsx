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
import { LoaiYeuCauHoTro, SupportTicket, TrangThaiYeuCauHoTro } from "@dts";
import {
    LOAI_YEU_CAU_HO_TRO_LABEL,
    TRANG_THAI_YEU_CAU_HO_TRO_LABEL,
    TRANG_THAI_YEU_CAU_HO_TRO_TONE,
} from "@constants/domain";
import { fetchSupportTickets } from "@service/supportTicketApi";

const ALL_STATUS = "all";
const ALL_TYPE = "all";

const SupportTicketListPage: React.FC = () => (
    <AdminGuard permissions={["support_tickets.read"]}>
        <SupportTicketListContent />
    </AdminGuard>
);

const SupportTicketListContent: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [status, setStatus] = useState<TrangThaiYeuCauHoTro | "">(
        (searchParams.get("status") as TrangThaiYeuCauHoTro | null) || "",
    );
    const [type, setType] = useState<LoaiYeuCauHoTro | "">(
        (searchParams.get("type") as LoaiYeuCauHoTro | null) || "",
    );
    const [search, setSearch] = useState("");

    const [items, setItems] = useState<SupportTicket[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchSupportTickets({
            page: targetPage,
            limit: size,
            status: status || undefined,
            type: type || undefined,
            search: search || undefined,
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
    }, [search, status, type]);

    const handleStatusChange = (value: string) => {
        const next = (value === ALL_STATUS ? "" : value) as
            | TrangThaiYeuCauHoTro
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

    const handleTypeChange = (value: string) => {
        const next = (value === ALL_TYPE ? "" : value) as LoaiYeuCauHoTro | "";
        setType(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("type", next);
            } else {
                params.delete("type");
            }
            return params;
        });
    };

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-lg font-semibold">Yêu cầu hỗ trợ</h1>
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
                    placeholder="Tìm theo mã yêu cầu, tiêu đề..."
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
                            Object.entries(TRANG_THAI_YEU_CAU_HO_TRO_LABEL) as [
                                TrangThaiYeuCauHoTro,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={type || ALL_TYPE} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả loại" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_TYPE}>Tất cả loại</SelectItem>
                        {(
                            Object.entries(LOAI_YEU_CAU_HO_TRO_LABEL) as [
                                LoaiYeuCauHoTro,
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
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có yêu cầu hỗ trợ nào phù hợp" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã — Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((t, index) => (
                                <TableRow
                                    key={t._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/support-tickets/${t._id}`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {t.code} — {t.title}
                                    </TableCell>
                                    <TableCell>
                                        {LOAI_YEU_CAU_HO_TRO_LABEL[t.type]}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                TRANG_THAI_YEU_CAU_HO_TRO_TONE[
                                                    t.status
                                                ]
                                            }
                                        >
                                            {
                                                TRANG_THAI_YEU_CAU_HO_TRO_LABEL[
                                                    t.status
                                                ]
                                            }
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
                                                navigate(`/support-tickets/${t._id}`)
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}
        </div>
    );
};

export default SupportTicketListPage;
