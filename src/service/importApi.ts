import { API } from "@constants/common";
import { request } from "./request";

export interface ImportRowError {
    row: number;
    message: string;
}

export interface StreetImportPreviewRow {
    name: string;
    code: string;
    active: boolean;
}

export type ImportJobStatus =
    | "awaiting_mapping"
    | "previewing"
    | "validated"
    | "committed"
    | "failed";

export interface ImportJob {
    _id: string;
    type: string;
    status: ImportJobStatus;
    fileName: string;
    totalRows: number;
    validRows: number;
    headers: string[];
    suggestedMapping: Record<string, string>;
    columnMapping: Record<string, string>;
    rowErrors: ImportRowError[];
    previewData: StreetImportPreviewRow[];
    committedCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface StreetColumnMapping {
    name: string;
    code?: string;
    active?: string;
}

export const uploadStreetImportFile = (file: File): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportJob>("POST", `${API.IMPORT}/streets`, formData);
};

export const applyStreetImportMapping = (
    jobId: string,
    mapping: StreetColumnMapping,
): Promise<ImportJob> =>
    request<ImportJob>(
        "PUT",
        `${API.IMPORT}/streets/${jobId}/mapping`,
        mapping,
    );

export const commitStreetImport = (jobId: string): Promise<ImportJob> =>
    request<ImportJob>("POST", `${API.IMPORT}/streets/${jobId}/commit`);
