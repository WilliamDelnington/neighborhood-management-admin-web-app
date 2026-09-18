import { API } from "@constants/common";
import { NeighborhoodCollaboratorScope } from "@dts";
import { request } from "./request";

// Dung boi WardManagementPage.tsx (scopeType="WARD") va
// NeighborhoodMembersPanel.tsx (scopeType="NEIGHBORHOOD", CHI cho vai tro
// KHONG phai 1 trong 3 vai tro co san neighborhood_leader/coleader/collaborator -
// 3 vai tro do van di qua neighborhoodApi.ts nhu truoc, xem ghi chu o
// scopeAssignmentService.ts backend).
export interface AssignScopeParams {
    userId: string;
    roleKey: string;
    scopeType: "WARD" | "NEIGHBORHOOD";
    scopeId: string | number;
    subScope?: {
        kind: NeighborhoodCollaboratorScope;
        streetId?: string;
        houseIds?: string[];
        campaignId?: string;
    };
    note?: string;
}

export const assignScope = (params: AssignScopeParams): Promise<unknown> =>
    request("POST", API.SCOPE_ASSIGNMENTS, params);

export const unassignScope = (params: AssignScopeParams): Promise<unknown> =>
    request("POST", API.SCOPE_ASSIGNMENTS_UNASSIGN, params);

// Ket qua tho tu listActiveScopeHolders o backend - dung cho
// NeighborhoodMembersPanel.tsx hien danh sach THANH VIEN cua 1 To dan pho
// (BAT KE vai tro, gom ca 3 vai tro co san) trong MOT lan goi, thay vi 3 lan
// goi rieng (leader/coleaders/collaborators) nhu truoc.
export interface ScopeHolder {
    _id: string;
    userId: { _id: string; displayName: string; phone?: string } | string;
    roleKey: string;
    scopeType: "WARD" | "NEIGHBORHOOD";
    scopeId: string | number;
    subScope?: {
        kind: NeighborhoodCollaboratorScope;
        streetId?: string;
        houseIds?: string[];
        campaignId?: string;
    };
    assignedAt: string;
    note?: string;
}

export const fetchScopeHolders = (params: {
    scopeType: "WARD" | "NEIGHBORHOOD";
    scopeId: string | number;
    roleKey?: string;
}): Promise<ScopeHolder[]> =>
    request<ScopeHolder[]>("GET", API.SCOPE_ASSIGNMENTS, params);
