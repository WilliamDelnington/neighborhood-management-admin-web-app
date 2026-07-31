import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    LoaiYeuCauHoTro,
    PaginatedData,
    SupportTicket,
    TrangThaiYeuCauHoTro,
} from "@dts";
import { request } from "./request";

export const fetchSupportTickets = (params?: {
    page?: number;
    limit?: number;
    status?: TrangThaiYeuCauHoTro;
    type?: LoaiYeuCauHoTro;
    search?: string;
}): Promise<PaginatedData<SupportTicket>> =>
    request<PaginatedData<SupportTicket>>("GET", API.SUPPORT_TICKETS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        status: params?.status,
        type: params?.type,
        search: params?.search,
    });

export const fetchSupportTicketDetail = (id: string): Promise<SupportTicket> =>
    request<SupportTicket>("GET", `${API.SUPPORT_TICKETS}/${id}`);

export interface CreateSupportTicketInput {
    type: LoaiYeuCauHoTro;
    title: string;
    content: string;
}

export const createSupportTicket = (
    input: CreateSupportTicketInput,
): Promise<SupportTicket> =>
    request<SupportTicket>("POST", API.SUPPORT_TICKETS, input);

export interface UpdateSupportTicketStatusInput {
    status: TrangThaiYeuCauHoTro;
    response?: string;
}

export const updateSupportTicketStatus = (
    id: string,
    input: UpdateSupportTicketStatusInput,
): Promise<SupportTicket> =>
    request<SupportTicket>(
        "PATCH",
        `${API.SUPPORT_TICKETS}/${id}/status`,
        input,
    );
