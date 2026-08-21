import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
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
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import AppointmentDetailSheet from "./AppointmentDetailSheet";
import { Appointment, AppointmentService, AppointmentStatus } from "@dts";
import {
    APPOINTMENT_STATUS_LABEL,
    APPOINTMENT_STATUS_TONE,
} from "@constants/domain";
import { fetchAppointments } from "@service/appointmentApi";
import { fetchAppointmentServices } from "@service/appointmentServiceApi";
import { DEFAULT_PAGE_SIZE } from "@constants/common";

const ALL = "all";

const serviceText = (serviceId: Appointment["serviceId"]) => {
    if (!serviceId) return "";
    if (typeof serviceId === "string") return serviceId;
    return serviceId.name;
};

const houseText = (houseId: Appointment["houseId"]) => {
    if (!houseId) return "";
    if (typeof houseId === "string") return houseId;
    return houseId.address ? `${houseId.code} — ${houseId.address}` : houseId.code;
};

const citizenText = (a: Appointment) => {
    if (a.citizenUserId) {
        return typeof a.citizenUserId === "string"
            ? a.citizenUserId
            : a.citizenUserId.displayName;
    }
    if (a.proxyName) {
        return `${a.proxyName}${a.proxyPhone ? ` (${a.proxyPhone})` : ""} — hẹn hộ`;
    }
    return "";
};

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const AppointmentListPage: React.FC = () => (
    <AdminGuard permissions={["appointments.read"]}>
        <AppointmentListContent />
    </AdminGuard>
);

const AppointmentListContent: React.FC = () => {
    const [status, setStatus] = useState<AppointmentStatus | "">("");
    const [serviceId, setServiceId] = useState("");
    const [date, setDate] = useState("");
    const [services, setServices] = useState<AppointmentService[]>([]);
    const [items, setItems] = useState<Appointment[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchAppointments({
            page: targetPage,
            limit: size,
            status: status || undefined,
            serviceId: serviceId || undefined,
            date: date || undefined,
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
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, serviceId, date]);

    useEffect(() => {
        fetchAppointmentServices()
            .then(setServices)
            .catch(() => setServices([]));
    }, []);

    return (
        <div>
            <PageHeader
                title="Lịch hẹn"
                description="Quản lý lịch hẹn làm việc của cư dân với tổ dân phố/phường."
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
                <Select
                    value={status || ALL}
                    onValueChange={v =>
                        setStatus(v === ALL ? "" : (v as AppointmentStatus))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
                        {(
                            Object.entries(APPOINTMENT_STATUS_LABEL) as [
                                AppointmentStatus,
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
                    value={serviceId || ALL}
                    onValueChange={v => setServiceId(v === ALL ? "" : v)}
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tất cả dịch vụ</SelectItem>
                        {services.map(s => (
                            <SelectItem key={s._id} value={s._id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    type="date"
                    className="max-w-xs"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có lịch hẹn nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã lịch hẹn</TableHead>
                                <TableHead>Dịch vụ</TableHead>
                                <TableHead>Người hẹn</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Ngày hẹn</TableHead>
                                <TableHead>Khung giờ</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((a, index) => (
                                <TableRow
                                    key={a._id}
                                    className="cursor-pointer"
                                    onClick={() => setDetailId(a._id)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {a.code}
                                    </TableCell>
                                    <TableCell>{serviceText(a.serviceId)}</TableCell>
                                    <TableCell>{citizenText(a)}</TableCell>
                                    <TableCell>{houseText(a.houseId)}</TableCell>
                                    <TableCell>{formatDate(a.appointedDate)}</TableCell>
                                    <TableCell>
                                        {a.startTime} - {a.endTime}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={APPOINTMENT_STATUS_TONE[a.status]}>
                                            {APPOINTMENT_STATUS_LABEL[a.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <Link
                                            to={`/appointments/${a._id}/history`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Lịch sử
                                        </Link>
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

            <AppointmentDetailSheet
                appointmentId={detailId}
                onOpenChange={open => !open && setDetailId(null)}
                onUpdated={() => load(page)}
            />
        </div>
    );
};

export default AppointmentListPage;
