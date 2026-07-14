import React, { PropsWithChildren } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "@store/authStore";

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

export default RequirePermission;
