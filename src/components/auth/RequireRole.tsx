import React, { PropsWithChildren } from "react";
import { useAuthStore } from "@store/authStore";
import { Role } from "@dts";
import AccessDenied from "./AccessDenied";

export interface RequireRoleProps extends PropsWithChildren {
    roles: Role[];
}

const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
    const user = useAuthStore(state => state.user);
    const allowed = !!user && user.roles.some(r => roles.includes(r));

    if (!allowed) {
        return <AccessDenied />;
    }

    return children as React.ReactElement;
};

export default RequireRole;
