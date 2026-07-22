import {
    LayoutDashboard,
    Home,
    MessageSquare,
    Flame,
    Shield,
    CalendarDays,
    Megaphone,
    ClipboardList,
    Wallet,
    BarChart3,
    UserCog,
    Settings,
    KeyRound,
    Briefcase,
    FileText,
} from "lucide-react";

export type ModuleItem = {
    key: string;
    label: string;
    path: string;
    icon: typeof Home;
    permission: string;
};

export const MODULES: ModuleItem[] = [
    {
        key: "dashboard",
        label: "Bảng điều khiển",
        path: "/",
        icon: LayoutDashboard,
        permission: "dashboard.read",
    },
    {
        key: "houses",
        label: "Nhà số",
        path: "/houses",
        icon: Home,
        permission: "houses.read",
    },
    {
        key: "business_types",
        label: "Loại hình kinh doanh",
        path: "/business-types",
        icon: Briefcase,
        permission: "business_types.read",
    },
    {
        key: "complaints",
        label: "Phản ánh",
        path: "/complaints",
        icon: MessageSquare,
        permission: "complaints.read",
    },
    {
        key: "pccc",
        label: "PCCC",
        path: "/pccc",
        icon: Flame,
        permission: "pccc.read",
    },
    {
        key: "security",
        label: "An ninh, tạm trú",
        path: "/security",
        icon: Shield,
        permission: "security.read",
    },
    {
        key: "meetings",
        label: "Cuộc họp",
        path: "/meetings",
        icon: CalendarDays,
        permission: "meetings.read",
    },
    {
        key: "announcements",
        label: "Thông báo",
        path: "/announcements",
        icon: Megaphone,
        permission: "announcements.read",
    },
    {
        key: "surveys",
        label: "Khảo sát",
        path: "/surveys",
        icon: ClipboardList,
        permission: "surveys.read",
    },
    {
        key: "files",
        label: "Biểu mẫu & tệp tin",
        path: "/files",
        icon: FileText,
        permission: "files.read",
    },
    {
        key: "finance",
        label: "Tài chính",
        path: "/finance",
        icon: Wallet,
        permission: "finance.read",
    },
    {
        key: "reports",
        label: "Báo cáo",
        path: "/reports",
        icon: BarChart3,
        permission: "reports.read",
    },
    {
        key: "users",
        label: "Người dùng & vai trò",
        path: "/users",
        icon: UserCog,
        permission: "users.read",
    },
    {
        key: "roles",
        label: "Vai trò & phân quyền",
        path: "/roles",
        icon: KeyRound,
        permission: "roles.read",
    },
    {
        key: "settings",
        label: "Cài đặt",
        path: "/settings",
        icon: Settings,
        permission: "settings.read",
    },
];
