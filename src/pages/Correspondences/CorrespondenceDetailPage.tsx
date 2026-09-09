import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    Hash,
    Maximize2,
    Paperclip,
    Send,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/ui/card";
import {
    LoadingState,
    ErrorState,
    EmptyState,
} from "@components/admin/DataStates";
import FilePreviewDialog, {
    FilePreviewContent,
    PreviewSource,
} from "@components/admin/FilePreviewDialog";
import { resolveAssetUrl } from "@constants/common";
import {
    AnnouncementAttachment,
    Correspondence,
    CorrespondenceType,
} from "@dts";
import {
    fetchCorrespondenceAttachments,
    fetchCorrespondenceDetail,
} from "@service/correspondenceApi";
import { useCorrespondenceBadgeStore } from "@store/correspondenceBadgeStore";

const CorrespondenceDetailPage: React.FC = () => (
    <AdminGuard permissions={["correspondences.read"]}>
        <CorrespondenceDetailContent />
    </AdminGuard>
);

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

// Header dung chung cho tung khoi (Card) - dong bo bo cuc voi trang Soan van
// ban / Them khao sat (icon tron + tieu de + mo ta ngan).
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue_10 text-primary">
                {icon}
            </div>
            <div>
                <CardTitle className="text-sm">{title}</CardTitle>
                {description && (
                    <CardDescription className="mt-0.5">
                        {description}
                    </CardDescription>
                )}
            </div>
        </div>
        {action}
    </CardHeader>
);

const CorrespondenceDetailContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [doc, setDoc] = useState<Correspondence | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
        [],
    );
    const [previewSource, setPreviewSource] = useState<PreviewSource | null>(
        null,
    );

    const refreshCorrespondenceBadge = useCorrespondenceBadgeStore(
        state => state.refresh,
    );

    const load = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchCorrespondenceDetail(id)
            .then(doc => {
                setDoc(doc);
                // Backend tu danh dau da doc khi GET chi tiet (xem
                // markRelatedNotificationsRead) - chi can dong bo lai badge
                // o menu cho khop, khong phai doi den lan poll tiep theo.
                refreshCorrespondenceBadge();
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));

        fetchCorrespondenceAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const typeName =
        doc && typeof doc.correspondenceTypeId !== "string"
            ? (doc.correspondenceTypeId as CorrespondenceType).name
            : "";

    return (
        <div>
            <div className="mb-5 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/correspondences")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Chi tiết văn bản</h1>
                    <p className="text-sm text-text_2">
                        Nội dung và tệp đính kèm của văn bản.
                    </p>
                </div>
            </div>

            {loading && (
                <Card className="p-6">
                    <LoadingState />
                </Card>
            )}
            {!loading && loadError && (
                <Card className="p-6">
                    <ErrorState onRetry={load} />
                </Card>
            )}

            {!loading && !loadError && doc && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {typeName && (
                                        <Badge tone="blue">{typeName}</Badge>
                                    )}
                                    {doc.documentNumber && (
                                        <Badge
                                            tone="gray"
                                            className="gap-1"
                                        >
                                            <Hash className="h-3 w-3" />
                                            {doc.documentNumber}
                                        </Badge>
                                    )}
                                    {doc.isUrgent && (
                                        <Badge tone="red" className="gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Khẩn
                                        </Badge>
                                    )}
                                </div>

                                <h2 className="mt-3 text-lg font-semibold">
                                    {doc.title}
                                </h2>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-text_1">
                                    {doc.content}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-divider_01 pt-3 text-xs text-text_2">
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        Ban hành ngày{" "}
                                        {new Date(
                                            doc.issuedAt,
                                        ).toLocaleDateString("vi-VN")}
                                    </span>
                                    {doc.sentAt && (
                                        <span className="flex items-center gap-1.5">
                                            <Send className="h-3.5 w-3.5" />
                                            Gửi ngày{" "}
                                            {formatDateTime(doc.sentAt)}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4 lg:col-span-2 lg:sticky lg:top-4 lg:h-fit">
                        <Card>
                            <SectionHeader
                                icon={<Paperclip className="h-4 w-4" />}
                                title="Tệp đính kèm"
                                action={
                                    attachments.length > 0 && (
                                        <Badge tone="blue">
                                            {attachments.length}
                                        </Badge>
                                    )
                                }
                            />
                            <CardContent>
                                {attachments.length === 0 && (
                                    <EmptyState label="Không có file đính kèm" />
                                )}
                                <div className="flex flex-col gap-4">
                                    {attachments.map(a => (
                                        <div
                                            key={a._id}
                                            className="rounded-lg border border-divider_01 p-3"
                                        >
                                            <div className="flex items-center justify-between gap-2 text-sm">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate font-medium">
                                                        {a.name}
                                                    </span>
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    title="Xem lớn hơn"
                                                    onClick={() =>
                                                        setPreviewSource({
                                                            kind: "url",
                                                            name: a.name,
                                                            url: resolveAssetUrl(
                                                                a.url,
                                                            ),
                                                        })
                                                    }
                                                >
                                                    <Maximize2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <FilePreviewContent
                                                source={{
                                                    kind: "url",
                                                    name: a.name,
                                                    url: resolveAssetUrl(
                                                        a.url,
                                                    ),
                                                }}
                                                className="mt-2 h-[65vh]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <FilePreviewDialog
                source={previewSource}
                onOpenChange={open => !open && setPreviewSource(null)}
            />
        </div>
    );
};

export default CorrespondenceDetailPage;
