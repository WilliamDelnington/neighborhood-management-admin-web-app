import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    Announcement,
    AnnouncementAttachment,
    LoaiThongBao,
    PaginatedData,
    Role,
} from "@dts";
import { request } from "./request";

export interface AnnouncementInput {
    title: string;
    content: string;
    category?: LoaiThongBao;
    priority?: boolean;
    pinned?: boolean;
    audienceAll?: boolean;
    targetRoles?: Role[];
    targetClusters?: string[];
    targetUserIds?: string[];
    targetNeighborhoodIds?: string[];
    isUrgent?: boolean;
}

export const fetchAdminAnnouncements = (
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    status: Announcement["status"] | undefined = undefined,
): Promise<PaginatedData<Announcement>> =>
    request<PaginatedData<Announcement>>("GET", API.ANNOUNCEMENTS, {
        page,
        limit,
        status,
        admin: 1,
    });

export const fetchAnnouncementDetail = (id: string): Promise<Announcement> =>
    request<Announcement>("GET", `${API.ANNOUNCEMENTS}/${id}`, undefined, {
        useAuth: false,
    });

export const createAnnouncement = (
    input: AnnouncementInput,
): Promise<Announcement> =>
    request<Announcement>("POST", API.ANNOUNCEMENTS, input);

export const updateAnnouncement = (
    id: string,
    input: Partial<AnnouncementInput>,
): Promise<Announcement> =>
    request<Announcement>("PATCH", `${API.ANNOUNCEMENTS}/${id}`, input);

export const publishAnnouncement = (id: string): Promise<Announcement> =>
    request<Announcement>("POST", `${API.ANNOUNCEMENTS}/${id}/publish`);

export const fetchAnnouncementAttachments = (
    id: string,
): Promise<AnnouncementAttachment[]> =>
    request<AnnouncementAttachment[]>(
        "GET",
        `${API.ANNOUNCEMENTS}/${id}/attachments`,
    );

export const uploadAnnouncementAttachment = (
    id: string,
    file: File,
): Promise<AnnouncementAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<AnnouncementAttachment>(
        "POST",
        `${API.ANNOUNCEMENTS}/${id}/attachments`,
        formData,
    );
};

export const deleteAnnouncementAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>(
        "DELETE",
        `${API.ANNOUNCEMENTS}/${id}/attachments/${fileId}`,
    );
