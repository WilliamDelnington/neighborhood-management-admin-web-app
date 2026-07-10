import {
    LayoutDashboard,
    Home,
    Users,
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
} from "lucide-react";
import { Role } from "@dts";

export type ModuleItem = {
    key: string;
    label: string;
    path: string;
    icon: typeof Home;
    roles: Role[];
};

const STAFF_5 = [
    "admin",
    "neighborhood_leader",
    "secretary",
    "regional_police",
    "people_committee_official",
] as const;

export const MODULES: ModuleItem[] = [
    {
        key: "dashboard",
        label: "Bảng điều khiển",
        path: "/",
        icon: LayoutDashboard,
        roles: [...STAFF_5],
    },
    {
        key: "households",
        label: "Hộ dân",
        path: "/households",
        icon: Home,
        roles: [...STAFF_5],
    },
    {
        key: "citizens",
        label: "Nhân khẩu",
        path: "/citizens",
        icon: Users,
        roles: [...STAFF_5],
    },
    {
        key: "complaints",
        label: "Phản ánh",
        path: "/complaints",
        icon: MessageSquare,
        roles: [
            "admin",
            "neighborhood_leader",
            "regional_police",
            "people_committee_official",
        ],
    },
    {
        key: "pccc",
        label: "PCCC",
        path: "/pccc",
        icon: Flame,
        roles: [
            "admin",
            "neighborhood_leader",
            "regional_police",
            "people_committee_official",
        ],
    },
    {
        key: "security",
        label: "An ninh, tạm trú",
        path: "/security",
        icon: Shield,
        roles: [
            "admin",
            "neighborhood_leader",
            "regional_police",
            "people_committee_official",
        ],
    },
    {
        key: "meetings",
        label: "Cuộc họp",
        path: "/meetings",
        icon: CalendarDays,
        roles: ["admin", "secretary", "neighborhood_leader"],
    },
    {
        key: "announcements",
        label: "Thông báo",
        path: "/announcements",
        icon: Megaphone,
        roles: ["admin", "secretary", "neighborhood_leader"],
    },
    {
        key: "surveys",
        label: "Khảo sát",
        path: "/surveys",
        icon: ClipboardList,
        roles: ["admin", "secretary", "neighborhood_leader"],
    },
    {
        key: "finance",
        label: "Tài chính",
        path: "/finance",
        icon: Wallet,
        roles: ["admin"],
    },
    {
        key: "reports",
        label: "Báo cáo",
        path: "/reports",
        icon: BarChart3,
        roles: ["admin", "neighborhood_leader", "regional_police"],
    },
    {
        key: "users",
        label: "Người dùng & vai trò",
        path: "/users",
        icon: UserCog,
        roles: ["admin"],
    },
    {
        key: "settings",
        label: "Cài đặt",
        path: "/settings",
        icon: Settings,
        roles: ["admin"],
    },
];

export const STAFF_ROLES: Role[] = [...STAFF_5];
