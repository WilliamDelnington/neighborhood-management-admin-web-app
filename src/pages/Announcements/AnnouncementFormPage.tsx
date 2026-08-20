import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Paperclip, Trash2, Upload, X } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    LoadingState,
    ErrorState,
    EmptyState,
} from "@components/admin/DataStates";
import { LOAI_THONG_BAO_LABEL } from "@constants/domain";
import { resolveAssetUrl } from "@constants/common";
import {
    AnnouncementAttachment,
    AppError,
    LoaiThongBao,
    Neighborhood,
    ResidentSearchResult,
    TrangThaiThongBao,
} from "@dts";
import {
    AnnouncementInput,
    createAnnouncement,
    deleteAnnouncementAttachment,
    fetchAnnouncementAttachments,
    fetchAnnouncementDetail,
    publishAnnouncement,
    updateAnnouncement,
    uploadAnnouncementAttachment,
} from "@service/announcementApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import {
    fetchResidentUsersByIds,
    searchResidentUsers,
} from "@service/userApi";

const AnnouncementFormPage: React.FC = () => (
    <AdminGuard permissions={["announcements.read"]}>
        <AnnouncementFormContent />
    </AdminGuard>
);

const AnnouncementFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canManage = usePermission(
        isEdit ? "announcements.update" : "announcements.create",
    );
    const canPublish = usePermission("announcements.publish");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState<LoaiThongBao>("chung");
    const [priority, setPriority] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [audienceAll, setAudienceAll] = useState(true);
    const [status, setStatus] = useState<TrangThaiThongBao>("nhap");

    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [targetNeighborhoodIds, setTargetNeighborhoodIds] = useState<
        string[]
    >([]);

    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState<ResidentSearchResult[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<ResidentSearchResult[]>(
        [],
    );

    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
        [],
    );
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDetail = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchAnnouncementDetail(id)
            .then(a => {
                setTitle(a.title);
                setContent(a.content);
                setCategory(a.category);
                setPriority(a.priority);
                setPinned(a.pinned);
                setIsUrgent(a.isUrgent || false);
                setAudienceAll(a.audienceAll ?? true);
                setStatus(a.status);
                setTargetNeighborhoodIds(a.targetNeighborhoodIds || []);
                if (a.targetUserIds && a.targetUserIds.length > 0) {
                    fetchResidentUsersByIds(a.targetUserIds)
                        .then(setSelectedUsers)
                        .catch(() => setSelectedUsers([]));
                }
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchAnnouncementAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        fetchNeighborhoods({ limit: 100, active: true })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, []);

    useEffect(() => {
        if (audienceAll) return;
        const timer = setTimeout(() => {
            setSearchingUsers(true);
            searchResidentUsers(userSearch)
                .then(setUserResults)
                .catch(() => setUserResults([]))
                .finally(() => setSearchingUsers(false));
        }, 250);
        // eslint-disable-next-line consistent-return
        return () => clearTimeout(timer);
    }, [userSearch, audienceAll]);

    const toggleNeighborhood = (nId: string) => {
        setTargetNeighborhoodIds(prev =>
            prev.includes(nId)
                ? prev.filter(v => v !== nId)
                : [...prev, nId],
        );
    };

    const addUser = (user: ResidentSearchResult) => {
        setSelectedUsers(prev =>
            prev.some(u => u.id === user.id) ? prev : [...prev, user],
        );
    };

    const removeUser = (userId: string) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Vui lòng nhập tiêu đề và nội dung");
            return;
        }
        const input: AnnouncementInput = {
            title: title.trim(),
            content: content.trim(),
            category,
            priority,
            pinned,
            isUrgent,
            audienceAll,
            targetNeighborhoodIds: audienceAll ? [] : targetNeighborhoodIds,
            targetUserIds: audienceAll
                ? []
                : selectedUsers.map(u => u.id),
        };
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateAnnouncement(id, input);
                toast.success("Đã cập nhật thông báo");
            } else {
                await createAnnouncement(input);
                toast.success("Đã tạo thông báo (bản nháp)");
            }
            navigate("/announcements");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!id) return;
        try {
            setPublishing(true);
            await publishAnnouncement(id);
            toast.success("Đã đăng thông báo tới người dân");
            navigate("/announcements");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setPublishing(false);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !id) return;
        try {
            setUploading(true);
            const asset = await uploadAnnouncementAttachment(id, file);
            setAttachments(prev => [asset, ...prev]);
            toast.success("Đã tải lên file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (fileId: string) => {
        if (!id) return;
        try {
            setDeletingAttachmentId(fileId);
            await deleteAnnouncementAttachment(id, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/announcements")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa thông báo" : "Thêm thông báo"}
                </h1>
            </div>

            <div className="max-w-2xl rounded-lg border border-divider_01 bg-white p-6 shadow-sm">
                {isEdit && loading && <LoadingState />}
                {isEdit && !loading && loadError && (
                    <ErrorState onRetry={loadDetail} />
                )}
                {(!isEdit || (!loading && !loadError)) && (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <Label>Tiêu đề</Label>
                            <Input
                                placeholder="Nhập tiêu đề thông báo"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                placeholder="Nội dung thông báo"
                                rows={6}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Phân loại</Label>
                            <Select
                                value={category}
                                onValueChange={v =>
                                    setCategory(v as LoaiThongBao)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(
                                            LOAI_THONG_BAO_LABEL,
                                        ) as [LoaiThongBao, string][]
                                    ).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="priority"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="priority"
                                    checked={priority}
                                    onCheckedChange={checked =>
                                        setPriority(checked === true)
                                    }
                                />
                                Thông báo ưu tiên
                            </label>
                            <label
                                htmlFor="pinned"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="pinned"
                                    checked={pinned}
                                    onCheckedChange={checked =>
                                        setPinned(checked === true)
                                    }
                                />
                                Ghim lên đầu danh sách
                            </label>
                            <label
                                htmlFor="isUrgent"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="isUrgent"
                                    checked={isUrgent}
                                    onCheckedChange={checked =>
                                        setIsUrgent(checked === true)
                                    }
                                />
                                Thông báo khẩn cấp
                            </label>
                            <label
                                htmlFor="audienceAll"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="audienceAll"
                                    checked={audienceAll}
                                    onCheckedChange={checked =>
                                        setAudienceAll(checked === true)
                                    }
                                />
                                Gửi tới toàn bộ người dân
                            </label>
                        </div>

                        {!audienceAll && (
                            <div className="space-y-4 rounded-lg border border-divider_01 p-3">
                                <div>
                                    <Label>Theo tổ dân phố</Label>
                                    <div className="mt-1.5 grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto">
                                        {neighborhoods.map(n => (
                                            <label
                                                key={n._id}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <Checkbox
                                                    checked={targetNeighborhoodIds.includes(
                                                        n._id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleNeighborhood(
                                                            n._id,
                                                        )
                                                    }
                                                />
                                                {n.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label>Người dùng cụ thể</Label>
                                    <Input
                                        className="mt-1.5"
                                        placeholder="Tìm theo tên hoặc số điện thoại..."
                                        value={userSearch}
                                        onChange={e =>
                                            setUserSearch(e.target.value)
                                        }
                                    />
                                    <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-divider_01">
                                        {searchingUsers && <LoadingState />}
                                        {!searchingUsers &&
                                            userResults.length === 0 && (
                                                <EmptyState label="Không tìm thấy chủ hộ phù hợp" />
                                            )}
                                        {!searchingUsers &&
                                            userResults.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    className="block w-full border-b border-divider_01 px-3 py-2 text-left text-sm last:border-0 hover:bg-ng_10"
                                                    onClick={() => addUser(u)}
                                                >
                                                    {u.displayName}
                                                    {u.phone
                                                        ? ` — ${u.phone}`
                                                        : ""}
                                                </button>
                                            ))}
                                    </div>
                                    {selectedUsers.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {selectedUsers.map(u => (
                                                <span
                                                    key={u.id}
                                                    className="flex items-center gap-1 rounded-full bg-ng_10 px-2.5 py-1 text-xs"
                                                >
                                                    {u.displayName}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeUser(u.id)
                                                        }
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {canManage && (
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <Button loading={saving} onClick={handleSubmit}>
                                    {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                                </Button>
                                {isEdit && status === "nhap" && canPublish && (
                                    <Button
                                        variant="outline"
                                        loading={publishing}
                                        onClick={handlePublish}
                                    >
                                        Đăng thông báo
                                    </Button>
                                )}
                            </div>
                        )}

                        {isEdit && (
                            <div className="mt-2 border-t border-divider_01 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Tệp đính kèm
                                    </h3>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={uploading}
                                            onClick={handleUploadClick}
                                        >
                                            <Upload className="mr-1 h-3.5 w-3.5" />
                                            Tải lên
                                        </Button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        onChange={handleFileSelected}
                                    />
                                </div>
                                {attachmentsLoading && <LoadingState />}
                                {!attachmentsLoading &&
                                    attachments.length === 0 && (
                                        <EmptyState label="Chưa có file đính kèm" />
                                    )}
                                {!attachmentsLoading &&
                                    attachments.map(a => (
                                        <div
                                            key={a._id}
                                            className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                                        >
                                            <a
                                                href={resolveAssetUrl(a.url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-primary hover:underline"
                                            >
                                                <Paperclip className="h-3.5 w-3.5" />
                                                {a.name}
                                            </a>
                                            {canManage && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="!text-red-500"
                                                    loading={
                                                        deletingAttachmentId ===
                                                        a._id
                                                    }
                                                    onClick={() =>
                                                        handleDeleteAttachment(
                                                            a._id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementFormPage;
