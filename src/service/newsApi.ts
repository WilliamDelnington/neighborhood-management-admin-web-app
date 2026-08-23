import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { LoaiTinTuc, News, PaginatedData } from "@dts";
import { request } from "./request";

export interface NewsInput {
    title: string;
    content: string;
    category?: LoaiTinTuc;
    pinned?: boolean;
}

export const fetchAdminNews = (
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    status: News["status"] | undefined = undefined,
): Promise<PaginatedData<News>> =>
    request<PaginatedData<News>>("GET", API.NEWS, {
        page,
        limit,
        status,
        admin: 1,
    });

// Can gui token de backend nhan dien la nhan vien (news.read) va cho xem ca
// tin nhap - giong ly do o fetchAnnouncementDetail.
export const fetchNewsDetail = (id: string): Promise<News> =>
    request<News>("GET", `${API.NEWS}/${id}`);

export const createNews = (input: NewsInput): Promise<News> =>
    request<News>("POST", API.NEWS, input);

export const updateNews = (
    id: string,
    input: Partial<NewsInput>,
): Promise<News> => request<News>("PATCH", `${API.NEWS}/${id}`, input);

export const publishNews = (id: string): Promise<News> =>
    request<News>("POST", `${API.NEWS}/${id}/publish`);

export const deleteNews = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.NEWS}/${id}`);

export const uploadNewsImage = (
    id: string,
    file: File,
    isCover: boolean,
): Promise<News> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isCover", String(isCover));
    return request<News>("POST", `${API.NEWS}/${id}/images`, formData);
};

export const deleteNewsImage = (id: string, url: string): Promise<News> =>
    request<News>(
        "DELETE",
        `${API.NEWS}/${id}/images?url=${encodeURIComponent(url)}`,
    );
