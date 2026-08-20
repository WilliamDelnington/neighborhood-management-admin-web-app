import { API } from "@constants/common";
import { AppointmentHoliday, AppointmentHolidayType } from "@dts";
import { request } from "./request";

export type AppointmentHolidayInput = {
    date: string;
    name: string;
    type: AppointmentHolidayType;
    // Chi co y nghia voi admin he thong (khong co wardCode rieng) - bo trong
    // = ap dung TOAN BO cac phuong/xa. Nhan vien/lanh dao phuong luon bi ghi
    // de bang wardCode cua chinh ho o backend, du co gui truong nay hay
    // khong - xem appointmentHolidayService.ts.
    wardCode?: number;
    note?: string;
};

export const fetchAppointmentHolidays = (params?: {
    from?: string;
    to?: string;
}): Promise<AppointmentHoliday[]> =>
    request<AppointmentHoliday[]>("GET", API.APPOINTMENT_HOLIDAYS, params);

export const createAppointmentHoliday = (
    input: AppointmentHolidayInput,
): Promise<AppointmentHoliday> =>
    request<AppointmentHoliday>("POST", API.APPOINTMENT_HOLIDAYS, input);

export const updateAppointmentHoliday = (
    id: string,
    input: Partial<AppointmentHolidayInput>,
): Promise<AppointmentHoliday> =>
    request<AppointmentHoliday>(
        "PATCH",
        `${API.APPOINTMENT_HOLIDAYS}/${id}`,
        input,
    );

export const deleteAppointmentHoliday = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.APPOINTMENT_HOLIDAYS}/${id}`);
