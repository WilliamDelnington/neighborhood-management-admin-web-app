import React, { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { EmptyState } from "@components/admin/DataStates";
import {
    APPOINTMENT_STATUS_LABEL,
    APPOINTMENT_STATUS_TONE,
} from "@constants/domain";
import { Appointment, AppError } from "@dts";
import {
    checkInAppointment,
    completeAppointment,
    lookupAppointmentByCode,
} from "@service/appointmentApi";

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

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const AppointmentCheckInPage: React.FC = () => (
    <AdminGuard permissions={["appointments.checkin"]}>
        <AppointmentCheckInContent />
    </AdminGuard>
);

const AppointmentCheckInContent: React.FC = () => {
    const [code, setCode] = useState("");
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleLookup = async () => {
        if (!code.trim()) {
            toast.error("Vui lòng nhập mã lịch hẹn");
            return;
        }
        try {
            setSearching(true);
            setSearched(true);
            const result = await lookupAppointmentByCode(code.trim());
            setAppointment(result);
        } catch (err) {
            setAppointment(null);
            toast.error((err as AppError).message);
        } finally {
            setSearching(false);
        }
    };

    const handleCheckIn = async () => {
        if (!appointment) return;
        try {
            setProcessing(true);
            const updated = await checkInAppointment(appointment._id);
            setAppointment(updated);
            toast.success("Đã check-in — bắt đầu làm việc");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setProcessing(false);
        }
    };

    const handleComplete = async () => {
        if (!appointment) return;
        try {
            setProcessing(true);
            const updated = await completeAppointment(appointment._id);
            setAppointment(updated);
            toast.success("Đã hoàn thành lịch hẹn");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <h1 className="mb-4 text-lg font-semibold">Check-in lịch hẹn</h1>
            <p className="mb-4 text-sm text-text_2">
                Nhập mã lịch hẹn công dân cung cấp để tra cứu và thực hiện
                check-in / hoàn thành.
            </p>

            <div className="mb-4 flex max-w-lg items-end gap-2">
                <div className="flex-1">
                    <Label>Mã lịch hẹn</Label>
                    <Input
                        className="mt-1"
                        placeholder="Ví dụ: HB-LH-2026-000123"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && void handleLookup()}
                    />
                </div>
                <Button loading={searching} onClick={() => void handleLookup()}>
                    <Search className="mr-1 h-4 w-4" /> Tra cứu
                </Button>
            </div>

            {searched && !searching && !appointment && (
                <EmptyState label="Không tìm thấy lịch hẹn với mã này" />
            )}

            {appointment && (
                <div className="max-w-lg rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                        <h2 className="text-base font-semibold">
                            {appointment.code}
                        </h2>
                        <Badge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                            {APPOINTMENT_STATUS_LABEL[appointment.status]}
                        </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-text_2">
                        <div>Dịch vụ: {serviceText(appointment.serviceId)}</div>
                        <div>Người hẹn: {citizenText(appointment)}</div>
                        <div>Nhà liên quan: {houseText(appointment.houseId)}</div>
                        <div>
                            Ngày hẹn: {formatDate(appointment.appointedDate)} ·{" "}
                            {appointment.startTime} - {appointment.endTime}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {appointment.status === "da_xac_nhan" && (
                            <Button loading={processing} onClick={handleCheckIn}>
                                Bắt đầu làm việc
                            </Button>
                        )}
                        {appointment.status === "da_check_in" && (
                            <Button loading={processing} onClick={handleComplete}>
                                Hoàn thành
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentCheckInPage;
