import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
    CalendarClock,
    ClipboardList,
    Home,
    Maximize2,
    MessageSquare,
    Paperclip,
    StickyNote,
    Trash2,
    Upload,
    User,
    Users,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@components/ui/sheet";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import FilePreviewDialog, {
    FilePreviewContent,
    PreviewSource,
} from "@components/admin/FilePreviewDialog";
import RequestRecipientPicker from "@components/admin/RequestRecipientPicker";
import TransferRequestDialog from "@components/admin/TransferRequestDialog";
import { useAuthStore, usePermission } from "@store/authStore";
import { resolveAssetUrl } from "@constants/common";
import {
    REQUEST_PRIORITY_LABEL,
    REQUEST_PRIORITY_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
} from "@constants/domain";
import {
    AppError,
    RequestAttachment,
    RequestComment,
    RequestItem,
    RequestMeta,
} from "@dts";
import {
    confirmRequestRecipient,
    createRequestComment,
    fetchRequestAttachments,
    fetchRequestById,
    fetchRequestComments,
    fetchRequestMeta,
    deleteRequestAttachment,
    initiateRequestTransfer,
    respondToRequestTransfer,
    updateRequest,
    updateRequestFormData,
    uploadRequestAttachment,
} from "@service/requestApi";

export interface RequestDetailSheetProps {
    requestId: string | null;
    onOpenChange: (open: boolean) => void;
    onUpdated?: () => void;
}

const houseText = (h: RequestItem["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const creatorText = (c: RequestItem["createdBy"]) => {
    if (!c) return "Hệ thống";
    if (typeof c === "string") return c;
    return c.displayName;
};

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

// Header dung chung cho tung khoi (Card) - dong bo bo cuc voi
// CorrespondenceDetailPage.tsx/ComplaintDetailPage.tsx (icon tron + tieu de +
// mo ta ngan, action tuy chon o goc phai).
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

const MetaRow: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2 text-sm">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text_2" />
        <span className="w-[110px] shrink-0 text-text_2">{label}</span>
        <span className="min-w-0 flex-1 break-words">{value}</span>
    </div>
);

