import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LogOut } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { logout as logoutApi } from "@service/authApi";
import { Button } from "@components/ui/button";

const AccessDenied: React.FC = () => {
    const navigate = useNavigate();
    const storeLogout = useAuthStore(state => state.logout);

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch {
            // bo qua loi mang, van xoa session cuc bo
        }
        storeLogout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-text_3" />
            <div className="text-base font-semibold">
                Bạn không có quyền truy cập
            </div>
            <div className="text-sm text-text_2">
                Tính năng này chỉ dành cho cán bộ tổ dân phố phù hợp.
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
            </Button>
        </div>
    );
};

export default AccessDenied;
