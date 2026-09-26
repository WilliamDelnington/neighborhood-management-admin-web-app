import React, { PropsWithChildren } from "react";
import { useAuthStore } from "@store/authStore";
import AccessDenied from "./AccessDenied";

/**
 * Chan truy cap toan bo trang quan tri neu tai khoan giu mot vai tro cap
 * Phuong/Xa (vd Can bo UBND, Bi thu, Cong an khu vuc...) hoac cap To dan pho
 * (To truong, To pho, Cong tac vien...) nhung CHUA duoc gan pham vi tuong ung
 * - tranh de tai khoan "mo coi" thao tac tren du lieu ma khong co pham vi ro
 * rang. Danh sach vai tro thieu pham vi do backend tinh tu Role.scopeType/
 * scopeMechanism (user.missingScopeAssignments, xem authService.ts
 * getMissingScopeAssignments) nen vai tro moi tao qua man Quan ly vai tro
 * cung duoc ap dung, khong can sua code. Dat sau AdminGuard trong App.tsx.
 */
const RequireScopeAssignment: React.FC<PropsWithChildren> = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const missing = user?.missingScopeAssignments ?? [];

    if (missing.length > 0) {
        const describe = (scopeType: "WARD" | "NEIGHBORHOOD") =>
            missing
                .filter(m => m.scopeType === scopeType)
                .map(m => m.roleLabel)
                .join(", ");
        const wardRoles = describe("WARD");
        const neighborhoodRoles = describe("NEIGHBORHOOD");
        const parts = [
            wardRoles &&
                `vai trò ${wardRoles} nhưng chưa được gán quản lý phường/xã nào`,
            neighborhoodRoles &&
                `vai trò ${neighborhoodRoles} nhưng chưa được gán quản lý tổ dân phố nào`,
        ].filter(Boolean);

        return (
            <AccessDenied
                message={`Tài khoản của bạn có ${parts.join("; và có ")}. Vui lòng gửi yêu cầu hỗ trợ hoặc liên hệ quản trị viên để được gán phạm vi quản lý trước khi sử dụng.`}
            />
        );
    }

    return children as React.ReactElement;
};

export default RequireScopeAssignment;
