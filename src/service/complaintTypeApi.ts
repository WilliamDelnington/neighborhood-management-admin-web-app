import { API } from "@constants/common";
import { ComplaintTypeDefinition, PaginatedData } from "@dts";
import { request } from "./request";

export type ComplaintTypeDefinitionInput = {
    key: string;
    name: string;
    description?: string;
    allowedReceiverRoles: string[];
    active: boolean;
};

export type ComplaintTypeRoleOption = {
    key: string;
    name: string;
};

export const fetchComplaintTypeDefinitions = (params?: {
    page?: number;
    limit?: number;
    active?: boolean;
    search?: string;
}): Promise<PaginatedData<ComplaintTypeDefinition>> =>
    request<PaginatedData<ComplaintTypeDefinition>>(
        "GET",
        API.COMPLAINT_TYPES,
        params,
    );

export const fetchComplaintTypeRoles = (): Promise<ComplaintTypeRoleOption[]> =>
    request<ComplaintTypeRoleOption[]>("GET", `${API.COMPLAINT_TYPES}/roles`);

export const createComplaintTypeDefinition = (
    input: ComplaintTypeDefinitionInput,
): Promise<ComplaintTypeDefinition> =>
    request<ComplaintTypeDefinition>("POST", API.COMPLAINT_TYPES, input);

export const updateComplaintTypeDefinition = (
    id: string,
    input: Partial<Omit<ComplaintTypeDefinitionInput, "key">>,
): Promise<ComplaintTypeDefinition> =>
    request<ComplaintTypeDefinition>(
        "PATCH",
        `${API.COMPLAINT_TYPES}/${id}`,
        input,
    );

export const archiveComplaintTypeDefinition = (
    id: string,
): Promise<ComplaintTypeDefinition> =>
    request<ComplaintTypeDefinition>("DELETE", `${API.COMPLAINT_TYPES}/${id}`);
