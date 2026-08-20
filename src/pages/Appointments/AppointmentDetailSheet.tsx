import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@components/ui/sheet";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import { usePermission } from "@store/authStore";
import {
    APPOINTMENT_STATUS_LABEL,
    APPOINTMENT_STATUS_TONE,
} from "@constants/domain";
import { Appointment, AppError, FileAsset } from "@dts";
import {
    cancelAppointment,
    checkInAppointment,
    completeAppointment,
    confirmAppointment,
    fetchAppointmentAttachments,
    fetchAppointmentById,
    rejectAppointment,
} from "@service/appointmentApi";

export interface AppointmentDetailSheetProps {
    appointmentId: string | null;
    onOpenChange: (open: boolean) => void;
    onUpdated?: () => void;
}

const serviceText = (serviceId: Appointment["serviceId"]) => {
    if (!serviceId) return "";
    return typeof serviceId === "string" ? serviceId : serviceId.name;
};

const houseText = (houseId: Appointment["houseId"]) => {
    if (!houseId) return "";
    if (typeof houseId === "string") return houseId;
    return houseId.address ? `${houseId.code} — ${houseId.address}` : houseId.code;
};

const citizenText = (a: Appointment) => {
    if (a.citizenUserId) {
        const c = a.citizenUserId;
        return typeof c === "string"
            ? c
            : `${c.displayName}${c.phone ? ` (${c.phone})` : ""}`;
    }
    if (a.proxyName) {
        return `${a.proxyName}${a.proxyPhone ? ` (${a.proxyPhone})` : ""} — người thân đặt hộ`;
    }
    return "Không rõ";
};

const bookedByText = (bookedByUserId: Appointment["bookedByUserId"]) => {
    if (!bookedByUserId) return "";
    return typeof bookedByUserId === "string"
        ? bookedByUserId
        : bookedByUserId.displayName;
};

const officerText = (officerUserId: Appointment["officerUserId"]) => {
    if (!officerUserId) return "Chưa có";
    return typeof officerUserId === "string"
        ? officerUserId
        : officerUserId.displayName;
};

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";
const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const CANCELLABLE_STATUSES = new Set(["cho_xac_nhan", "da_xac_nhan"]);

