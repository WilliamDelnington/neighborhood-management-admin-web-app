import { API } from "@constants/common";
import { request } from "./request";

// Hien tai chi duoc dung boi WardManagementPage.tsx (scopeType="WARD") - xem
// ke hoach "Config-Driven Account Scope System". NEIGHBORHOOD (To truong/To
// pho/Cộng tác viên) van di qua neighborhoodApi.ts/3 bang rieng nhu truoc,
// chua chuyen sang co che chung nay.
export interface AssignScopeParams {
    userId: string;
    roleKey: string;
    scopeType: "WARD" | "NEIGHBORHOOD";
    scopeId: string | number;
    note?: string;
}

export const assignScope = (params: AssignScopeParams): Promise<unknown> =>
    request("POST", API.SCOPE_ASSIGNMENTS, params);

export const unassignScope = (params: AssignScopeParams): Promise<unknown> =>
    request("POST", API.SCOPE_ASSIGNMENTS_UNASSIGN, params);
