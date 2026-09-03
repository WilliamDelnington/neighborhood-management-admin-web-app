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
    ShieldCheck,
    Users,
    FileSignature,
    ClipboardCheck,
    Construction,
    Landmark,
    LayoutGrid,
    Link2,
    Tags,
    CalendarClock,
    CalendarCheck,
    CalendarOff,
    Newspaper,
    Contact,
} from "lucide-react";

export type ModuleItem = {
    key: string;
    label: string;
    path: string;
    icon: typeof Home;
    permission: string;
    description?: string;
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
        description: "Tổng quan số liệu và hoạt động của tổ dân phố.",
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
                key: "wards",
                label: "Phường / xã",
                path: "/wards",
                icon: Landmark,
                permission: "wards.manage",
                description:
                    "Quản lý danh sách phường/xã, làm cơ sở phân cấp tổ dân phố và địa chỉ.",
            },
            {
                key: "neighborhoods",
                label: "Tổ dân phố",
                path: "/neighborhoods",
                icon: MapPinned,
                permission: "neighborhoods.read",
                description:
                    "Quản lý các tổ dân phố và cán bộ phụ trách trong từng khu vực.",
            },
            {
                key: "streets",
                label: "Đường / phố",
                path: "/streets",
                icon: MapPinned,
                permission: "streets.read",
                description:
                    "Quản lý danh mục đường/phố dùng để chuẩn hoá địa chỉ nhà số.",
            },
            {
                key: "infrastructure-assets",
                label: "Sổ hạ tầng",
                path: "/infrastructure-assets",
                icon: Construction,
                permission: "infrastructure.read",
                description:
                    "Theo dõi hạ tầng công cộng (đường, cống, đèn chiếu sáng...) trên địa bàn.",
            },
            {
                key: "houses",
                label: "Nhà số",
                path: "/houses",
                icon: Home,
                permission: "houses.read",
                description:
                    "Quản lý thông tin nhà số, chủ nhà và trạng thái xác minh.",
            },
            {
                key: "households",
                label: "Hộ dân",
                path: "/households",
                icon: Users,
                permission: "households.read",
                description:
                    "Xem danh sách các hộ dân đang sinh sống trên địa bàn.",
            },
            {
                key: "citizens",
                label: "Nhân khẩu",
                path: "/citizens",
                icon: Contact,
                permission: "citizens.read",
                description:
                    "Xem danh sách nhân khẩu thuộc các hộ dân trên địa bàn.",
            },
            {
                key: "organizations",
                label: "Tổ chức (chủ sở hữu)",
                path: "/organizations",
                icon: Building2,
                permission: "organizations.read",
                description:
                    "Quản lý các tổ chức đứng tên chủ sở hữu nhà thay vì cá nhân.",
            },
            {
                key: "residents",
                label: "Kiểm tra cư trú",
                path: "/residents",
                icon: Users,
                permission: "residents.read",
                description:
                    "Quản lý kiểm tra cư trú, tạm trú/tạm vắng của cư dân.",
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
                description:
                    "Quản lý hộ kinh doanh đăng ký hoạt động trên địa bàn.",
            },
            {
                key: "companies",
                label: "Công ty",
                path: "/companies",
                icon: Building,
                permission: "companies.read",
                description:
                    "Quản lý công ty/doanh nghiệp đăng ký hoạt động trên địa bàn.",
            },
            {
                key: "business_types",
                label: "Loại hình kinh doanh",
                path: "/business-types",
                icon: Briefcase,
                permission: "business_types.read",
                description:
                    "Quản lý danh mục loại hình kinh doanh áp dụng cho hộ kinh doanh và công ty.",
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
                description:
                    "Tiếp nhận và xử lý phản ánh, kiến nghị của cư dân.",
            },
            {
                key: "complaint_types",
                label: "Loại phản ánh",
                path: "/complaint-types",
                icon: Tags,
                permission: "complaint_types.read",
                description:
                    "Quản lý danh mục loại phản ánh để phân loại và định tuyến xử lý.",
            },
            {
                key: "support_tickets",
                label: "Yêu cầu hỗ trợ",
                path: "/support-tickets",
                icon: LifeBuoy,
                permission: "support_tickets.read",
                description: "Tiếp nhận và xử lý yêu cầu hỗ trợ từ cư dân.",
            },
            {
                key: "pccc",
                label: "PCCC",
                path: "/pccc",
                icon: Flame,
                permission: "pccc.read",
                description:
                    "Quản lý hồ sơ, kiểm tra phòng cháy chữa cháy tại các nhà số/tổ chức.",
            },
            {
                key: "security",
                label: "An ninh",
                path: "/security",
                icon: Shield,
                permission: "security.read",
                description:
                    "Quản lý các vụ việc, hồ sơ liên quan đến an ninh trật tự.",
            },
            {
                key: "requests",
                label: "Yêu cầu công việc",
                path: "/requests",
                icon: Send,
                // "dashboard.read" (khong phai "requests.read") - trang nay gio
                // gop ca tab "Được giao" (Yeu cau cua toi cu, mo cho MOI nhan
                // vien dang nhap, khong rieng nguoi gui/quan tri) va tab "Đã
                // gửi" (rieng cua actor, van yeu cau requests.read/requests.create
                // ben trong tung thao tac). Xem RequestListPage.tsx.
                permission: "dashboard.read",
                description:
                    "Theo dõi và xử lý các yêu cầu công việc được giao trong tổ dân phố.",
            },
            {
                key: "request_types",
                label: "Loại nhiệm vụ & biểu mẫu",
                path: "/request-types",
                icon: ClipboardList,
                permission: "request_types.read",
                description:
                    "Quản lý loại nhiệm vụ và biểu mẫu áp dụng cho yêu cầu công việc.",
            },
            {
                key: "inspections",
                label: "Rà soát – chiến dịch",
                path: "/inspections",
                icon: ClipboardCheck,
                permission: "inspections.read",
                description:
                    "Tổ chức và theo dõi các chiến dịch rà soát, kiểm tra theo đợt.",
            },
            {
                key: "change_requests",
                label: "Yêu cầu thay đổi thông tin",
                path: "/change-requests",
                icon: ClipboardCheck,
                permission: "change_requests.read",
                description:
                    "Duyệt các yêu cầu thay đổi thông tin nhà, hộ khẩu hoặc tài khoản đã xác minh.",
            },
            {
                key: "reports",
                label: "Báo cáo",
                path: "/reports",
                icon: BarChart3,
                permission: "reports.read",
                description: "Xem báo cáo tổng hợp số liệu quản lý theo địa bàn.",
            },
            {
                key: "periodic-reports",
                label: "Báo cáo định kỳ",
                path: "/periodic-reports",
                icon: ClipboardList,
                permission: "reports.author",
                description: "Quản lý báo cáo định kỳ theo lịch của tổ dân phố.",
            },
            {
                key: "kpis",
                label: "KPI Phường",
                path: "/kpis",
                icon: BarChart3,
                permission: "reports.kpi_read",
                description: "Theo dõi chỉ số KPI đánh giá hoạt động của phường.",
            },
        ],
    },
    {
        key: "appointments",
        label: "Đặt lịch hẹn",
        icon: CalendarClock,
        items: [
            {
                key: "appointments",
                label: "Lịch hẹn",
                path: "/appointments",
                icon: CalendarClock,
                permission: "appointments.read",
                description:
                    "Quản lý lịch hẹn làm việc của cư dân với tổ dân phố/phường.",
            },
            {
                key: "appointment_checkin",
                label: "Check-in lịch hẹn",
                path: "/appointments/check-in",
                icon: CalendarCheck,
                permission: "appointments.checkin",
                description:
                    "Check-in cư dân đã đặt lịch hẹn khi đến làm việc.",
            },
            {
                key: "appointment_reports",
                label: "Báo cáo lịch hẹn",
                path: "/appointment-reports",
                icon: BarChart3,
                permission: "appointments.read",
                description: "Xem báo cáo thống kê về lịch hẹn.",
            },
            {
                key: "appointment_services",
                label: "Dịch vụ hẹn lịch",
                path: "/appointment-services",
                icon: ClipboardList,
                permission: "appointments.manage",
                description: "Quản lý danh mục dịch vụ có thể đặt lịch hẹn.",
            },
            {
                key: "appointment_holidays",
                label: "Ngày nghỉ / lễ",
                path: "/appointment-holidays",
                icon: CalendarOff,
                permission: "appointments.manage",
                description:
                    "Khai báo các ngày không tiếp nhận đặt lịch hẹn (lễ, Tết, tạm ngưng đột xuất).",
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
                description: "Quản lý danh mục loại giấy tờ dùng trong hồ sơ.",
            },
            {
                key: "required_document_settings",
                label: "Yêu cầu giấy tờ chung",
                path: "/required-document-settings",
                icon: ClipboardList,
                permission: "houses.update",
                description:
                    "Cấu hình giấy tờ bắt buộc phải nộp theo từng loại đối tượng (nhà, hộ khẩu, doanh nghiệp).",
            },
            {
                key: "files",
                label: "Biểu mẫu & tệp tin",
                path: "/files",
                icon: FileText,
                permission: "files.read",
                description: "Quản lý biểu mẫu và tệp tin dùng chung.",
            },
            {
                key: "correspondence_types",
                label: "Loại văn bản",
                path: "/correspondence-types",
                icon: FileSignature,
                permission: "correspondence_types.read",
                description:
                    "Quản lý loại văn bản và ma trận gửi/nhận áp dụng cho văn bản đi/đến.",
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
                description: "Quản lý lịch và biên bản các cuộc họp.",
            },
            {
                key: "announcements",
                label: "Thông báo",
                path: "/announcements",
                icon: Megaphone,
                permission: "announcements.read",
                description: "Soạn và gửi thông báo đến cư dân.",
            },
            {
                key: "news",
                label: "Tin tức",
                path: "/news",
                icon: Newspaper,
                permission: "news.read",
                description: "Soạn và đăng tin tức tới cư dân.",
            },
            {
                key: "correspondences",
                label: "Văn bản",
                path: "/correspondences",
                icon: FileSignature,
                permission: "correspondences.read",
                description:
                    "Soạn thảo, gửi và theo dõi văn bản qua lại giữa tổ dân phố và phường.",
            },
            {
                key: "surveys",
                label: "Khảo sát",
                path: "/surveys",
                icon: ClipboardList,
                permission: "surveys.read",
                description: "Tạo khảo sát và thu thập ý kiến cư dân.",
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
                description:
                    "Quản lý các khoản thu chi tài chính của tổ dân phố.",
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
                description: "Quản lý tài khoản người dùng và vai trò được gán.",
            },
            {
                key: "create_house_owner",
                label: "Tạo tài khoản",
                path: "/users/new-house-owner",
                icon: UserPlus,
                permission: "users.create",
                description: "Tạo tài khoản chủ nhà mới trong hệ thống.",
            },
            {
                key: "roles",
                label: "Vai trò & phân quyền",
                path: "/roles",
                icon: KeyRound,
                permission: "roles.read",
                description:
                    "Quản lý vai trò và phân quyền truy cập chức năng.",
            },
            {
                key: "settings",
                label: "Cài đặt",
                path: "/settings",
                icon: Settings,
                permission: "settings.read",
                description: "Cấu hình chung của hệ thống.",
            },
            {
                key: "digital_readiness",
                label: "Sẵn sàng tích hợp",
                path: "/digital-readiness",
                icon: ShieldCheck,
                permission: "settings.read",
                description:
                    "Theo dõi mức độ sẵn sàng chuyển đổi số của địa bàn.",
            },
            // Tạm ẩn menu Tính năng Mini App
            // {
            //     key: "mini_app_features",
            //     label: "Tính năng Mini App",
            //     path: "/mini-app-features",
            //     icon: ListOrdered,
            //     permission: "settings.read",
            //     description:
            //         "Quản lý tính năng hiển thị trên Mini App cho cư dân.",
            // },
            {
                key: "audit_logs",
                label: "Nhật ký hệ thống",
                path: "/audit-logs",
                icon: History,
                permission: "audit.read",
                description:
                    "Tra cứu nhật ký thao tác của người dùng trong hệ thống.",
            },
        ],
    },
    {
        key: "services",
        label: "Quản lý dịch vụ",
        icon: LayoutGrid,
        items: [
            {
                key: "utility_apps",
                label: "Nhóm tiện ích",
                path: "/utility-apps",
                icon: Link2,
                permission: "utility_apps.manage",
                description:
                    "Quản lý nhóm tiện ích/dịch vụ tích hợp cho cư dân.",
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

// Tim module co path khop voi mot pathname hien tai (khop dung hoac la tien
// to segment - vd "/requests/my" khop voi module "requests" o "/requests").
// Uu tien path dai nhat neu co nhieu module cung khop (vd "/users/new-house-owner"
// phai khop voi "create_house_owner" chu khong phai "users"). Dung boi
// PageHeader de tu suy ra section_descriptions key ma khong can moi trang tu
// khai bao lai - xem SettingsPage.tsx (SectionDescriptionsPanel).
export function findModuleKeyForPath(pathname: string): string | undefined {
    const matches = MODULES.filter(
        m => pathname === m.path || pathname.startsWith(`${m.path}/`),
    );
    if (matches.length === 0) return undefined;
    return matches.reduce((best, m) =>
        m.path.length > best.path.length ? m : best,
    ).key;
}
