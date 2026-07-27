import React, { PropsWithChildren } from "react";
import { Role } from "@dts";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";
import RequirePermission from "./RequirePermission";

export interface AdminGuardProps extends PropsWithChildren {
    /** @deprecated dung permissions thay the - giu lai de tuong thich nguoc */
    roles?: Role[];
    permissions?: string[];
}

const AdminGuard: React.FC<AdminGuardProps> = ({ roles, permissions, children }) => (
    <RequireAuth>
        {permissions ? (
            <RequirePermission permissions={permissions}>
                {children}
            </RequirePermission>
        ) : (
            <RequireRole roles={roles || []}>{children}</RequireRole>
        )}
    </RequireAuth>
);

export default AdminGuard;
