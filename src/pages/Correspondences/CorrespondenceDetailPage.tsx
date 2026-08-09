import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Paperclip } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import {
    LoadingState,
    ErrorState,
    EmptyState,
} from "@components/admin/DataStates";
import { resolveAssetUrl } from "@constants/common";
import {
    AnnouncementAttachment,
    AppError,
    Correspondence,
    CorrespondenceReply,
    CorrespondenceType,
} from "@dts";
import {
    fetchCorrespondenceAttachments,
    fetchCorrespondenceDetail,
    fetchCorrespondenceReplies,
    createCorrespondenceReply,
} from "@service/correspondenceApi";

const CorrespondenceDetailPage: React.FC = () => (
    <AdminGuard permissions={["correspondences.read"]}>
        <CorrespondenceDetailContent />
    </AdminGuard>
);

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const CorrespondenceDetailContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const canReply = usePermission("correspondences.reply");

    const [doc, setDoc] = useState<Correspondence | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
        [],
    );
    const [replies, setReplies] = useState<CorrespondenceReply[]>([]);
    const [repliesLoading, setRepliesLoading] = useState(true);
    const [replyContent, setReplyContent] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchCorrespondenceDetail(id)
            .then(setDoc)
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));

        fetchCorrespondenceAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]));

        setRepliesLoading(true);
        fetchCorrespondenceReplies(id)
            .then(setReplies)
            .catch(() => setReplies([]))
            .finally(() => setRepliesLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleReply = async () => {
        if (!id || !replyContent.trim()) return;
        try {
            setSendingReply(true);
            const reply = await createCorrespondenceReply(
                id,
                replyContent.trim(),
            );
            setReplies(prev => [...prev, reply]);
            setReplyContent("");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSendingReply(false);
        }
    };

    const typeName =
        doc && typeof doc.correspondenceTypeId !== "string"
            ? (doc.correspondenceTypeId as CorrespondenceType).name
            : "";

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/correspondences")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Chi tiết văn bản</h1>
            </div>

            <div className="max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                {loading && <LoadingState />}
                {!loading && loadError && <ErrorState onRetry={load} />}
                {!loading && !loadError && doc && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Badge tone="blue">{typeName}</Badge>
                            {doc.documentNumber && (
                                <span className="text-xs font-medium text-text_2">
                                    {doc.documentNumber}
                                </span>
                            )}
                            {doc.isUrgent && <Badge tone="red">Khẩn</Badge>}
                        </div>
                        <h2 className="text-base font-semibold">
                            {doc.title}
                        </h2>
                        <p className="whitespace-pre-wrap text-sm text-text_1">
                            {doc.content}
                        </p>
                        <div className="text-xs text-text_2">
                            Ban hành ngày{" "}
                            {new Date(doc.issuedAt).toLocaleDateString(
                                "vi-VN",
                            )}
                            {doc.sentAt &&
                                ` · Gửi ngày ${formatDateTime(doc.sentAt)}`}
                        </div>

                        <div className="border-t border-divider_01 pt-4">
                            <h3 className="mb-2 text-sm font-semibold">
                                Tệp đính kèm
                            </h3>
                            {attachments.length === 0 && (
                                <EmptyState label="Không có file đính kèm" />
                            )}
                            {attachments.map(a => (
                                <a
                                    key={a._id}
                                    href={resolveAssetUrl(a.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 border-b border-divider_01 py-2 text-sm text-primary last:border-0 hover:underline"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    {a.name}
                                </a>
                            ))}
                        </div>

                        <div className="border-t border-divider_01 pt-4">
                            <h3 className="mb-2 text-sm font-semibold">
                                Phản hồi
                            </h3>
                            {repliesLoading && <LoadingState />}
                            {!repliesLoading && replies.length === 0 && (
                                <EmptyState label="Chưa có phản hồi nào" />
                            )}
                            <div className="flex flex-col gap-3">
                                {replies.map(r => {
                                    const actor =
                                        typeof r.actorId === "string"
                                            ? null
                                            : r.actorId;
                                    return (
                                        <div
                                            key={r._id}
                                            className="rounded-lg bg-ng_10 px-3 py-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">
                                                    {actor?.displayName ||
                                                        "Người dùng"}
                                                </span>
                                                <span className="text-xs text-text_3">
                                                    {formatDateTime(
                                                        r.createdAt,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-sm">
                                                {r.content}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {canReply && (
                                <div className="mt-3 flex flex-col gap-2">
                                    <Textarea
                                        placeholder="Nhập phản hồi..."
                                        rows={3}
                                        value={replyContent}
                                        onChange={e =>
                                            setReplyContent(e.target.value)
                                        }
                                    />
                                    <Button
                                        loading={sendingReply}
                                        disabled={!replyContent.trim()}
                                        onClick={handleReply}
                                    >
                                        Gửi phản hồi
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorrespondenceDetailPage;
