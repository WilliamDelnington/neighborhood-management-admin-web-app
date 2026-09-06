export const BASE_URL = import.meta.env.VITE_BASE_URL;

// File dinh kem (FileAsset) duoc backend luu duong dan tuong doi (vd
// "/uploads/houses/<id>/<file>.pdf"). Trinh duyet phai mo o goc BASE_URL (noi
// Next.js serve thu muc public/uploads) chu khong phai goc cua chinh SPA nay,
// neu khong se roi vao route catch-all cua react-router va bi redirect ve "/".
export function resolveAssetUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return new URL(url, BASE_URL || window.location.origin).toString();
}

export const API = {
    AUTH_LOGIN: "/api/auth/login",
    AUTH_ME: "/api/auth/me",
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_SET_PASSWORD: "/api/auth/set-password",

    USERS: "/api/users",
    USERS_ASSIGNABLE_STAFF: "/api/users/assignable-staff",
    USERS_SEARCH_RESIDENTS: "/api/users/search-residents",
    ROLES: "/api/roles",
    ROLES_PERMISSIONS: "/api/roles/permissions",
    ROLES_ASSIGN: "/api/roles/assign",
    ROLES_REVOKE: "/api/roles/revoke",

    HOUSES: "/api/houses",
    HOUSES_CHECK_OWNER_PHONE: "/api/houses/check-owner-phone",
    HOUSES_GIS_OVERVIEW: "/api/houses/gis-overview",
    HOUSES_BULK_NEIGHBORHOOD: "/api/houses/bulk-neighborhood",
    HOUSES_BULK_STATUS: "/api/houses/bulk-status",
    ADMINISTRATIVE_DIVISIONS_PROVINCES: "/api/administrative-divisions/provinces",
    ADMINISTRATIVE_DIVISIONS_WARDS: "/api/administrative-divisions/wards",
    WARD_MANAGERS: "/api/wards/managers",
    ORGANIZATIONS: "/api/organizations",
    HOUSEHOLDS: "/api/households",
    NEIGHBORHOODS: "/api/neighborhoods",
    STREETS: "/api/streets",
    INFRASTRUCTURE_ASSETS: "/api/infrastructure-assets",
    PERIODIC_REPORTS: "/api/periodic-reports",
    KPI_DEFINITIONS: "/api/kpi-definitions",
    KPIS: "/api/kpis",
    CITIZENS: "/api/citizens",
    BUSINESS_TYPES: "/api/business-types",
    BUSINESSES: "/api/businesses",
    COMPANIES: "/api/companies",
    USAGE_UNITS: "/api/usage-units",
    DOCUMENT_TYPES: "/api/document-types",

    COMPLAINTS: "/api/complaints",
    COMPLAINT_TYPES: "/api/complaint-types",
    SUPPORT_TICKETS: "/api/support-tickets",

    ANNOUNCEMENTS: "/api/announcements",
    NEWS: "/api/news",
    CORRESPONDENCE_TYPES: "/api/correspondence-types",
    CORRESPONDENCES: "/api/correspondences",
    CHANGE_REQUESTS: "/api/change-requests",
    MEETINGS: "/api/meetings",
    SURVEYS: "/api/surveys",

    PCCC: "/api/pccc",
    SECURITY: "/api/security",
    RESIDENTS: "/api/residents",
    REQUESTS: "/api/requests",
    REQUESTS_META: "/api/requests/meta",
    REQUESTS_MY: "/api/requests/my",
    REQUEST_TYPES: "/api/request-types",
    APPOINTMENT_SERVICES: "/api/appointment-services",
    APPOINTMENTS: "/api/appointments",
    APPOINTMENT_HOLIDAYS: "/api/appointment-holidays",
    INSPECTION_CAMPAIGNS: "/api/v1/neighborhood/inspection-campaigns",
    INSPECTIONS_V1: "/api/v1",

    FINANCE: "/api/finance",
    FILES: "/api/files",
    UTILITY_APPS: "/api/utility-apps",
    SETTINGS: "/api/settings",
    INTEGRATION_READINESS: "/api/integrations/readiness",

    REPORTS: "/api/reports",
    IMPORT: "/api/import",
    EXPORT: "/api/export",

    AUDIT_LOGS: "/api/audit-logs",

    NOTIFICATIONS: "/api/notifications",
    NOTIFICATIONS_UNREAD_COUNT: "/api/notifications/unread-count",
    NOTIFICATIONS_READ_ALL: "/api/notifications/read-all",
};

export const DEFAULT_PAGE_SIZE = 10;
