import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    Appointment,
    AppointmentReportSummary,
    AppointmentStatus,
    AuditLogRecord,
    FileAsset,
    PaginatedData,
} from "@dts";
import { request } from "./request";

export const fetchAppointments = (params?: {
    page?: number;
    limit?: number;
    status?: AppointmentStatus;
    serviceId?: string;
    date?: string;
}): Promise<PaginatedData<Appointment>> =>
    request<PaginatedData<Appointment>>("GET", API.APPOINTMENTS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        status: params?.status,
        serviceId: params?.serviceId,
        date: params?.date,
    });

export const fetchAppointmentById = (id: string): Promise<Appointment> =>
    request<Appointment>("GET", `${API.APPOINTMENTS}/${id}`);

// Tra cuu theo ma lich hen (vd "HB-LH-2026-000123") - dung cho man Check-in
// (nhap tay ma, khong dung QR - xem AppointmentCheckInPage.tsx).
export const lookupAppointmentByCode = (code: string): Promise<Appointment> =>
    request<Appointment>("GET", `${API.APPOINTMENTS}/lookup`, { code });

export const cancelAppointment = (
    id: string,
    reason?: string,
): Promise<Appointment> =>
    request<Appointment>("POST", `${API.APPOINTMENTS}/${id}/cancel`, {
        reason,
    });

export const confirmAppointment = (id: string): Promise<Appointment> =>
    request<Appointment>("POST", `${API.APPOINTMENTS}/${id}/confirm`);

export const rejectAppointment = (
    id: string,
    reason: string,
): Promise<Appointment> =>
    request<Appointment>("POST", `${API.APPOINTMENTS}/${id}/reject`, {
        reason,
    });

export const checkInAppointment = (id: string): Promise<Appointment> =>
    request<Appointment>("POST", `${API.APPOINTMENTS}/${id}/check-in`);

export const completeAppointment = (id: string): Promise<Appointment> =>
    request<Appointment>("POST", `${API.APPOINTMENTS}/${id}/complete`);

export const fetchAppointmentReportSummary = (params?: {
    serviceId?: string;
    from?: string;
    to?: string;
}): Promise<AppointmentReportSummary> =>
    request<AppointmentReportSummary>(
        "GET",
        `${API.APPOINTMENTS}/reports/summary`,
        params,
    );

export const fetchAppointmentAttachments = (id: string): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.APPOINTMENTS}/${id}/attachments`);

export const fetchAppointmentAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.APPOINTMENTS}/${id}/audit-logs`,
        params,
    );
