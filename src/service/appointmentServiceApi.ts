import { API } from "@constants/common";
import { AppointmentService, AppointmentTimeSlot } from "@dts";
import { request } from "./request";

export type AppointmentTimeSlotInput = Omit<AppointmentTimeSlot, "_id"> & {
    _id?: string;
};

export type AppointmentServiceInput = {
    key: string;
    name: string;
    description?: string;
    locationAddress: string;
    scope: "ward" | "neighborhood";
    neighborhoodId?: string;
    slotDurationMinutes: number;
    autoApprove: boolean;
    active: boolean;
    assignedOfficerUserIds: string[];
    timeSlots: AppointmentTimeSlotInput[];
};

export const fetchAppointmentServices = (params?: {
    activeOnly?: boolean;
}): Promise<AppointmentService[]> =>
    request<AppointmentService[]>("GET", API.APPOINTMENT_SERVICES, {
        activeOnly: params?.activeOnly,
    });

export const createAppointmentService = (
    input: AppointmentServiceInput,
): Promise<AppointmentService> =>
    request<AppointmentService>("POST", API.APPOINTMENT_SERVICES, input);

export const updateAppointmentService = (
    id: string,
    input: Partial<Omit<AppointmentServiceInput, "key">>,
): Promise<AppointmentService> =>
    request<AppointmentService>(
        "PATCH",
        `${API.APPOINTMENT_SERVICES}/${id}`,
        input,
    );

export const archiveAppointmentService = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.APPOINTMENT_SERVICES}/${id}`);
