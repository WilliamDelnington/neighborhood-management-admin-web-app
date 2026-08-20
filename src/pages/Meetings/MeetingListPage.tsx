import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Meeting } from "@dts";
import { fetchMeetings } from "@service/meetingApi";

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    });
};

const MeetingListPage: React.FC = () => (
    <AdminGuard permissions={["meetings.read"]}>
        <MeetingListContent />
    </AdminGuard>
);

const MeetingListContent: React.FC = () => {
    const navigate = useNavigate();
    const canManage = usePermission("meetings.create");

    const [items, setItems] = useState<Meeting[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchMeetings(false, targetPage, size)
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => load(1), []);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Quản lý cuộc họp</h1>
                <div className="flex items-center gap-3">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, size);
                        }}
                    />
                    {canManage && (
                        <Button onClick={() => navigate("/meetings/create")}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm mới
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có cuộc họp nào được tạo" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên cuộc họp</TableHead>
                                <TableHead>Thời gian / Địa điểm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((m, index) => (
                                <TableRow
                                    key={m._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/meetings/${m._id}/edit`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {m.title}
                                    </TableCell>
                                    <TableCell>
                                        {formatDateTime(m.startTime)} ·{" "}
                                        {m.location}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={m.published ? "green" : "gray"}>
                                            {m.published ? "Đã đăng" : "Nháp"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={load}
                disabled={loading}
            />
        </div>
    );
};

export default MeetingListPage;
