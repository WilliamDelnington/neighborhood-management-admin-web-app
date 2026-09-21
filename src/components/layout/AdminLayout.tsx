import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    KeyRound,
    LogOut,
    Menu,
    MoonStar,
    Star,
    Sun,
    User,
    X,
} from "lucide-react";
import { useAuthStore, usePermission } from "@store/authStore";
import { useThemeStore } from "@store/themeStore";
import { useSectionDescriptionsStore } from "@store/sectionDescriptionsStore";
import { useSurveyBadgeStore } from "@store/surveyBadgeStore";
import { useCorrespondenceBadgeStore } from "@store/correspondenceBadgeStore";
import { usePinnedModulesStore } from "@store/pinnedModulesStore";
import { ROLE_LABEL } from "@constants/domain";
import {
    hasModulePermission,
    ModuleIconTone,
    ModuleItem,
    MODULE_GROUPS,
    TOP_LEVEL_MODULES,
} from "@constants/modules";
import { logout as logoutApi } from "@service/authApi";
import { cn } from "@lib/utils";
import NotificationBell from "./NotificationBell";
import UpcomingMeetingsBell from "./UpcomingMeetingsBell";
import GlobalSearch from "./GlobalSearch";
import AppBrand from "./AppBrand";
import ChangePasswordDialog from "./ChangePasswordDialog";
import AiChatWidget from "./AiChatWidget";
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

// Vd "/appointments" ("Lịch hẹn") va "/appointments/check-in" ("Check-in
// lịch hẹn") la 2 muc CANH NHAU (khong phai cha-con) nhung path cua muc nay
// lai la tien to cua path muc kia - NavLink cua react-router mac dinh khop
// theo tien to (end=false) nen ca hai se cung duoc highlight khi dang o trang
// check-in, gay hieu ung "highlight nham" muc "Lịch hẹn". Buoc cac muc nhu
// vay dung end=true (khop chinh xac) de tranh dung do; cac muc khong trung
// tien to voi muc nao khac van giu end=false nhu cu (vd van highlight dung
// khi drill xuong trang con khong co trong menu, nhu /appointments/:id/history).
const ALL_MODULE_PATHS = [
    ...TOP_LEVEL_MODULES.map(m => m.path),
    ...MODULE_GROUPS.flatMap(group => group.items.map(m => m.path)),
];

const isPrefixOfSiblingModulePath = (path: string) =>
    ALL_MODULE_PATHS.some(
        other => other !== path && other.startsWith(`${path}/`),
    );

const computeModuleNavEnd = (path: string) =>
    path === "/" || isPrefixOfSiblingModulePath(path);

// Mau icon theo tong mau cua tung nhom (ModuleGroup.color) - dam bao doc
// duoc ca hai theme (dark: rieng cho nen toi) thay vi mot mau xam trung tinh
// duy nhat nhu truoc, giup cac nhom de phan biet bang mat thuong khi luot
// sidebar dai ~45 muc.
const ICON_TONE_CLASS: Record<ModuleIconTone, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    teal: "text-teal-600 dark:text-teal-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    slate: "text-slate-500 dark:text-slate-400",
    purple: "text-purple-600 dark:text-purple-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    fuchsia: "text-fuchsia-600 dark:text-fuchsia-400",
};

/**
 * Mot dong module trong sidebar (dung chung cho muc "Da ghim", muc cap cao
 * nhat va muc trong nhom) - gom NavLink dieu huong VA mot nut ghim/bo ghim
 * rieng, khong long button vao trong the <a> (khong hop le ve HTML) ma dat
 * canh nhau trong cung 1 the bao ngoai voi nut ghim dinh vi tuyet doi. Icon
 * LUON giu mau tong cua nhom (kha ca khi dang active) de de nhan dien - chi
 * nhan/nen cua dong doi mau khi duoc chon, khong "nuot" mau icon.
 */
