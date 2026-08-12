import { API } from "@constants/common";
import {
    PaginatedData,
    RequestFormField,
    RequestTypeDefinition,
} from "@dts";
import { request } from "./request";

export type RequestTypeDefinitionInput = {
    key: string;
    name: string;
    description?: string;
    fields: RequestFormField[];
    allowedSenderRoles: string[];
    allowedReceiverRoles: string[];
    dataEntryMode: "sender" | "recipient";
    active: boolean;
};

export type RequestTypeRoleOption = {
    key: string;
    name: string;
};

export const fetchRequestTypeDefinitions = (params?: {
    page?: number;
    limit?: number;
    active?: boolean;
    search?: string;
}): Promise<PaginatedData<RequestTypeDefinition>> =>
    request<PaginatedData<RequestTypeDefinition>>("GET", API.REQUEST_TYPES, params);

export const fetchRequestTypeRoles = (): Promise<RequestTypeRoleOption[]> =>
    request<RequestTypeRoleOption[]>("GET", `${API.REQUEST_TYPES}/roles`);

export const createRequestTypeDefinition = (
    input: RequestTypeDefinitionInput,
): Promise<RequestTypeDefinition> =>
    request<RequestTypeDefinition>("POST", API.REQUEST_TYPES, input);

export const updateRequestTypeDefinition = (
    id: string,
    input: Partial<Omit<RequestTypeDefinitionInput, "key">>,
): Promise<RequestTypeDefinition> =>
    request<RequestTypeDefinition>("PATCH", `${API.REQUEST_TYPES}/${id}`, input);

export const archiveRequestTypeDefinition = (
    id: string,
): Promise<RequestTypeDefinition> =>
    request<RequestTypeDefinition>("DELETE", `${API.REQUEST_TYPES}/${id}`);