const AppointmentDetailSheet: React.FC<AppointmentDetailSheetProps> = ({
    appointmentId,
    onOpenChange,
    onUpdated,
}) => {
    // "appointments.manage" gate xac nhan/tu choi/huy (nhan vien quan ly
    // chung); "appointments.checkin" gate check-in/hoan thanh (backend con
    // kiem tra rieng actor co trong assignedOfficerUserIds cua dich vu do
    // khong - xem ghi chu tai plan muc 2).
    const canManage = usePermission("appointments.manage");
    const canCheckin = usePermission("appointments.checkin");

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(false);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);

    const [confirming, setConfirming] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const load = (id: string) => {
        setLoading(true);
        fetchAppointmentById(id)
            .then(setAppointment)
            .catch(() => setAppointment(null))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchAppointmentAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    useEffect(() => {
        if (!appointmentId) return;
        load(appointmentId);
    }, [appointmentId]);

    const handleConfirm = async () => {
        if (!appointmentId) return;
        try {
            setConfirming(true);
            const updated = await confirmAppointment(appointmentId);
            setAppointment(updated);
            toast.success("Đã xác nhận lịch hẹn");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setConfirming(false);
        }
    };

    const handleReject = async () => {
        if (!appointmentId) return;
        if (!rejectReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        try {
            setRejecting(true);
            const updated = await rejectAppointment(
                appointmentId,
                rejectReason.trim(),
            );
            setAppointment(updated);
            setRejectDialogOpen(false);
            setRejectReason("");
            toast.success("Đã từ chối lịch hẹn");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRejecting(false);
        }
    };

    const handleCheckIn = async () => {
        if (!appointmentId) return;
        try {
            setCheckingIn(true);
            const updated = await checkInAppointment(appointmentId);
            setAppointment(updated);
            toast.success("Đã check-in lịch hẹn");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCheckingIn(false);
        }
    };

    const handleComplete = async () => {
        if (!appointmentId) return;
        try {
            setCompleting(true);
            const updated = await completeAppointment(appointmentId);
            setAppointment(updated);
            toast.success("Đã hoàn thành lịch hẹn");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCompleting(false);
        }
    };

    const handleCancel = async () => {
        if (!appointmentId) return;
        try {
            setCancelling(true);
            const updated = await cancelAppointment(
                appointmentId,
                cancelReason.trim() || undefined,
            );
            setAppointment(updated);
            setCancelDialogOpen(false);
            setCancelReason("");
            toast.success("Đã hủy lịch hẹn");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCancelling(false);
        }
    };

    return (
        <Sheet open={!!appointmentId} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Chi tiết lịch hẹn</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-5 overflow-y-auto py-4">
                    {loading && <LoadingState />}
                    {!loading && !appointment && (
                        <EmptyState label="Không tìm thấy lịch hẹn" />
                    )}
                    {!loading && appointment && (
                        <>
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <h2 className="text-base font-semibold">
                                        {appointment.code}
                                    </h2>
                                    <Badge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                                        {APPOINTMENT_STATUS_LABEL[appointment.status]}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium">
                                    {serviceText(appointment.serviceId)}
                                </div>
                                <div className="mt-2 text-sm text-text_2">
                                    <div>Người hẹn: {citizenText(appointment)}</div>
                                    <div>Nhà liên quan: {houseText(appointment.houseId)}</div>
                                    <div>
                                        Ngày hẹn: {formatDate(appointment.appointedDate)} ·{" "}
                                        {appointment.startTime} - {appointment.endTime}
                                    </div>
                                    <div>
                                        Người đặt lịch: {bookedByText(appointment.bookedByUserId)}
                                    </div>
                                    <div>
                                        Cán bộ phụ trách: {officerText(appointment.officerUserId)}
                                    </div>
                                    {appointment.checkinTime && (
                                        <div>
                                            Thời điểm check-in:{" "}
                                            {formatDateTime(appointment.checkinTime)}
                                        </div>
                                    )}
                                    {appointment.completedTime && (
                                        <div>
                                            Thời điểm hoàn thành:{" "}
                                            {formatDateTime(appointment.completedTime)}
                                        </div>
                                    )}
                                </div>
                                {appointment.note && (
                                    <p className="mt-2 text-sm">
                                        Ghi chú: {appointment.note}
                                    </p>
                                )}
                                {appointment.rejectReason && (
                                    <p className="mt-2 text-sm text-red-600">
                                        Lý do từ chối: {appointment.rejectReason}
                                    </p>
                                )}
                                {appointment.cancelReason && (
                                    <p className="mt-2 text-sm text-red-600">
                                        Lý do hủy: {appointment.cancelReason}
                                    </p>
                                )}
                                {appointment.rating !== undefined && (
                                    <p className="mt-2 text-sm">
                                        Đánh giá của người dân:{" "}
                                        {"★".repeat(appointment.rating)}
                                        {"☆".repeat(5 - appointment.rating)}
                                        {appointment.ratingNote
                                            ? ` — ${appointment.ratingNote}`
                                            : ""}
                                    </p>
                                )}
                                <Link
                                    to={`/appointments/${appointment._id}/history`}
                                    className="mt-2 inline-block text-sm text-primary hover:underline"
                                >
                                    Xem lịch sử chỉnh sửa
                                </Link>
                            </div>

                            <AttachmentsPanel
                                className="rounded-lg border border-divider_01 p-3"
                                attachments={attachments}
                                loading={attachmentsLoading}
                                canManage={false}
                            />

                            <div className="flex flex-wrap gap-2 border-t border-divider_01 pt-4">
                                {canManage && appointment.status === "cho_xac_nhan" && (
                                    <>
                                        <Button loading={confirming} onClick={handleConfirm}>
                                            Xác nhận
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="!text-red-500"
                                            onClick={() => setRejectDialogOpen(true)}
                                        >
                                            Từ chối
                                        </Button>
                                    </>
                                )}
                                {canCheckin && appointment.status === "da_xac_nhan" && (
                                    <Button loading={checkingIn} onClick={handleCheckIn}>
                                        Check-in
                                    </Button>
                                )}
                                {canCheckin && appointment.status === "da_check_in" && (
                                    <Button loading={completing} onClick={handleComplete}>
                                        Hoàn thành
                                    </Button>
                                )}
                                {canManage &&
                                    CANCELLABLE_STATUSES.has(appointment.status) && (
                                        <Button
                                            variant="outline"
                                            className="!text-red-500"
                                            onClick={() => setCancelDialogOpen(true)}
                                        >
                                            Hủy lịch hẹn
                                        </Button>
                                    )}
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối lịch hẹn</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label>Lý do từ chối (bắt buộc)</Label>
                        <Textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Nêu rõ lý do để người dân được biết"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                        >
                            Đóng
                        </Button>
                        <Button loading={rejecting} onClick={handleReject}>
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hủy lịch hẹn</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label>Lý do hủy (không bắt buộc)</Label>
                        <Textarea
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCancelDialogOpen(false)}
                        >
                            Đóng
                        </Button>
                        <Button
                            variant="destructive"
                            loading={cancelling}
                            onClick={handleCancel}
                        >
                            Xác nhận hủy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sheet>
    );
};

export default AppointmentDetailSheet;
