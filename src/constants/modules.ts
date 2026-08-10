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
    UserPlus,
    Settings,
    KeyRound,
    Briefcase,
    Store,
    Building,
    FileText,
    FileCheck2,
    History,
    LifeBuoy,
    MapPinned,
    Building2,
    ListOrdered,
    Send,
    Inbox,
    ShieldCheck,
    Users,
    FileSignature,
    ClipboardCheck,
    Construction,
} from "lucide-react";

export type ModuleItem = {
    key: string;
    label: string;
    path: string;
    icon: typeof Home;
    permission: string;
};

export type ModuleGroup = {
    key: string;
    label: string;
    icon: typeof Home;
    items: ModuleItem[];
};

// Muc luon hien o dau sidebar, khong thuoc nhom nao (trang chu).
export const TOP_LEVEL_MODULES: ModuleItem[] = [
    {
        key: "dashboard",
        label: "Bảng điều khiển",
        path: "/",
        icon: LayoutDashboard,
        permission: "dashboard.read",
    },
];

// Cac muc con lai duoc gom nhom de sidebar gon hon va co the thu gon/mo rong
// tung nhom (xem AdminLayout.tsx). Them muc moi thi chi can them vao dung
// nhom lien quan - khong can dong nao khac.
export const MODULE_GROUPS: ModuleGroup[] = [
    {
        key: "location",
        label: "Quản lý khu vực",
        icon: MapPinned,
        items: [
            {
                key: "neighborhoods",
                label: "Tổ dân phố",
                path: "/neighborhoods",
                icon: MapPinned,
                permission: "neighborhoods.read",
            },
            {
                key: "streets",
                label: "Đường / phố",
                path: "/streets",
                icon: MapPinned,
                permission: "streets.read",
            },
            {
                key: "infrastructure-assets",
                label: "Sổ hạ tầng",
                path: "/infrastructure-assets",
                icon: Construction,
                permission: "infrastructure.read",
            },
            {
                key: "periodic-reports",
                label: "Báo cáo định kỳ",
                path: "/periodic-reports",
                icon: ClipboardList,
                permission: "reports.author",
            },
            {
                key: "houses",
                label: "Nhà số",
                path: "/houses",
                icon: Home,
                permission: "houses.read",
            },
            {
                key: "organizations",
                label: "Tổ chức (chủ nhà)",
                path: "/organizations",
                icon: Building2,
                permission: "organizations.read",
            },
            {
                key: "residents",
                label: "Hồ sơ cư trú",
                path: "/residents",
                icon: Users,
                permission: "residents.read",
            },
        ],
    },
    {
        key: "business",
        label: "Quản lý kinh doanh",
        icon: Store,
        items: [
            {
                key: "businesses",
                label: "Hộ kinh doanh",
                path: "/businesses",
                icon: Store,
                permission: "businesses.read",
            },
            {
                key: "companies",
                label: "Công ty",
                path: "/companies",
                icon: Building,
                permission: "companies.read",
            },
            {
                key: "business_types",
                label: "Loại hình kinh doanh",
                path: "/business-types",
                icon: Briefcase,
                permission: "business_types.read",
            },
        ],
    },
    {
        key: "requests",
        label: "Quản lý yêu cầu",
        icon: Send,
        items: [
            {
                key: "complaints",
                label: "Phản ánh",
                path: "/complaints",
                icon: MessageSquare,
                permission: "complaints.read",
            },
            {
                key: "support_tickets",
                label: "Yêu cầu hỗ trợ",
                path: "/support-tickets",
                icon: LifeBuoy,
                permission: "support_tickets.read",
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
                label: "An ninh",
                path: "/security",
                icon: Shield,
                permission: "security.read",
            },
            {
                key: "requests",
                label: "Yêu cầu công việc",
                path: "/requests",
                icon: Send,
                permission: "requests.read",
            },
            {
                key: "my_requests",
                label: "Yêu cầu của tôi",
                path: "/requests/my",
                icon: Inbox,
                // Dung chung permission "dashboard.read" - moi nhan vien dang
                // nhap deu co the la nguoi nhan yeu cau, khong gioi han theo
                // requests.read (chi nguoi gui/quan tri moi can quyen do).
                permission: "dashboard.read",
            },
            {
                key: "reports",
                label: "Báo cáo",
                path: "/reports",
                icon: BarChart3,
                permission: "reports.read",
            },
        ],
    },
    {
        key: "documents",
        label: "Quản lý tài liệu",
        icon: FileText,
        items: [
            {
                key: "document_types",
                label: "Danh mục giấy tờ",
                path: "/document-types",
                icon: FileCheck2,
                permission: "document_types.read",
            },
            {
                key: "files",
                label: "Biểu mẫu & tệp tin",
                path: "/files",
                icon: FileText,
                permission: "files.read",
            },
            {
                key: "correspondence_types",
                label: "Loại văn bản",
                path: "/correspondence-types",
                icon: FileSignature,
                permission: "correspondence_types.read",
            },
        ],
    },
    {
        key: "communication",
        label: "Truyền thông",
        icon: Megaphone,
        items: [
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
                key: "correspondences",
                label: "Văn bản",
                path: "/correspondences",
                icon: FileSignature,
                permission: "correspondences.read",
            },
            {
                key: "surveys",
                label: "Khảo sát",
                path: "/surveys",
                icon: ClipboardList,
                permission: "surveys.read",
            },
        ],
    },
    {
        key: "finance",
        label: "Tài chính",
        icon: Wallet,
        items: [
            {
                key: "finance",
                label: "Tài chính",
                path: "/finance",
                icon: Wallet,
                permission: "finance.read",
            },
        ],
    },
    {
        key: "administration",
        label: "Quản trị hệ thống",
        icon: ShieldCheck,
        items: [
            {
                key: "users",
                label: "Người dùng & vai trò",
                path: "/users",
                icon: UserCog,
                permission: "users.read",
            },
            {
                key: "create_house_owner",
                label: "Tạo tài khoản chủ hộ",
                path: "/users/new-house-owner",
                icon: UserPlus,
                permission: "users.create",
            },
            {
                key: "roles",
                label: "Vai trò & phân quyền",
                path: "/roles",
                icon: KeyRound,
                permission: "roles.read",
            },
            {
                key: "change_requests",
                label: "Yêu cầu thay đổi",
                path: "/change-requests",
                icon: ClipboardCheck,
                permission: "change_requests.read",
            },
            {
                key: "settings",
                label: "Cài đặt",
                path: "/settings",
                icon: Settings,
                permission: "settings.read",
            },
            {
                key: "mini_app_features",
                label: "Tính năng Mini App",
                path: "/mini-app-features",
                icon: ListOrdered,
                permission: "settings.read",
            },
            {
                key: "audit_logs",
                label: "Nhật ký hệ thống",
                path: "/audit-logs",
                icon: History,
                permission: "audit.read",
            },
        ],
    },
];

// Danh sach phang - giu lai de cac noi dang dung MODULES (vd DashboardPage
// shortcut cards) khong phai doi gi.
export const MODULES: ModuleItem[] = [
    ...TOP_LEVEL_MODULES,
    ...MODULE_GROUPS.flatMap(g => g.items),
];
