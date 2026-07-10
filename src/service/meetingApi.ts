import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { Meeting, MeetingRegistration, PaginatedData } from "@dts";
import { request } from "./request";

export interface MeetingInput {
    title: string;
    startTime: string;
    location: string;
    content: string;
    minutes?: string;
    attachments?: string[];
    published: boolean;
}

export const fetchMeetings = (
    upcomingOnly?: boolean,
): Promise<PaginatedData<Meeting>> =>
    request<PaginatedData<Meeting>>(
        "GET",
        API.MEETINGS,
        { upcomingOnly },
        { useAuth: false },
    );

export const fetchMeetingDetail = (id: string): Promise<Meeting> =>
    request<Meeting>("GET", `${API.MEETINGS}/${id}`, undefined, {
        useAuth: false,
    });

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
