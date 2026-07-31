import React, { PropsWithChildren } from "react";
import { useAuthStore } from "@store/authStore";
import AccessDenied from "./AccessDenied";

/**
 * Chan truy cap toan bo trang quan tri neu tai khoan co vai tro
 * neighborhood_leader nhung CHUA duoc gan quan ly to dan pho nao
 * (neighborhoodId va assignedNeighborhoodIds deu rong) - tranh de to truong
 * "mo coi" thao tac tren du lieu ma khong co pham vi ro rang. Dat sau
 * AdminGuard (da xac thuc dang nhap + permission dashboard.read) trong App.tsx.
 */
const RequireNeighborhoodAssignment: React.FC<PropsWithChildren> = ({
    children,
}) => {
    const user = useAuthStore(state => state.user);

    const isNeighborhoodLeader = !!user?.roles.includes("neighborhood_leader");
    const hasNeighborhood =
        !!user?.neighborhoodId ||
        (user?.assignedNeighborhoodIds?.length ?? 0) > 0;

    if (isNeighborhoodLeader && !hasNeighborhood) {
        return (
            <AccessDenied
                message="Tài khoản của bạn có vai trò Tổ trưởng nhưng chưa được quản trị viên gán quản lý tổ dân phố nào. Vui lòng gửi yêu cầu hỗ trợ hoặc liên hệ quản trị viên để được gán tổ dân phố trước khi sử dụng."
            />
        );
    }

    return children as React.ReactElement;
};

export default RequireNeighborhoodAssignment;
