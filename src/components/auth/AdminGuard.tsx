import React, { PropsWithChildren } from "react";
import { Role } from "@dts";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";

export interface AdminGuardProps extends PropsWithChildren {
    roles: Role[];
}

const AdminGuard: React.FC<AdminGuardProps> = ({ roles, children }) => (
    <RequireAuth>
        <RequireRole roles={roles}>{children}</RequireRole>
    </RequireAuth>
);

export default AdminGuard;
