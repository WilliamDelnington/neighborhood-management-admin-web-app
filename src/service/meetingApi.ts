import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    AnnouncementAttachment,
    AuditLogRecord,
    Meeting,
    MeetingRegistration,
    PaginatedData,
} from "@dts";
import { request } from "./request";

export interface MeetingInput {
    title: string;
    startTime: string;
    location: string;
    content: string;
    minutes?: string;
    published: boolean;
    eligibleAll?: boolean;
    eligibleRoles?: string[];
    eligibleStreetIds?: string[];
    eligibleNeighborhoodIds?: string[];
    eligibleBusinessTypeIds?: string[];
}

// admin:1 (+ token mac dinh, khong con useAuth:false) - de MeetingListPage
// (staff, sau AdminGuard) thay CA cuoc hop chua dang (ban nhap), giong het
// fetchAdminAnnouncements. Thieu co nay, danh sach chi tra ve cuoc hop da
// dang (publicOnly=true) - cuoc hop vua tao (mac dinh chua dang) se khong
// hien ra trong danh sach quan tri, dung nhu bao cao cua nguoi dung.
export const fetchMeetings = (
    upcomingOnly?: boolean,
): Promise<PaginatedData<Meeting>> =>
    request<PaginatedData<Meeting>>("GET", API.MEETINGS, {
        upcomingOnly,
        admin: 1,
    });

// KHONG dung useAuth:false - ham nay chi duoc goi tu man soan/sua cuoc hop
// trong admin web app (luon da dang nhap, sau AdminGuard), can gui token de
// backend nhan dien la nhan vien (meetings.read) va cho xem CA cuoc hop chua
// dang (ban nhap) - xem GET /api/meetings/[id] (isStaff qua requireUser).
// Thieu token khien backend luon coi la khach an danh (publicOnly=true), nen
// cuoc hop vua tao (mac dinh published=false) bao 404 ngay sau khi tao xong.
export const fetchMeetingDetail = (id: string): Promise<Meeting> =>
    request<Meeting>("GET", `${API.MEETINGS}/${id}`);

export const createMeeting = (input: MeetingInput): Promise<Meeting> =>
    request<Meeting>("POST", API.MEETINGS, input);

export const updateMeeting = (
    id: string,
    input: Partial<MeetingInput>,
): Promise<Meeting> =>
    request<Meeting>("PATCH", `${API.MEETINGS}/${id}`, input);

export const fetchMeetingRegistrations = (
    id: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
): Promise<PaginatedData<MeetingRegistration>> =>
    request<PaginatedData<MeetingRegistration>>(
        "GET",
        `${API.MEETINGS}/${id}/register`,
        { page, limit },
    );

export const fetchMeetingAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.MEETINGS}/${id}/audit-logs`,
        params,
    );

export const fetchMeetingAttachments = (
    id: string,
): Promise<AnnouncementAttachment[]> =>
    request<AnnouncementAttachment[]>(
        "GET",
        `${API.MEETINGS}/${id}/attachments`,
    );

export const uploadMeetingAttachment = (
    id: string,
    file: File,
): Promise<AnnouncementAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<AnnouncementAttachment>(
        "POST",
        `${API.MEETINGS}/${id}/attachments`,
        formData,
    );
};

export const deleteMeetingAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>("DELETE", `${API.MEETINGS}/${id}/attachments/${fileId}`);
