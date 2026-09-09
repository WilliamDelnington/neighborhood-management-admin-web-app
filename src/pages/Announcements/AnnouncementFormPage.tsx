import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    FileText,
    Info,
    Loader2,
    Maximize2,
    Paperclip,
    Pin,
    Send,
    Siren,
    SlidersHorizontal,
    Star,
    Trash2,
    Users,
    UploadCloud,
    X,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/ui/card";
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
import FilePreviewDialog, {
    FilePreviewContent,
    PreviewSource,
} from "@components/admin/FilePreviewDialog";
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

// Header dung chung cho tung khoi (Card) - dong bo bo cuc voi cac form khac
// (Soan van ban, Them tin tuc...): icon tron + tieu de + mo ta ngan.
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
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewSource, setPreviewSource] = useState<PreviewSource | null>(
        null,
    );

    // Chua co thong bao (chua co id) khong the goi API dinh kem ngay (can id
    // that su) - file chon o man tao moi duoc giu tam o day, roi tai len ngay
    // sau khi createAnnouncement() thanh cong. Cung mau voi CorrespondenceFormPage.
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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

    // publishAfter=true dung cho nut "Dang ngay"/"Dang thong bao" - luu (hoac
    // tao moi) roi dang luon trong 1 lan bam, khong bat buoc phai luu nhap
    // truoc nhu truoc day.
    const handleSubmit = async (publishAfter: boolean) => {
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
        const setLoadingState = publishAfter ? setPublishing : setSaving;
        try {
            setLoadingState(true);
            if (isEdit && id) {
                await updateAnnouncement(id, input);
                if (publishAfter) {
                    await publishAnnouncement(id);
                    toast.success("Đã đăng thông báo tới người dân");
                } else {
                    toast.success("Đã cập nhật thông báo");
                }
                navigate("/announcements");
                return;
            }

            const created = await createAnnouncement(input);
            // Tai len ngay cac file da chon o man tao (neu co) - chi co the
            // goi API dinh kem SAU khi da co id that su.
            if (pendingFiles.length > 0) {
                const results = await Promise.allSettled(
                    pendingFiles.map(file =>
                        uploadAnnouncementAttachment(created._id, file),
                    ),
                );
                const failures = results.filter(
                    r => r.status === "rejected",
                ).length;
                if (failures > 0) {
                    toast.error(
                        `Đã tạo thông báo nhưng ${failures} tệp đính kèm tải lên thất bại - vui lòng thử lại ở bước tiếp theo`,
                    );
                }
            }
            if (publishAfter) {
                await publishAnnouncement(created._id);
                toast.success("Đã tạo và đăng thông báo tới người dân");
                navigate("/announcements");
            } else {
                toast.success("Đã tạo thông báo (bản nháp)");
                navigate(`/announcements/${created._id}/edit`);
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
            setPublishing(false);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFile = async (file: File) => {
        if (!id) {
            setPendingFiles(prev => [...prev, file]);
            return;
        }
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

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) handleFile(file);
    };

    const handleRemovePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDropzoneDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDropzoneDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDropzoneDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
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
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/announcements")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {isEdit ? "Sửa thông báo" : "Thêm thông báo"}
                        </h1>
                        <p className="text-sm text-text_2">
                            Soạn nội dung, chọn đối tượng nhận và đăng tới cư
                            dân.
                        </p>
                    </div>
                </div>
                {canManage && (
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            size="lg"
                            variant="outline"
                            loading={saving}
                            onClick={() => handleSubmit(false)}
                        >
                            {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                        </Button>
                        {canPublish &&
                            (!isEdit || status === "nhap") && (
                                <Button
                                    size="lg"
                                    loading={publishing}
                                    onClick={() => handleSubmit(true)}
                                >
                                    <Send className="mr-1.5 h-4 w-4" />
                                    {isEdit ? "Đăng thông báo" : "Đăng ngay"}
                                </Button>
                            )}
                    </div>
                )}
            </div>

            {isEdit && loading && (
                <Card className="p-6">
                    <LoadingState />
                </Card>
            )}
            {isEdit && !loading && loadError && (
                <Card className="p-6">
                    <ErrorState onRetry={loadDetail} />
                </Card>
            )}

            {(!isEdit || (!loading && !loadError)) && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="flex flex-col gap-4">
                        <Card>
                            <SectionHeader
                                icon={<FileText className="h-4 w-4" />}
                                title="Nội dung thông báo"
                                description="Tiêu đề và nội dung sẽ hiển thị cho cư dân."
                            />
                            <CardContent className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Tiêu đề</Label>
                                    <Input
                                        placeholder="Nhập tiêu đề thông báo"
                                        value={title}
                                        onChange={e =>
                                            setTitle(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Nội dung</Label>
                                    <Textarea
                                        placeholder="Nội dung thông báo"
                                        rows={8}
                                        value={content}
                                        onChange={e =>
                                            setContent(e.target.value)
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <SectionHeader
                                icon={
                                    <SlidersHorizontal className="h-4 w-4" />
                                }
                                title="Tùy chọn hiển thị"
                            />
                            <CardContent className="flex flex-col gap-4">
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
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="priority"
                                        className="flex items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm"
                                    >
                                        <Checkbox
                                            id="priority"
                                            checked={priority}
                                            onCheckedChange={checked =>
                                                setPriority(checked === true)
                                            }
                                        />
                                        <Star className="h-3.5 w-3.5 text-amber-500" />
                                        Thông báo ưu tiên
                                    </label>
                                    <label
                                        htmlFor="pinned"
                                        className="flex items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm"
                                    >
                                        <Checkbox
                                            id="pinned"
                                            checked={pinned}
                                            onCheckedChange={checked =>
                                                setPinned(checked === true)
                                            }
                                        />
                                        <Pin className="h-3.5 w-3.5 text-text_2" />
                                        Ghim lên đầu danh sách
                                    </label>
                                    <label
                                        htmlFor="isUrgent"
                                        className="flex items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm"
                                    >
                                        <Checkbox
                                            id="isUrgent"
                                            checked={isUrgent}
                                            onCheckedChange={checked =>
                                                setIsUrgent(checked === true)
                                            }
                                        />
                                        <Siren className="h-3.5 w-3.5 text-red-500" />
                                        Thông báo khẩn cấp
                                    </label>
                                    <label
                                        htmlFor="audienceAll"
                                        className="flex items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm"
                                    >
                                        <Checkbox
                                            id="audienceAll"
                                            checked={audienceAll}
                                            onCheckedChange={checked =>
                                                setAudienceAll(
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Users className="h-3.5 w-3.5 text-text_2" />
                                        Gửi tới toàn bộ người dân
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {!audienceAll && (
                            <Card>
                                <SectionHeader
                                    icon={<Users className="h-4 w-4" />}
                                    title="Đối tượng nhận"
                                    description="Chọn tổ dân phố và/hoặc người dùng cụ thể."
                                />
                                <CardContent className="flex flex-col gap-4">
                                    <div>
                                        <Label className="mb-1.5 block">
                                            Theo tổ dân phố
                                        </Label>
                                        <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {neighborhoods.map(n => (
                                                <label
                                                    key={n._id}
                                                    className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-ng_10"
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
                                                    <span className="truncate">
                                                        {n.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Người dùng cụ thể
                                        </Label>
                                        <Input
                                            placeholder="Tìm theo tên hoặc số điện thoại..."
                                            value={userSearch}
                                            onChange={e =>
                                                setUserSearch(e.target.value)
                                            }
                                        />
                                        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-divider_01">
                                            {searchingUsers && (
                                                <LoadingState />
                                            )}
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
                                                        onClick={() =>
                                                            addUser(u)
                                                        }
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
                                                                removeUser(
                                                                    u.id,
                                                                )
                                                            }
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 lg:col-span-2 lg:sticky lg:top-4 lg:h-fit">
                        <Card>
                            <SectionHeader
                                icon={<Paperclip className="h-4 w-4" />}
                                title="Tệp đính kèm"
                                description={
                                    !isEdit
                                        ? "Tệp chọn ở đây sẽ được tải lên ngay sau khi lưu."
                                        : undefined
                                }
                            />
                            <CardContent className="flex flex-col gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    onChange={handleFileSelected}
                                />
                                {isEdit && attachmentsLoading && (
                                    <LoadingState />
                                )}
                                {canManage && (
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={handleUploadClick}
                                        onDragOver={handleDropzoneDragOver}
                                        onDragLeave={handleDropzoneDragLeave}
                                        onDrop={handleDropzoneDrop}
                                        className={`flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                                            isDragOver
                                                ? "border-primary bg-blue_10"
                                                : "border-divider_01 hover:border-primary hover:bg-ng_10"
                                        }`}
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-text_2" />
                                        ) : (
                                            <UploadCloud className="h-6 w-6 text-text_2" />
                                        )}
                                        <p className="text-sm">
                                            <span className="font-medium text-primary">
                                                Bấm để chọn tệp
                                            </span>{" "}
                                            hoặc kéo thả vào đây
                                        </p>
                                        <p className="text-xs text-text_2">
                                            PDF, Word (.doc, .docx), ảnh
                                            (.jpg, .png)
                                        </p>
                                    </button>
                                )}

                                {isEdit &&
                                    !attachmentsLoading &&
                                    attachments.length === 0 &&
                                    !canManage && (
                                        <EmptyState label="Chưa có file đính kèm" />
                                    )}

                                <div className="flex flex-col gap-4">
                                    {isEdit &&
                                        !attachmentsLoading &&
                                        attachments.map(a => (
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
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            title="Xem lớn hơn"
                                                            onClick={() =>
                                                                setPreviewSource(
                                                                    {
                                                                        kind: "url",
                                                                        name: a.name,
                                                                        url: resolveAssetUrl(
                                                                            a.url,
                                                                        ),
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Maximize2 className="h-3.5 w-3.5" />
                                                        </Button>
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
                                                </div>
                                                <FilePreviewContent
                                                    source={{
                                                        kind: "url",
                                                        name: a.name,
                                                        url: resolveAssetUrl(
                                                            a.url,
                                                        ),
                                                    }}
                                                    className="mt-2 h-[55vh]"
                                                />
                                            </div>
                                        ))}
                                    {!isEdit &&
                                        pendingFiles.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="rounded-lg border border-divider_01 p-3"
                                            >
                                                <div className="flex items-center justify-between gap-2 text-sm">
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate font-medium">
                                                            {file.name}
                                                        </span>
                                                    </span>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            title="Xem lớn hơn"
                                                            onClick={() =>
                                                                setPreviewSource(
                                                                    {
                                                                        kind: "file",
                                                                        name: file.name,
                                                                        file,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Maximize2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="!text-red-500"
                                                            onClick={() =>
                                                                handleRemovePendingFile(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <FilePreviewContent
                                                    source={{
                                                        kind: "file",
                                                        name: file.name,
                                                        file,
                                                    }}
                                                    className="mt-2 h-[55vh]"
                                                />
                                            </div>
                                        ))}
                                </div>

                                {!isEdit && (
                                    <div className="flex items-start gap-2 rounded-lg bg-ng_10 p-2.5 text-xs text-text_2">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            Trước đây phải lưu bản nháp trước
                                            mới đính kèm được file - giờ chọn
                                            file ngay tại đây, hệ thống sẽ tự
                                            tải lên khi bạn lưu hoặc đăng.
                                        </span>
                                    </div>
                                )}
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

export default AnnouncementFormPage;