const RequestDetailSheet: React.FC<RequestDetailSheetProps> = ({
    requestId,
    onOpenChange,
    onUpdated,
}) => {
    const canManage = usePermission("requests.update");
    const currentUserId = useAuthStore(state => state.user?.id);

    const [request, setRequest] = useState<RequestItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState<RequestMeta | null>(null);

    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [savingFormData, setSavingFormData] = useState(false);

    const [addUserIds, setAddUserIds] = useState<string[]>([]);
    const [addRoles, setAddRoles] = useState<string[]>([]);
    const [addingRecipients, setAddingRecipients] = useState(false);
    const [confirmingUserId, setConfirmingUserId] = useState<string | null>(
        null,
    );

    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [initiatingTransfer, setInitiatingTransfer] = useState(false);
    const [respondingTransferRowId, setRespondingTransferRowId] = useState<
        string | null
    >(null);

    const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewSource, setPreviewSource] = useState<PreviewSource | null>(
        null,
    );

    const [comments, setComments] = useState<RequestComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);

    const loadComments = (id: string) => {
        setCommentsLoading(true);
        fetchRequestComments(id)
            .then(setComments)
            .catch(() => setComments([]))
            .finally(() => setCommentsLoading(false));
    };

    const load = (id: string) => {
        setLoading(true);
        fetchRequestById(id)
            .then(r => {
                setRequest(r);
                setNote(r.note || "");
                setFormData(r.formData || {});
            })
            .catch(() => setRequest(null))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchRequestAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));

        loadComments(id);
    };

    useEffect(() => {
        if (!requestId) return;
        load(requestId);
        setAddUserIds([]);
        setAddRoles([]);
        // Chi nguoi quan ly moi dung den meta (danh sach loai/vai tro du dieu
        // kien nhan) de them nguoi nhan - bo qua voi nguoi nhan thuong de
        // tranh goi API ma ho khong co quyen (/api/requests/meta yeu cau
        // requests.create).
        if (canManage) {
            fetchRequestMeta()
                .then(setMeta)
                .catch(() => setMeta(null));
        } else {
            setMeta(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId, canManage]);

    const handleSaveNote = async () => {
        if (!requestId) return;
        try {
            setSavingNote(true);
            const updated = await updateRequest(requestId, { note });
            setRequest(updated);
            toast.success("Đã lưu ghi chú");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingNote(false);
        }
    };

    const handleSaveFormData = async () => {
        if (!requestId) return;
        try {
            setSavingFormData(true);
            const updated = await updateRequestFormData(requestId, formData);
            setRequest(updated);
            setFormData(updated.formData || {});
            toast.success("Đã lưu dữ liệu nghiệp vụ");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingFormData(false);
        }
    };

    const handleAddRecipients = async () => {
        if (!requestId) return;
        if (addUserIds.length === 0 && addRoles.length === 0) {
            toast.error("Vui lòng chọn ít nhất một người nhận để thêm");
            return;
        }
        try {
            setAddingRecipients(true);
            const updated = await updateRequest(requestId, {
                addTargetUserIds: addUserIds,
                addTargetRoles: addRoles,
            });
            setRequest(updated);
            setAddUserIds([]);
            setAddRoles([]);
            toast.success("Đã thêm người nhận");
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAddingRecipients(false);
        }
    };

    const handleConfirmRecipient = async (
        userId: string,
        decision: "resolved" | "in_progress",
    ) => {
        if (!requestId) return;
        try {
            setConfirmingUserId(userId);
            await confirmRequestRecipient(requestId, userId, { decision });
            toast.success(
                decision === "resolved"
                    ? "Đã xác nhận hoàn thành"
                    : "Đã yêu cầu xử lý lại",
            );
            load(requestId);
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setConfirmingUserId(null);
        }
    };

    const handleInitiateTransfer = async (input: {
        toUserId: string;
        reason: string;
    }) => {
        if (!requestId) return;
        try {
            setInitiatingTransfer(true);
            await initiateRequestTransfer(requestId, input);
            toast.success("Đã gửi đề nghị chuyển tiếp yêu cầu");
            setTransferDialogOpen(false);
            load(requestId);
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setInitiatingTransfer(false);
        }
    };

    const handleRespondTransfer = async (
        rowId: string,
        decision: "accept" | "reject",
    ) => {
        if (!requestId) return;
        try {
            setRespondingTransferRowId(rowId);
            await respondToRequestTransfer(requestId, decision);
            toast.success(
                decision === "accept"
                    ? "Đã chấp nhận chuyển tiếp yêu cầu"
                    : "Đã từ chối chuyển tiếp yêu cầu",
            );
            load(requestId);
            onUpdated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRespondingTransferRowId(null);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !requestId) return;
        try {
            setUploading(true);
            const asset = await uploadRequestAttachment(requestId, file);
            setAttachments(prev => [asset, ...prev]);
            toast.success("Đã tải lên file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handlePostComment = async () => {
        if (!requestId || !newComment.trim()) return;
        try {
            setPostingComment(true);
            await createRequestComment(requestId, newComment.trim());
            setNewComment("");
            loadComments(requestId);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteAttachment = async (fileId: string) => {
        if (!requestId) return;
        try {
            setDeletingAttachmentId(fileId);
            await deleteRequestAttachment(requestId, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    const formDefinition = request?.formDefinitionSnapshot;
    const creatorId =
        request?.createdBy && typeof request.createdBy !== "string"
            ? request.createdBy._id
            : request?.createdBy;
    const isCreator = Boolean(currentUserId && creatorId === currentUserId);
    const isRecipient = Boolean(
        currentUserId &&
            request?.recipients.some(recipient => recipient.userId === currentUserId),
    );
    const canEditForm = Boolean(
        formDefinition &&
            (formDefinition.dataEntryMode === "sender"
                ? canManage || isCreator
                : canManage || isCreator || isRecipient),
    );

    const setDynamicField = (key: string, value: unknown) =>
        setFormData(current => ({ ...current, [key]: value }));

    return (
        <Sheet open={!!requestId} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl">
                <SheetHeader>
                    <SheetTitle>Chi tiết yêu cầu</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-5 overflow-y-auto py-4">
                    {loading && <LoadingState />}
                    {!loading && !request && (
                        <EmptyState label="Không tìm thấy yêu cầu" />
                    )}
                    {!loading && request && (
                        <>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base font-semibold">
                                            {request.title}
                                        </h2>
                                        <Badge tone="blue">
                                            {request.formDefinitionSnapshot
                                                ?.name ||
                                                REQUEST_TYPE_LABEL[
                                                    request.type
                                                ] ||
                                                request.type}
                                        </Badge>
                                        <Badge
                                            tone={
                                                REQUEST_PRIORITY_TONE[
                                                    request.priority
                                                ]
                                            }
                                        >
                                            {
                                                REQUEST_PRIORITY_LABEL[
                                                    request.priority
                                                ]
                                            }
                                        </Badge>
                                    </div>
                                    {request.description && (
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-text_1">
                                            {request.description}
                                        </p>
                                    )}
                                    <div className="mt-3 flex flex-col gap-2 border-t border-divider_01 pt-3">
                                        {houseText(request.houseId) && (
                                            <MetaRow
                                                icon={Home}
                                                label="Nhà liên quan"
                                                value={houseText(
                                                    request.houseId,
                                                )}
                                            />
                                        )}
                                        <MetaRow
                                            icon={CalendarClock}
                                            label="Hạn xử lý"
                                            value={
                                                formatDate(request.dueDate) ||
                                                "Chưa đặt"
                                            }
                                        />
                                        <MetaRow
                                            icon={User}
                                            label="Người gửi"
                                            value={creatorText(
                                                request.createdBy,
                                            )}
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                        {request.relatedModel ===
                                            "Complaint" &&
                                            request.relatedId && (
                                            <Link
                                                to={`/complaints/${request.relatedId}`}
                                                className="text-primary hover:underline"
                                            >
                                                Xem phản ánh liên quan
                                            </Link>
                                        )}
                                        <Link
                                            to={`/requests/${request._id}/history`}
                                            className="text-primary hover:underline"
                                        >
                                            Xem lịch sử chỉnh sửa
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <SectionHeader
                                    icon={<Users className="h-4 w-4" />}
                                    title="Người nhận"
                                />
                                <CardContent>
                                <div className="flex flex-col gap-2">
                                    {request.recipients.map(rec => (
                                        <div key={rec._id} className="text-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    tone={
                                                        rec.isOverdue
                                                            ? "red"
                                                            : REQUEST_STATUS_TONE[
                                                                  rec.status
                                                              ]
                                                    }
                                                >
                                                    {rec.displayName} ·{" "}
                                                    {
                                                        REQUEST_STATUS_LABEL[
                                                            rec.status
                                                        ]
                                                    }
                                                </Badge>
                                                {canManage &&
                                                    rec.status ===
                                                        "awaiting_confirmation" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                loading={
                                                                    confirmingUserId ===
                                                                    rec.userId
                                                                }
                                                                onClick={() =>
                                                                    handleConfirmRecipient(
                                                                        rec.userId,
                                                                        "resolved",
                                                                    )
                                                                }
                                                            >
                                                                Xác nhận hoàn
                                                                thành
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                loading={
                                                                    confirmingUserId ===
                                                                    rec.userId
                                                                }
                                                                onClick={() =>
                                                                    handleConfirmRecipient(
                                                                        rec.userId,
                                                                        "in_progress",
                                                                    )
                                                                }
                                                            >
                                                                Yêu cầu xử lý
                                                                lại
                                                            </Button>
                                                        </>
                                                    )}
                                                {currentUserId &&
                                                    rec.userId ===
                                                        currentUserId &&
                                                    rec.status !==
                                                        "resolved" &&
                                                    !rec.transferStatus && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setTransferDialogOpen(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            Chuyển tiếp yêu cầu
                                                        </Button>
                                                    )}
                                                {rec.transferStatus ===
                                                    "pending" &&
                                                    currentUserId &&
                                                    (rec.transferToUserId ===
                                                        currentUserId ||
                                                        isCreator) && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                loading={
                                                                    respondingTransferRowId ===
                                                                    rec._id
                                                                }
                                                                onClick={() =>
                                                                    handleRespondTransfer(
                                                                        rec._id,
                                                                        "accept",
                                                                    )
                                                                }
                                                            >
                                                                Đồng ý nhận
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="!text-red-500"
                                                                loading={
                                                                    respondingTransferRowId ===
                                                                    rec._id
                                                                }
                                                                onClick={() =>
                                                                    handleRespondTransfer(
                                                                        rec._id,
                                                                        "reject",
                                                                    )
                                                                }
                                                            >
                                                                Từ chối
                                                            </Button>
                                                        </>
                                                    )}
                                            </div>
                                            {rec.note && (
                                                <p className="mt-1 pl-1 text-xs text-text_2">
                                                    {rec.note}
                                                </p>
                                            )}
                                            {rec.transferStatus ===
                                                "pending" &&
                                                (canManage ||
                                                    isCreator ||
                                                    rec.userId ===
                                                        currentUserId ||
                                                    rec.transferToUserId ===
                                                        currentUserId) && (
                                                    <p className="mt-1 pl-1 text-xs text-amber-600">
                                                        Đang chờ chuyển cho{" "}
                                                        {rec.transferToDisplayName ||
                                                            "người được đề nghị"}
                                                        {rec.transferReason
                                                            ? ` — Lý do: ${rec.transferReason}`
                                                            : ""}
                                                    </p>
                                                )}
                                        </div>
                                    ))}
                                </div>
                                {canManage && meta && (
                                    <div className="mt-3 rounded-lg border border-divider_01 p-3">
                                        <RequestRecipientPicker
                                            type={request.type}
                                            eligibleRoleKeys={
                                                meta.eligibleRolesByType[
                                                    request.type
                                                ] || []
                                            }
                                            targetUserIds={addUserIds}
                                            targetRoles={addRoles}
                                            onChangeUserIds={setAddUserIds}
                                            onChangeRoles={setAddRoles}
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-3"
                                            loading={addingRecipients}
                                            onClick={handleAddRecipients}
                                        >
                                            Thêm người nhận
                                        </Button>
                                    </div>
                                )}
                                </CardContent>
                            </Card>

                            {formDefinition && formDefinition.fields.length > 0 && (
                                <Card>
                                    <SectionHeader
                                        icon={
                                            <ClipboardList className="h-4 w-4" />
                                        }
                                        title={`Dữ liệu nghiệp vụ · v${request.formSchemaVersion || 1}`}
                                        description="Dữ liệu được mã hóa khi lưu. Phân loại dữ liệu hiển thị theo cấu hình tại thời điểm giao việc."
                                    />
                                    <CardContent>
                                    <div className="space-y-3">
                                        {formDefinition.fields.map(field => (
                                            <div key={field.key}>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <Label>
                                                        {field.label}{field.required ? " *" : ""}
                                                    </Label>
                                                    <Badge
                                                        tone={
                                                            field.classification === "sensitive"
                                                                ? "red"
                                                                : field.classification === "personal"
                                                                  ? "yellow"
                                                                  : "gray"
                                                        }
                                                    >
                                                        {field.classification === "sensitive"
                                                            ? "Nhạy cảm"
                                                            : field.classification === "personal"
                                                              ? "Cá nhân"
                                                              : "Nội bộ"}
                                                    </Badge>
                                                </div>
                                                {field.type === "long_text" ? (
                                                    <Textarea
                                                        value={String(formData[field.key] || "")}
                                                        disabled={!canEditForm}
                                                        onChange={event =>
                                                            setDynamicField(field.key, event.target.value)
                                                        }
                                                    />
                                                ) : field.type === "boolean" ? (
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <Checkbox
                                                            checked={formData[field.key] === true}
                                                            disabled={!canEditForm}
                                                            onCheckedChange={checked =>
                                                                setDynamicField(field.key, checked === true)
                                                            }
                                                        />
                                                        Có
                                                    </label>
                                                ) : field.type === "single_select" ? (
                                                    <Select
                                                        value={String(formData[field.key] || "")}
                                                        disabled={!canEditForm}
                                                        onValueChange={value =>
                                                            setDynamicField(field.key, value)
                                                        }
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="Chọn giá trị" /></SelectTrigger>
                                                        <SelectContent>
                                                            {field.options.map(option => (
                                                                <SelectItem key={option} value={option}>
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : field.type === "multi_select" ? (
                                                    <div className="space-y-2">
                                                        {field.options.map(option => {
                                                            const selected = Array.isArray(formData[field.key])
                                                                ? (formData[field.key] as string[])
                                                                : [];
                                                            return (
                                                                <label key={option} className="flex items-center gap-2 text-sm">
                                                                    <Checkbox
                                                                        checked={selected.includes(option)}
                                                                        disabled={!canEditForm}
                                                                        onCheckedChange={checked =>
                                                                            setDynamicField(
                                                                                field.key,
                                                                                checked === true
                                                                                    ? [...selected, option]
                                                                                    : selected.filter(value => value !== option),
                                                                            )
                                                                        }
                                                                    />
                                                                    {option}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <Input
                                                        type={
                                                            field.type === "number"
                                                                ? "number"
                                                                : field.type === "date"
                                                                  ? "date"
                                                                  : "text"
                                                        }
                                                        value={String(formData[field.key] ?? "")}
                                                        disabled={!canEditForm}
                                                        onChange={event =>
                                                            setDynamicField(
                                                                field.key,
                                                                field.type === "number"
                                                                    ? event.target.value === ""
                                                                        ? undefined
                                                                        : Number(event.target.value)
                                                                    : event.target.value,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {canEditForm && (
                                        <Button
                                            className="mt-3"
                                            size="sm"
                                            loading={savingFormData}
                                            onClick={() => void handleSaveFormData()}
                                        >
                                            Lưu dữ liệu nghiệp vụ
                                        </Button>
                                    )}
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <SectionHeader
                                    icon={<StickyNote className="h-4 w-4" />}
                                    title="Ghi chú"
                                />
                                <CardContent>
                                <Textarea
                                    placeholder="Ghi chú thêm (nếu có)"
                                    value={note}
                                    disabled={!canManage}
                                    onChange={e => setNote(e.target.value)}
                                />
                                {canManage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2"
                                        loading={savingNote}
                                        onClick={handleSaveNote}
                                    >
                                        Lưu ghi chú
                                    </Button>
                                )}
                                </CardContent>
                            </Card>

                            <Card>
                                <SectionHeader
                                    icon={<Paperclip className="h-4 w-4" />}
                                    title="Tệp đính kèm"
                                    action={
                                        (canManage || isCreator) && (
                                            <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                loading={uploading}
                                                onClick={handleUploadClick}
                                            >
                                                <Upload className="mr-1 h-3.5 w-3.5" />
                                                Tải lên
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                                onChange={handleFileSelected}
                                            />
                                        </>
                                        )
                                    }
                                />
                                <CardContent>
                                {attachmentsLoading && <LoadingState />}
                                {!attachmentsLoading &&
                                    attachments.length === 0 && (
                                        <EmptyState label="Chưa có file đính kèm" />
                                    )}
                                <div className="flex flex-col gap-3">
                                    {!attachmentsLoading &&
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
                                                    className="mt-2 h-56"
                                                />
                                            </div>
                                        ))}
                                </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <SectionHeader
                                    icon={
                                        <MessageSquare className="h-4 w-4" />
                                    }
                                    title="Trao đổi"
                                />
                                <CardContent>
                                {commentsLoading && <LoadingState />}
                                {!commentsLoading && comments.length === 0 && (
                                    <EmptyState label="Chưa có trao đổi nào" />
                                )}
                                {!commentsLoading &&
                                    comments.map(c => (
                                        <div
                                            key={c._id}
                                            className="border-b border-divider_01 py-2 text-sm last:border-0"
                                        >
                                            <div className="font-medium">
                                                {typeof c.authorId === "string"
                                                    ? c.authorId
                                                    : c.authorId.displayName}
                                            </div>
                                            <p className="mt-0.5 whitespace-pre-line">
                                                {c.content}
                                            </p>
                                            <div className="mt-0.5 text-xs text-text_2">
                                                {new Date(
                                                    c.createdAt,
                                                ).toLocaleString("vi-VN")}
                                            </div>
                                        </div>
                                    ))}
                                <div className="mt-3 flex flex-col gap-2">
                                    <Textarea
                                        placeholder="Nhập nội dung trao đổi..."
                                        value={newComment}
                                        onChange={e =>
                                            setNewComment(e.target.value)
                                        }
                                    />
                                    <Button
                                        size="sm"
                                        className="self-end"
                                        loading={postingComment}
                                        disabled={!newComment.trim()}
                                        onClick={handlePostComment}
                                    >
                                        Gửi
                                    </Button>
                                </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </SheetContent>
            {request && (
                <TransferRequestDialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                    candidateRoleKeys={request.targetRoles || []}
                    excludeUserId={currentUserId}
                    submitting={initiatingTransfer}
                    onSubmit={handleInitiateTransfer}
                />
            )}

            <FilePreviewDialog
                source={previewSource}
                onOpenChange={open => !open && setPreviewSource(null)}
            />
        </Sheet>
    );
};

export default RequestDetailSheet;
