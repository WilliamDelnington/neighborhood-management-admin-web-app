import React, { useEffect, useState } from "react";
import mammoth from "mammoth";
import { Download, ExternalLink } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { LoadingState, ErrorState } from "@components/admin/DataStates";

export type PreviewSource =
    | { kind: "url"; name: string; url: string }
    | { kind: "file"; name: string; file: File };

const getExtension = (name: string) =>
    name.split(".").pop()?.toLowerCase() || "";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

/**
 * Voi file cuc bo (chua upload len server), tao mot blob URL de trinh duyet
 * doc truc tiep tu bo nho - khong qua mang nen luon xem duoc ngay, khong phu
 * thuoc CORS. Tu dong thu hoi (revoke) khi doi sang file khac/unmount.
 */
function useObjectUrl(source: PreviewSource | null): string | undefined {
    const [objectUrl, setObjectUrl] = useState<string | undefined>();
    useEffect(() => {
        if (!source || source.kind !== "file") {
            setObjectUrl(undefined);
            return undefined;
        }
        const url = URL.createObjectURL(source.file);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [source]);
    return objectUrl;
}

function useDocxHtml(source: PreviewSource | null, isDocx: boolean) {
    const [docxHtml, setDocxHtml] = useState<string | null>(null);
    const [docxLoading, setDocxLoading] = useState(false);
    const [docxError, setDocxError] = useState(false);

    useEffect(() => {
        if (!source || !isDocx) {
            setDocxHtml(null);
            return;
        }
        setDocxLoading(true);
        setDocxError(false);
        const bufferPromise: Promise<ArrayBuffer> =
            source.kind === "file"
                ? source.file.arrayBuffer()
                : fetch(source.url).then(res => {
                      if (!res.ok) throw new Error("fetch failed");
                      return res.arrayBuffer();
                  });
        bufferPromise
            .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
            .then(result => setDocxHtml(result.value))
            .catch(() => setDocxError(true))
            .finally(() => setDocxLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, isDocx]);

    return { docxHtml, docxLoading, docxError };
}

/**
 * Phan noi dung xem truoc "thuan" (khong co khung Dialog bao quanh) - dung
 * de nhung thang (inline) ngay duoi ten file trong danh sach dinh kem (xem
 * CorrespondenceFormPage), hoac dat ben trong FilePreviewDialog o duoi day
 * khi can xem o dang popup lon hon.
 * - PDF/anh: nhung truc tiep qua iframe/img, khong phu thuoc CORS.
 * - Word .docx: doc bang mammoth (client-side) roi render thanh HTML; voi
 *   file da o server can fetch() nen co the loi neu server chua bat CORS -
 *   se bao loi ro rang thay vi treo im lang.
 * - Word .doc (nhi phan cu) khong the doc bang mammoth - chi bao khong ho
 *   tro, huong dan tai xuong.
 */
export const FilePreviewContent: React.FC<{
    source: PreviewSource;
    className?: string;
}> = ({ source, className = "h-[70vh]" }) => {
    const ext = getExtension(source.name);
    const isPdf = ext === "pdf";
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const isDocx = ext === "docx";
    const isLegacyDoc = ext === "doc";
    const isPreviewable = isPdf || isImage || isDocx;

    const objectUrl = useObjectUrl(source);
    const previewUrl = source.kind === "url" ? source.url : objectUrl;
    const { docxHtml, docxLoading, docxError } = useDocxHtml(source, isDocx);

    return (
        <div
            className={`overflow-y-auto rounded-lg border border-divider_01 bg-ng_10 ${className}`}
        >
            {isPdf && previewUrl && (
                <iframe
                    title={source.name}
                    src={previewUrl}
                    className="h-full min-h-[280px] w-full bg-white"
                />
            )}

            {isImage && previewUrl && (
                <div className="flex justify-center p-4">
                    <img
                        src={previewUrl}
                        alt={source.name}
                        className="max-h-full object-contain"
                    />
                </div>
            )}

            {isDocx && (
                <>
                    {docxLoading && (
                        <div className="p-6">
                            <LoadingState label="Đang tải nội dung..." />
                        </div>
                    )}
                    {!docxLoading && docxError && (
                        <div className="p-6">
                            <ErrorState label="Không tải được nội dung để xem trước (có thể do máy chủ chưa cho phép tải file trực tiếp). Vui lòng tải xuống để xem." />
                        </div>
                    )}
                    {!docxLoading && !docxError && docxHtml && (
                        <div
                            className="doc-preview-content bg-white p-6 text-sm text-text_1"
                            // eslint-disable-next-line react/no-danger -- noi dung docx da duoc mammoth chuyen doi thanh HTML tu file van ban noi bo, khong phai input tu nguoi dung ben ngoai he thong
                            dangerouslySetInnerHTML={{
                                __html: docxHtml,
                            }}
                        />
                    )}
                </>
            )}

            {isLegacyDoc && (
                <div className="p-10 text-center text-sm text-text_2">
                    Định dạng .doc (Word cũ) chưa hỗ trợ xem trước trực tiếp.
                    Vui lòng tải xuống để xem.
                </div>
            )}

            {!isPreviewable && !isLegacyDoc && (
                <div className="p-10 text-center text-sm text-text_2">
                    Không hỗ trợ xem trước định dạng này. Vui lòng tải xuống
                    để xem.
                </div>
            )}
        </div>
    );
};

/**
 * Ban popup (Dialog) cua FilePreviewContent - dung khi khong the/khong muon
 * nhung thang tren trang (vd danh sach nhieu dinh kem trong AttachmentsPanel
 * dung chung cho nhieu module).
 */
const FilePreviewDialog: React.FC<{
    source: PreviewSource | null;
    onOpenChange: (open: boolean) => void;
}> = ({ source, onOpenChange }) => {
    const objectUrl = useObjectUrl(source);
    let previewUrl: string | undefined;
    if (source?.kind === "url") {
        previewUrl = source.url;
    } else if (source?.kind === "file") {
        previewUrl = objectUrl;
    }

    return (
        <Dialog open={!!source} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] w-[95vw] max-w-6xl flex-col">
                <DialogHeader>
                    <DialogTitle className="truncate pr-6">
                        {source?.name}
                    </DialogTitle>
                </DialogHeader>

                {source && (
                    <FilePreviewContent
                        source={source}
                        className="min-h-0 flex-1"
                    />
                )}

                {(previewUrl || source) && (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={source?.kind === "file"}
                            >
                                {source?.kind === "file" ? (
                                    <Download className="mr-1.5 h-4 w-4" />
                                ) : (
                                    <ExternalLink className="mr-1.5 h-4 w-4" />
                                )}
                                {source?.kind === "file"
                                    ? "Tải xuống"
                                    : "Mở tab mới"}
                            </a>
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FilePreviewDialog;
