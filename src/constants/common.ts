export const BASE_URL = import.meta.env.VITE_BASE_URL;

export const API = {
    AUTH_LOGIN: "/api/auth/login",
    AUTH_ME: "/api/auth/me",
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_SET_PASSWORD: "/api/auth/set-password",

    USERS: "/api/users",
    USERS_ASSIGNABLE_STAFF: "/api/users/assignable-staff",
    ROLES: "/api/roles",
    ROLES_PERMISSIONS: "/api/roles/permissions",
    ROLES_ASSIGN: "/api/roles/assign",
    ROLES_REVOKE: "/api/roles/revoke",

    HOUSES: "/api/houses",
    HOUSEHOLDS: "/api/households",
    CITIZENS: "/api/citizens",
    BUSINESS_TYPES: "/api/business-types",
    BUSINESSES: "/api/businesses",

    COMPLAINTS: "/api/complaints",
    SUPPORT_TICKETS: "/api/support-tickets",

    ANNOUNCEMENTS: "/api/announcements",
    MEETINGS: "/api/meetings",
    SURVEYS: "/api/surveys",

    PCCC: "/api/pccc",
    SECURITY: "/api/security",

    FINANCE: "/api/finance",
    FILES: "/api/files",
    SETTINGS: "/api/settings",

    REPORTS: "/api/reports",
    IMPORT: "/api/import",
    EXPORT: "/api/export",

    AUDIT_LOGS: "/api/audit-logs",

    NOTIFICATIONS: "/api/notifications",
    NOTIFICATIONS_UNREAD_COUNT: "/api/notifications/unread-count",
    NOTIFICATIONS_READ_ALL: "/api/notifications/read-all",
};

export const DEFAULT_PAGE_SIZE = 20;
