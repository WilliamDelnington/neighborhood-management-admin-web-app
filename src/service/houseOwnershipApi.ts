import { API } from "@constants/common";
import {
    HouseOwnership,
    HouseOwnershipRelationshipType,
    OwnerType,
} from "@dts";
import { request } from "./request";

export const fetchHouseOwnerships = (
    houseId: string,
): Promise<HouseOwnership[]> =>
    request<HouseOwnership[]>("GET", `${API.HOUSES}/${houseId}/ownerships`);

export interface AddHouseOwnershipInput {
    ownerType: OwnerType;
    // Mot trong hai: ownerId (da chon qua picker) hoac phone (nhap tay, chi ap
    // dung voi ownerType="user" - backend tim tai khoan CO SAN theo so dien
    // thoai, khong tu tao moi, xem houseOwnershipService.resolveExistingOwnerId).
    ownerId?: string;
    phone?: string;
    relationshipType: HouseOwnershipRelationshipType;
    reason?: string;
}

// relationshipType="primary_owner" se CHUYEN chu so huu chinh (ket thuc quan
// he primary_owner dang active va tao quan he moi) thay vi chi them - xem
// houseOwnershipService.addHouseOwnership o backend.
export const addHouseOwnership = (
    houseId: string,
    input: AddHouseOwnershipInput,
): Promise<HouseOwnership> =>
    request<HouseOwnership>(
        "POST",
        `${API.HOUSES}/${houseId}/ownerships`,
        input,
    );

export const endHouseOwnership = (
    houseId: string,
    ownershipId: string,
    reason?: string,
): Promise<HouseOwnership> =>
    request<HouseOwnership>(
        "PATCH",
        `${API.HOUSES}/${houseId}/ownerships/${ownershipId}`,
        { reason },
    );
