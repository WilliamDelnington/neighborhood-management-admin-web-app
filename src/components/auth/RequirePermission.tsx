import React, { PropsWithChildren } from "react";
import { useAuthStore } from "@store/authStore";
import AccessDenied from "./AccessDenied";

export interface RequirePermissionProps extends PropsWithChildren {
    permissions: string[];
}

const RequirePermission: React.FC<RequirePermissionProps> = ({
    permissions,
    children,
}) => {
    const user = useAuthStore(state => state.user);
    const allowed = permissions.some(p => user?.permissions?.includes(p));

    if (!allowed) {
        return <AccessDenied />;
    }

    return children as React.ReactElement;
};

export default RequirePermission;
