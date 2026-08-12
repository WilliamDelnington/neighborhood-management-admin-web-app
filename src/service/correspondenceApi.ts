import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    AnnouncementAttachment,
    Correspondence,
    CorrespondenceReply,
    PaginatedData,
} from "@dts";
import { request } from "./request";

export interface CorrespondenceInput {
    correspondenceTypeId: string;
    documentNumber?: string;
    title: string;
    content: string;
    issuedAt: string;
    isUrgent?: boolean;
    targetNeighborhoodIds?: string[];
    targetUserIds?: string[];
}

export const fetchCorrespondences = (
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    view: "sent" | "received" | undefined = undefined,
    status: Correspondence["status"] | undefined = undefined,
): Promise<PaginatedData<Correspondence>> =>
    request<PaginatedData<Correspondence>>("GET", API.CORRESPONDENCES, {
        page,
        limit,
        view,
        status,
    });

export const fetchCorrespondenceDetail = (id: string): Promise<Correspondence> =>
    request<Correspondence>("GET", `${API.CORRESPONDENCES}/${id}`);

export const createCorrespondence = (
    input: CorrespondenceInput,
): Promise<Correspondence> =>
    request<Correspondence>("POST", API.CORRESPONDENCES, input);

export const updateCorrespondence = (
    id: string,
    input: Partial<Omit<CorrespondenceInput, "correspondenceTypeId">>,
): Promise<Correspondence> =>
    request<Correspondence>("PATCH", `${API.CORRESPONDENCES}/${id}`, input);

export const sendCorrespondence = (id: string): Promise<Correspondence> =>
    request<Correspondence>("POST", `${API.CORRESPONDENCES}/${id}/send`);

export const fetchCorrespondenceAttachments = (
    id: string,
): Promise<AnnouncementAttachment[]> =>
    request<AnnouncementAttachment[]>(
        "GET",
        `${API.CORRESPONDENCES}/${id}/attachments`,
    );

export const uploadCorrespondenceAttachment = (
    id: string,
    file: File,
): Promise<AnnouncementAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<AnnouncementAttachment>(
        "POST",
        `${API.CORRESPONDENCES}/${id}/attachments`,
        formData,
    );
};

export const deleteCorrespondenceAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>(
        "DELETE",
        `${API.CORRESPONDENCES}/${id}/attachments/${fileId}`,
    );

export const fetchCorrespondenceReplies = (
    id: string,
): Promise<CorrespondenceReply[]> =>
    request<CorrespondenceReply[]>(
        "GET",
        `${API.CORRESPONDENCES}/${id}/replies`,
    );

export const createCorrespondenceReply = (
    id: string,
    content: string,
): Promise<CorrespondenceReply> =>
    request<CorrespondenceReply>(
        "POST",
        `${API.CORRESPONDENCES}/${id}/replies`,
        { content },
    );
