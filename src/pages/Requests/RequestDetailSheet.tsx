import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@components/ui/sheet";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import RequestRecipientPicker from "@components/admin/RequestRecipientPicker";
import { usePermission } from "@store/authStore";
import { resolveAssetUrl } from "@constants/common";
import {
    REQUEST_PRIORITY_LABEL,
    REQUEST_PRIORITY_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
} from "@constants/domain";
import { AppError, RequestAttachment, RequestItem, RequestMeta } from "@dts";
import {
    confirmRequestRecipient,
    fetchRequestAttachments,
    fetchRequestById,
    fetchRequestMeta,
    deleteRequestAttachment,
    updateRequest,
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

const RequestDetailSheet: React.FC<RequestDetailSheetProps> = ({
    requestId,
    onOpenChange,
    onUpdated,
}) => {
    const canManage = usePermission("requests.update");

    const [request, setRequest] = useState<RequestItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState<RequestMeta | null>(null);

    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    const [addUserIds, setAddUserIds] = useState<string[]>([]);
    const [addRoles, setAddRoles] = useState<string[]>([]);
    const [addingRecipients, setAddingRecipients] = useState(false);
    const [confirmingUserId, setConfirmingUserId] = useState<string | null>(
        null,
    );

    const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = (id: string) => {
        setLoading(true);
        fetchRequestById(id)
            .then(r => {
                setRequest(r);
                setNote(r.note || "");
            })
            .catch(() => setRequest(null))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchRequestAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
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

    return (
        <Sheet open={!!requestId} onOpenChange={onOpenChange}>
            <SheetContent>
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
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <h2 className="text-base font-semibold">
                                        {request.title}
                                    </h2>
                                    <Badge tone="blue">
                                        {REQUEST_TYPE_LABEL[request.type]}
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
                                    <p className="text-sm text-text_2">
                                        {request.description}
                                    </p>
                                )}
                                <div className="mt-2 text-sm text-text_2">
                                    {houseText(request.houseId) && (
                                        <div>
                                            Nhà liên quan:{" "}
                                            {houseText(request.houseId)}
                                        </div>
                                    )}
                                    <div>
                                        Hạn xử lý:{" "}
                                        {formatDate(request.dueDate) ||
                                            "Chưa đặt"}
                                    </div>
                                    <div>
                                        Người gửi:{" "}
                                        {creatorText(request.createdBy)}
                                    </div>
                                </div>
                                <Link
                                    to={`/requests/${request._id}/history`}
                                    className="mt-1 inline-block text-sm text-primary hover:underline"
                                >
                                    Xem lịch sử chỉnh sửa
                                </Link>
                            </div>

                            <div>
                                <h3 className="mb-2 text-sm font-semibold">
                                    Người nhận
                                </h3>
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
                                            </div>
                                            {rec.note && (
                                                <p className="mt-1 pl-1 text-xs text-text_2">
                                                    {rec.note}
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
                            </div>

                            <div>
                                <Label>Ghi chú</Label>
                                <Textarea
                                    className="mt-1.5"
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
                            </div>

                            <div className="border-t border-divider_01 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Tệp đính kèm
                                    </h3>
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
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default RequestDetailSheet;
