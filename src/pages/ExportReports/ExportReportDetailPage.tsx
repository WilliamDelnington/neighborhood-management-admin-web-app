import React, { useEffect, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
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
import { EmptyState, ErrorState, LoadingState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { GIOI_TINH_LABEL } from "@constants/domain";
import { Citizen, Neighborhood } from "@dts";
import { fetchAllCitizens } from "@service/citizenApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { downloadExcel } from "./exportExcel";
import {
    ALL_REPORT_PERMISSIONS,
    fileNameFor,
    householdLabelOf,
    REPORT_ITEMS,
} from "./reportItems";

const ALL_NEIGHBORHOOD = "all";

const initialsOf = (fullName: string) =>
    fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");

const ExportReportDetailPage: React.FC = () => {
    const { key } = useParams<{ key: string }>();
    const item = REPORT_ITEMS.find(i => i.key === key);
    // Chi mot danh sach chua biet (:key la gia) moi fallback ve toan bo quyen
    // - khi biet dung danh sach nao thi chi doi hoi DUNG quyen cua danh sach
    // do, khong phai bat ky quyen export nao khac.
    return (
        <AdminGuard
            permissions={item ? [item.permission] : ALL_REPORT_PERMISSIONS}
        >
            <ExportReportDetailContent />
        </AdminGuard>
    );
};

const ExportReportDetailContent: React.FC = () => {
    const { key } = useParams<{ key: string }>();
    const navigate = useNavigate();
    const item = REPORT_ITEMS.find(i => i.key === key);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [rows, setRows] = useState<Citizen[]>([]);
    const [exporting, setExporting] = useState(false);
    const [neighborhoodId, setNeighborhoodId] = useState("");
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const load = () => {
        const filter = item?.filter;
        if (!filter) return;
        setLoading(true);
        setError(false);
        fetchAllCitizens({ neighborhoodId: neighborhoodId || undefined })
            .then(citizens => setRows(citizens.filter(filter)))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, neighborhoodId]);

    useEffect(() => {
        fetchNeighborhoods({ limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, []);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

    const handleExport = async () => {
        if (!item) return;
        try {
            setExporting(true);
            await downloadExcel(rows, fileNameFor(item.label), item.label);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Không thể xuất danh sách",
            );
        } finally {
            setExporting(false);
        }
    };

    const BackButton = (
        <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => navigate("/export-reports")}
        >
            <ArrowLeft className="h-4 w-4" />
        </Button>
    );

    if (!item || !item.filter) {
        return (
            <div>
                <div className="mb-4 flex items-center gap-3">
                    {BackButton}
                    <h1 className="text-lg font-semibold">Xuất báo cáo</h1>
                </div>
                <EmptyState label="Danh sách này chưa được hỗ trợ" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-divider_01 bg-ui_bg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    {BackButton}
                    <div>
                        <h1 className="text-lg font-semibold">{item.label}</h1>
                        <div className="mt-1 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-text_2" />
                            <Badge tone="blue" className="px-2">
                                {loading ? "…" : rows.length} người
                            </Badge>
                        </div>
                    </div>
                </div>
                <Button
                    variant="default"
                    loading={exporting}
                    disabled={loading || error || rows.length === 0}
                    onClick={() => void handleExport()}
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    Xuất Excel
                </Button>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Select
                    value={neighborhoodId || ALL_NEIGHBORHOOD}
                    onValueChange={v =>
                        setNeighborhoodId(v === ALL_NEIGHBORHOOD ? "" : v)
                    }
                >
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Tất cả tổ dân phố" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_NEIGHBORHOOD}>
                            Tất cả tổ dân phố
                        </SelectItem>
                        {neighborhoods.map(n => (
                            <SelectItem key={n._id} value={n._id}>
                                {n.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && rows.length === 0 && (
                    <EmptyState label="Không có dữ liệu phù hợp" />
                )}
                {!loading && !error && rows.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    STT
                                </TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Giới tính</TableHead>
                                <TableHead>Ngày sinh</TableHead>
                                <TableHead>CCCD</TableHead>
                                <TableHead>Thuộc hộ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pagedRows.map((c, index) => (
                                <TableRow key={c._id}>
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-main to-primary-dark text-[11px] font-semibold text-white">
                                                {initialsOf(c.fullName)}
                                            </span>
                                            <span className="font-medium">
                                                {c.fullName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{GIOI_TINH_LABEL[c.gender]}</TableCell>
                                    <TableCell>
                                        {c.birthDate
                                            ? new Date(c.birthDate).toLocaleDateString(
                                                  "vi-VN",
                                              )
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                        {c.cccd || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {householdLabelOf(c.householdId) || "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && rows.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
};

export default ExportReportDetailPage;
