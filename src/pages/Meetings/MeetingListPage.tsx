import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
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
    <AdminGuard roles={["admin", "secretary", "neighborhood_leader"]}>
        <MeetingListContent />
    </AdminGuard>
);

const MeetingListContent: React.FC = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchMeetings(false)
            .then(res => setItems(res.items))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Quản lý cuộc họp</h1>
                <Button onClick={() => navigate("/meetings/create")}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm mới
                </Button>
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có cuộc họp nào được tạo" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên cuộc họp</TableHead>
                                <TableHead>Thời gian / Địa điểm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(m => (
                                <TableRow
                                    key={m._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/meetings/${m._id}/edit`)
                                    }
                                >
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
        </div>
    );
};

export default MeetingListPage;
