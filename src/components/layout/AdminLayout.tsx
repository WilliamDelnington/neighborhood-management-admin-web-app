import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    KeyRound,
    LogOut,
    Menu,
    Moon,
    Sun,
    User,
    X,
} from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { useThemeStore } from "@store/themeStore";
import { ROLE_LABEL } from "@constants/domain";
import { ModuleItem, MODULE_GROUPS, TOP_LEVEL_MODULES } from "@constants/modules";
import { logout as logoutApi } from "@service/authApi";
import { cn } from "@lib/utils";
import NotificationBell from "./NotificationBell";
import AppBrand from "./AppBrand";
import ProfileDialog from "./ProfileDialog";
import ChangePasswordDialog from "./ChangePasswordDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

// Ghi nho nhom nao dang mo rong giua cac lan tai lai trang - theo dung kieu
// doc/ghi localStorage truc tiep da dung trong authStore.ts (chua dung
// zustand persist middleware o dau trong app nay).
const EXPANDED_GROUPS_STORAGE_KEY = "hb_admin_sidebar_expanded_groups";

function loadExpandedGroups(): Set<string> {
    try {
        const raw = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY);
        return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set();
    }
}

function saveExpandedGroups(groups: Set<string>): void {
    localStorage.setItem(
        EXPANDED_GROUPS_STORAGE_KEY,
        JSON.stringify([...groups]),
    );
}

const isModuleActive = (path: string, pathname: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore(state => state.user);
    const storeLogout = useAuthStore(state => state.logout);
    const theme = useThemeStore(state => state.theme);
    const toggleTheme = useThemeStore(state => state.toggleTheme);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        loadExpandedGroups,
    );

    const hasPermission = (m: ModuleItem) =>
        !!user?.permissions?.includes(m.permission);

    const visibleTopLevel = TOP_LEVEL_MODULES.filter(hasPermission);
    const visibleGroups = MODULE_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(hasPermission),
    })).filter(group => group.items.length > 0);

    // Tu dong mo rong nhom chua route dang active - vd bam link tu Bang dieu
    // khien vao thang mot trang con trong nhom dang thu gon thi nhom do phai
    // hien ra, khong chi phu thuoc vao viec nguoi dung tung bam mo no.
    useEffect(() => {
        const activeGroup = MODULE_GROUPS.find(group =>
            group.items.some(m => isModuleActive(m.path, location.pathname)),
        );
        if (activeGroup && !expandedGroups.has(activeGroup.key)) {
            setExpandedGroups(prev => {
                const next = new Set(prev);
                next.add(activeGroup.key);
                saveExpandedGroups(next);
                return next;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            saveExpandedGroups(next);
            return next;
        });
    };

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
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-80 flex-shrink-0 flex-col border-r border-divider_01 bg-ui_bg transition-transform duration-200 ease-in-out",
                    "lg:static lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-14 items-center justify-between border-b border-divider_01 px-4">
                    <AppBrand
                        imgClassName="h-8 max-w-[160px] object-contain"
                        textClassName="text-base font-semibold text-main"
                    />
                    <button
                        type="button"
                        className="rounded-md p-1 text-text_2 hover:bg-ng_10 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {visibleTopLevel.map(m => (
                        <NavLink
                            key={m.key}
                            to={m.path}
                            end={m.path === "/"}
                            onClick={() => setSidebarOpen(false)}
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

                    {visibleGroups.map(group => {
                        const expanded = expandedGroups.has(group.key);
                        return (
                            <div key={group.key}>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.key)}
                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-text_2 transition-colors hover:bg-ng_10"
                                >
                                    <span className="flex items-center gap-3">
                                        <group.icon className="h-4 w-4" />
                                        {group.label}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 transition-transform duration-200",
                                            expanded && "rotate-180",
                                        )}
                                    />
                                </button>
                                {expanded && (
                                    <div className="ml-3 space-y-1 border-l border-divider_01 pl-3">
                                        {group.items.map(m => (
                                            <NavLink
                                                key={m.key}
                                                to={m.path}
                                                onClick={() =>
                                                    setSidebarOpen(false)
                                                }
                                                className={({ isActive }) =>
                                                    cn(
                                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text_1 transition-colors hover:bg-ng_10",
                                                        isActive &&
                                                            "bg-blue_10 text-main",
                                                    )
                                                }
                                            >
                                                <m.icon className="h-4 w-4" />
                                                {m.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 flex-shrink-0 items-center justify-between gap-2 border-b border-divider_01 bg-ui_bg px-4">
                    <button
                        type="button"
                        className="rounded-md p-1.5 text-text_2 hover:bg-ng_10 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ng_10">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue_10 text-xs font-semibold text-main">
                                    {user?.displayName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"}
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
                                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                                    <User className="mr-2 h-4 w-4" />
                                    Hồ sơ của tôi
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setChangePasswordOpen(true)}
                                >
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Đổi mật khẩu
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={toggleTheme}>
                                    {theme === "dark" ? (
                                        <Sun className="mr-2 h-4 w-4" />
                                    ) : (
                                        <Moon className="mr-2 h-4 w-4" />
                                    )}
                                    {theme === "dark"
                                        ? "Chế độ sáng"
                                        : "Chế độ tối"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>

            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
            <ChangePasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />
        </div>
    );
};

export default AdminLayout;
