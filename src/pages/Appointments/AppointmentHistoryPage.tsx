import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { APPOINTMENT_AUDIT_ACTION_LABEL } from "@constants/domain";
import { Appointment } from "@dts";
import { fetchAppointmentAuditLogs, fetchAppointmentById } from "@service/appointmentApi";

const AppointmentHistoryPage: React.FC = () => (
    <AdminGuard permissions={["appointments.read"]}>
        <AppointmentHistoryContent />
    </AdminGuard>
);

const AppointmentHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [appointment, setAppointment] = useState<Appointment | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchAppointmentById(id)
            .then(setAppointment)
            .catch(() => setAppointment(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${
                appointment ? ` — ${appointment.code}` : ""
            }`}
            backTo="/appointments"
            fetchHistory={params => fetchAppointmentAuditLogs(id, params)}
            actionLabels={APPOINTMENT_AUDIT_ACTION_LABEL}
        />
    );
};

export default AppointmentHistoryPage;
