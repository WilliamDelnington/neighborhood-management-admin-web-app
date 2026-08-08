import { API } from "@constants/common";
import { HouseUsageType, HouseUsageUnit } from "@dts";
import { request } from "./request";

export interface HouseUsageUnitInput {
    unitLabel: string;
    usageType: HouseUsageType;
    householdId?: string;
    businessId?: string;
    companyId?: string;
    note?: string;
}

export const fetchHouseUsageUnits = (houseId: string): Promise<HouseUsageUnit[]> =>
    request<HouseUsageUnit[]>("GET", `${API.HOUSES}/${houseId}/usage-units`);

export const createHouseUsageUnit = (
    houseId: string,
    input: HouseUsageUnitInput,
): Promise<HouseUsageUnit> =>
    request<HouseUsageUnit>(
        "POST",
        `${API.HOUSES}/${houseId}/usage-units`,
        input,
    );

export const updateHouseUsageUnit = (
    id: string,
    input: Partial<Pick<HouseUsageUnitInput, "unitLabel" | "note">>,
): Promise<HouseUsageUnit> =>
    request<HouseUsageUnit>("PATCH", `${API.USAGE_UNITS}/${id}`, input);

export const deleteHouseUsageUnit = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.USAGE_UNITS}/${id}`);
