import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { MucNguyCoPccc, PaginatedData, PcccCheck } from "@dts";
import { request } from "./request";

export interface PcccCheckInput {
    householdId: string;
    hasFireExtinguisher?: boolean;
    hasEmergencyExit?: boolean;
    hasIndoorEvCharging?: boolean;
    hasGasStoveOrStorageOrBusiness?: boolean;
    isCrowdedRental?: boolean;
    riskLevel?: MucNguyCoPccc;
    remediationNeeded?: string;
    inspectionDate: string;
    inspectorId?: string;
    followUpStatus?: string;
}

export const fetchPcccChecks = (params?: {
    page?: number;
    limit?: number;
    riskLevel?: MucNguyCoPccc;
    householdId?: string;
}): Promise<PaginatedData<PcccCheck>> =>
    request<PaginatedData<PcccCheck>>("GET", API.PCCC, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        riskLevel: params?.riskLevel,
        householdId: params?.householdId,
    });

export const fetchPcccCheckById = (id: string): Promise<PcccCheck> =>
    request<PcccCheck>("GET", `${API.PCCC}/${id}`);

export const createPcccCheck = (input: PcccCheckInput): Promise<PcccCheck> =>
    request<PcccCheck>("POST", API.PCCC, input);

export const updatePcccCheck = (
    id: string,
    input: Partial<PcccCheckInput>,
): Promise<PcccCheck> =>
    request<PcccCheck>("PATCH", `${API.PCCC}/${id}`, input);

export const deletePcccCheck = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.PCCC}/${id}`);

export const fetchPcccRiskSummary = (): Promise<Record<string, number>> =>
    request<Record<string, number>>("GET", `${API.PCCC}/summary`);