const SidebarModuleLink: React.FC<{
    module: ModuleItem;
    color?: ModuleIconTone;
    title?: string;
    badgeCount: number;
    pinned: boolean;
    onNavigate: () => void;
    onTogglePin: () => void;
}> = ({ module, color, title, badgeCount, pinned, onNavigate, onTogglePin }) => (
    <div className="group/item relative">
        <NavLink
            to={module.path}
            end={computeModuleNavEnd(module.path)}
            title={title}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-text_1 transition-colors hover:bg-ng_10",
                    isActive && "bg-blue_10 text-main",
                )
            }
        >
            <module.icon
                className={cn(
                    "h-4 w-4 shrink-0",
                    color && ICON_TONE_CLASS[color],
                )}
            />
            <span className="truncate">{module.label}</span>
            {badgeCount > 0 && (
                <span className="ml-auto flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                </span>
            )}
        </NavLink>
        <button
            type="button"
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin();
            }}
            title={pinned ? "Bỏ ghim" : "Ghim vào đầu menu"}
            className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 transition-opacity hover:text-amber-500",
                pinned
                    ? "text-amber-500 opacity-100"
                    : "text-text_3 opacity-0 group-hover/item:opacity-100",
            )}
        >
            <Star className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
        </button>
    </div>
);

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore(state => state.user);
    const storeLogout = useAuthStore(state => state.logout);
    const theme = useThemeStore(state => state.theme);
    const toggleTheme = useThemeStore(state => state.toggleTheme);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        loadExpandedGroups,
    );
    const pinnedKeys = usePinnedModulesStore(state => state.pinnedKeys);
    const togglePin = usePinnedModulesStore(state => state.toggle);
    // Mo ta tuy chinh cho tung muc menu (xem SettingsPage.tsx) - dung chung
    // cache voi PageHeader.tsx (xem store/sectionDescriptionsStore.ts) thay vi
    // tu fetchPublicSettings rieng, tranh goi lai nhieu lan khong can thiet.
    // Cong khai nen ap dung cho moi vai tro dang nhap, khong chi admin. Loi bo
    // qua: giu mo ta mac dinh trong constants/modules.ts.
    const descOverrides = useSectionDescriptionsStore(state => state.overrides);
    const descOverridesLoaded = useSectionDescriptionsStore(
        state => state.loaded,
    );
    const loadDescOverrides = useSectionDescriptionsStore(state => state.load);
    useEffect(() => {
        if (!descOverridesLoaded) loadDescOverrides();
    }, [descOverridesLoaded, loadDescOverrides]);

    // So khao sat dang mo, du dieu kien tra loi nhung chua tra loi - hien
    // badge do canh muc "Khảo sát" (chi co y nghia voi tai khoan co quyen
    // "surveys.respond" - cac vai tro khong tra loi duoc thi khong can biet).
    const unansweredSurveyCount = useSurveyBadgeStore(
        state => state.unansweredCount,
    );
    const refreshSurveyBadge = useSurveyBadgeStore(state => state.refresh);
    const canRespondSurveys = usePermission("surveys.respond");
    useEffect(() => {
        if (!canRespondSurveys) return;
        refreshSurveyBadge();
        const interval = setInterval(refreshSurveyBadge, 60_000);
        return () => clearInterval(interval);
    }, [canRespondSurveys, refreshSurveyBadge]);

    // So van ban chua doc - hien badge do canh muc "Văn bản".
    const unreadCorrespondenceCount = useCorrespondenceBadgeStore(
        state => state.unreadCount,
    );
    const refreshCorrespondenceBadge = useCorrespondenceBadgeStore(
        state => state.refresh,
    );
    const canReadCorrespondences = usePermission("correspondences.read");
    useEffect(() => {
        if (!canReadCorrespondences) return;
        refreshCorrespondenceBadge();
        const interval = setInterval(refreshCorrespondenceBadge, 60_000);
        return () => clearInterval(interval);
    }, [canReadCorrespondences, refreshCorrespondenceBadge]);

    // Icon "Cuộc họp sắp tới" tren header - chi hien voi vai tro co quyen xem
    // lich hop (xem UpcomingMeetingsBell.tsx).
    const canReadMeetings = usePermission("meetings.read");

    const descriptionOf = (m: ModuleItem) => descOverrides[m.key] ?? m.description;

    // So dem hien thanh badge do canh ten muc menu (vd "Khảo sát", "Văn bản") -
    // gop lai 1 cho de JSX ben duoi khong phai liet ke tung dieu kien rieng.
    const menuBadgeCount = (key: string): number => {
        if (key === "surveys") return unansweredSurveyCount;
        if (key === "correspondences") return unreadCorrespondenceCount;
        return 0;
    };

    const hasPermission = (m: ModuleItem) =>
        hasModulePermission(user?.permissions, m);

    const visibleTopLevel = TOP_LEVEL_MODULES.filter(hasPermission);
    const visibleGroups = MODULE_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(hasPermission),
    })).filter(group => group.items.length > 0);

    // Tra mau icon theo module key - muc cap cao nhat lay mau rieng cua no
    // (Dashboard), muc trong nhom luon lay mau cua NHOM CHA (khong tu khai
    // bao rieng) de ca nhom dong bo mau voi nhau. Dung 1 bang tra chung cho
    // ca 3 cho render (cap cao nhat/trong nhom/da ghim) thay vi tinh lai.
    const moduleColorByKey: Partial<Record<string, ModuleIconTone>> = {};
    visibleTopLevel.forEach(m => {
        if (m.color) moduleColorByKey[m.key] = m.color;
    });
    visibleGroups.forEach(group => {
        group.items.forEach(m => {
            moduleColorByKey[m.key] = group.color;
        });
    });

    // Danh sach module da ghim, theo dung THU TU ghim (khong sap xep lai) va
    // chi lay tu cac module dang hien thi (co quyen xem) - phong truong hop
    // quyen bi thu hoi sau khi da ghim, muc do se tu an thay vi bao loi.
    const allVisibleModules = [
        ...visibleTopLevel,
        ...visibleGroups.flatMap(group => group.items),
    ];
    const pinnedModules = pinnedKeys
        .map(key => allVisibleModules.find(m => m.key === key))
        .filter((m): m is ModuleItem => !!m);
    const isPinned = (key: string) => pinnedKeys.includes(key);

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
                <div className="relative flex h-16 items-center justify-center border-b border-divider_01 px-4">
                    <AppBrand
                        imgClassName="h-11 max-w-[180px] object-contain"
                        textClassName="text-base font-semibold text-main"
                    />
                    <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-text_2 hover:bg-ng_10 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {pinnedModules.length > 0 && (
                        <div className="mb-2 space-y-1 border-b border-divider_01 pb-2">
                            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text_3">
                                Đã ghim
                            </div>
                            {pinnedModules.map(m => (
                                <SidebarModuleLink
                                    key={`pinned-${m.key}`}
                                    module={m}
                                    color={moduleColorByKey[m.key]}
                                    title={descriptionOf(m)}
                                    badgeCount={menuBadgeCount(m.key)}
                                    pinned
                                    onNavigate={() => setSidebarOpen(false)}
                                    onTogglePin={() => togglePin(m.key)}
                                />
                            ))}
                        </div>
                    )}

                    {visibleTopLevel.map(m => (
                        <SidebarModuleLink
                            key={m.key}
                            module={m}
                            color={moduleColorByKey[m.key]}
                            title={descriptionOf(m)}
                            badgeCount={menuBadgeCount(m.key)}
                            pinned={isPinned(m.key)}
                            onNavigate={() => setSidebarOpen(false)}
                            onTogglePin={() => togglePin(m.key)}
                        />
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
                                        <group.icon
                                            className={cn(
                                                "h-4 w-4",
                                                ICON_TONE_CLASS[group.color],
                                            )}
                                        />
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
                                            <SidebarModuleLink
                                                key={m.key}
                                                module={m}
                                                color={group.color}
                                                title={descriptionOf(m)}
                                                badgeCount={menuBadgeCount(
                                                    m.key,
                                                )}
                                                pinned={isPinned(m.key)}
                                                onNavigate={() =>
                                                    setSidebarOpen(false)
                                                }
                                                onTogglePin={() =>
                                                    togglePin(m.key)
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-divider_01 bg-ui_bg px-4 shadow-sm">
                    <button
                        type="button"
                        className="rounded-md p-1.5 text-text_2 hover:bg-ng_10 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <GlobalSearch />

                    <div className="ml-auto flex items-center gap-4">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            title={
                                theme === "dark"
                                    ? "Chuyển sang chế độ sáng"
                                    : "Chuyển sang chế độ tối"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-ng_10 transition-colors hover:bg-blue_10"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-[18px] w-[18px] text-amber-500" />
                            ) : (
                                <MoonStar className="h-[18px] w-[18px] text-indigo-500 dark:text-indigo-400" />
                            )}
                        </button>

                        {canReadMeetings && <UpcomingMeetingsBell />}

                        <NotificationBell />

                        <span className="h-6 w-px bg-divider_01" />

                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm transition-colors hover:bg-ng_10">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-main to-primary-dark text-xs font-semibold text-white ring-2 ring-blue_10">
                                    {user?.displayName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"}
                                </div>
                                <span className="hidden flex-col items-start leading-tight sm:flex">
                                    <span className="font-semibold text-text_1">
                                        {user?.displayName}
                                    </span>
                                    <span className="text-xs text-text_3">
                                        {user
                                            ? ROLE_LABEL[user.primaryRole]
                                            : ""}
                                    </span>
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-text_3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="flex flex-col">
                                    <span className="font-semibold text-text_1">
                                        {user?.displayName}
                                    </span>
                                    <span className="text-xs font-normal text-text_3">
                                        {user ? ROLE_LABEL[user.primaryRole] : ""}
                                    </span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    <User className="mr-2 h-4 w-4" />
                                    Hồ sơ của tôi
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setChangePasswordOpen(true)}
                                >
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Đổi mật khẩu
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
                    <div key={location.pathname} className="page-transition">
                        <Outlet />
                    </div>
                </main>
            </div>

            <ChangePasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />
            <AiChatWidget />
        </div>
    );
};

export default AdminLayout;
