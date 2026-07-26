import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { ROLE_LABEL } from "@constants/domain";
import { MODULES } from "@constants/modules";
import { logout as logoutApi } from "@service/authApi";
import { cn } from "@lib/utils";
import NotificationBell from "./NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const storeLogout = useAuthStore(state => state.logout);

    const visibleModules = MODULES.filter(m =>
        user?.permissions?.includes(m.permission),
    );

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
        <div className="flex h-screen">
            <aside className="flex w-64 flex-shrink-0 flex-col border-r border-divider_01 bg-white">
                <div className="flex h-14 items-center border-b border-divider_01 px-4">
                    <span className="text-base font-semibold text-main">
                        Tổ dân phố Hòa Bình
                    </span>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {visibleModules.map(m => (
                        <NavLink
                            key={m.key}
                            to={m.path}
                            end={m.path === "/"}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text_1 transition-colors hover:bg-ng_10",
                                    isActive && "bg-blue_10 text-main",
                                )
                            }
                        >
                            <m.icon className="h-4 w-4" />
                            {m.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 flex-shrink-0 items-center justify-end gap-2 border-b border-divider_01 bg-white px-4">
                    <NotificationBell />
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ng_10">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue_10 text-xs font-semibold text-main">
                                {user?.displayName?.charAt(0)?.toUpperCase() ||
                                    "?"}
                            </div>
                            <span className="font-medium">
                                {user?.displayName}
                            </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                {user ? ROLE_LABEL[user.primaryRole] : ""}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Đăng xuất
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
