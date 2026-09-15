import React, { useRef, useState } from "react";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@components/ui/button";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import FilePreviewDialog, {
    PreviewSource,
} from "@components/admin/FilePreviewDialog";
import { resolveAssetUrl } from "@constants/common";
import { FileAsset } from "@dts";

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
};

const uploaderLabel = (uploadedBy: FileAsset["uploadedBy"]) => {
    if (!uploadedBy) return "Không rõ";
    if (typeof uploadedBy === "string") return uploadedBy;
    return uploadedBy.displayName;
};

export interface AttachmentsPanelProps {
    className?: string;
    title?: string;
    attachments: FileAsset[];
    loading: boolean;
    canManage: boolean;
    deletingId?: string | null;
    onDelete?: (fileId: string) => void;
    emptyLabel?: string;
    // Tuy chon: chi truyen khi man nay CHO PHEP tai len truc tiep tu
    // admin-web-app (vd ho so nguoi dung) - cac noi con lai (Nha so/Ho kinh
    // doanh) khong truyen, upload van chi thuc hien qua ung dung Zalo.
    onUpload?: (file: File) => void;
    uploading?: boolean;
    uploadAccept?: string;
}

/**
 * Khu vuc "Tai lieu dinh kem" dung chung cho man chi tiet Nha so / Ho kinh
 * doanh / Nguoi dung - mac dinh chi xem va xoa (upload van chi thuc hien qua
 * ung dung Zalo); truyen `onUpload` de bat them nut tai len truc tiep tu
 * admin-web-app cho cac man ho tro dieu do (xem UserDetailPage.tsx).
 */
const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({
    className = "mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm",
    title = "Tài liệu đính kèm",
    attachments,
    loading,
    canManage,
    deletingId = null,
    onDelete,
    emptyLabel = "Chưa có tài liệu đính kèm",
    onUpload,
    uploading = false,
    uploadAccept = ".jpg,.jpeg,.png,.pdf,.doc,.docx",
}) => {
    const [previewSource, setPreviewSource] = useState<PreviewSource | null>(
        null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file && onUpload) onUpload(file);
    };

    return (
        <div className={className}>
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">{title}</h2>
                {canManage && onUpload && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={uploadAccept}
                            className="hidden"
                            onChange={handleFileSelected}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            loading={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mr-1 h-3.5 w-3.5" />
                            Tải lên
                        </Button>
                    </>
                )}
            </div>
            {loading && <LoadingState />}
            {!loading && attachments.length === 0 && (
                <EmptyState label={emptyLabel} />
            )}
            {!loading &&
                attachments.map(a => (
                    <div
                        key={a._id}
                        className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                    >
                        <button
                            type="button"
                            className="flex min-w-0 items-center gap-2 text-left text-primary hover:underline"
                            onClick={() =>
                                setPreviewSource({
                                    kind: "url",
                                    name: a.name,
                                    url: resolveAssetUrl(a.url),
                                })
                            }
                        >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0">
                                <span className="block truncate">
                                    {a.name}
                                </span>
                                <span className="block text-xs text-text_2">
                                    {uploaderLabel(a.uploadedBy)} •{" "}
                                    {formatDateTime(a.createdAt)}
                                </span>
                            </span>
                        </button>
                        {canManage && onDelete && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="!text-red-500"
                                loading={deletingId === a._id}
                                onClick={() => onDelete(a._id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                ))}

            <FilePreviewDialog
                source={previewSource}
                onOpenChange={open => !open && setPreviewSource(null)}
            />
        </div>
    );
};

export default AttachmentsPanel;
