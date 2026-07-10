import React, { PropsWithChildren } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { Role } from "@dts";

export interface RequireRoleProps extends PropsWithChildren {
    roles: Role[];
}

const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
    const user = useAuthStore(state => state.user);
    const allowed = !!user && user.roles.some(r => roles.includes(r));

    if (!allowed) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                <AlertTriangle className="h-10 w-10 text-text_3" />
                <div className="text-base font-semibold">
                    Bạn không có quyền truy cập
                </div>
                <div className="text-sm text-text_2">
                    Tính năng này chỉ dành cho cán bộ tổ dân phố phù hợp.
                </div>
            </div>
        );
    }

    return children as React.ReactElement;
};

export default RequireRole;
