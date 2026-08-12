import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Paperclip, Send, Trash2, Upload } from "lucide-react";
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
import { resolveAssetUrl } from "@constants/common";
import {
    AnnouncementAttachment,
    AppError,
    AssignableStaff,
    CorrespondenceType,
    Neighborhood,
} from "@dts";
import {
    CorrespondenceInput,
    createCorrespondence,
    deleteCorrespondenceAttachment,
    fetchCorrespondenceAttachments,
    fetchCorrespondenceDetail,
    sendCorrespondence,
    updateCorrespondence,
    uploadCorrespondenceAttachment,
} from "@service/correspondenceApi";
import { fetchEligibleSenderCorrespondenceTypes } from "@service/correspondenceTypeApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { fetchAssignableStaffByRoles } from "@service/userApi";

const CorrespondenceFormPage: React.FC = () => (
    <AdminGuard permissions={["correspondences.read"]}>
        <CorrespondenceFormContent />
    </AdminGuard>
);

const CorrespondenceFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canManage = usePermission(
        isEdit ? "correspondences.update" : "correspondences.create",
    );
    const canSend = usePermission("correspondences.send");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<"nhap" | "da_gui">("nhap");

    const [eligibleTypes, setEligibleTypes] = useState<CorrespondenceType[]>(
        [],
    );
    const [typeDetail, setTypeDetail] = useState<CorrespondenceType | null>(
        null,
    );
    const [correspondenceTypeId, setCorrespondenceTypeId] = useState("");

    const [documentNumber, setDocumentNumber] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [issuedAt, setIssuedAt] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);

    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [targetNeighborhoodIds, setTargetNeighborhoodIds] = useState<
        string[]
    >([]);

    const [receiverSearch, setReceiverSearch] = useState("");
    const [receivers, setReceivers] = useState<AssignableStaff[]>([]);
    const [targetUserIds, setTargetUserIds] = useState<string[]>([]);

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
        fetchCorrespondenceDetail(id)
            .then(doc => {
                setDocumentNumber(doc.documentNumber || "");
                setTitle(doc.title);
                setContent(doc.content);
                setIssuedAt(doc.issuedAt.slice(0, 10));
                setIsUrgent(doc.isUrgent);
                setStatus(doc.status);
                setTargetNeighborhoodIds(doc.targetNeighborhoodIds || []);
                setTargetUserIds(doc.targetUserIds || []);
                const type = doc.correspondenceTypeId;
                if (typeof type !== "string") {
                    setTypeDetail(type as CorrespondenceType);
                    setCorrespondenceTypeId(type._id);
                }
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchCorrespondenceAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (isEdit) return;
        fetchEligibleSenderCorrespondenceTypes()
            .then(res => setEligibleTypes(res.items))
            .catch(() => setEligibleTypes([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isEdit) return;
        const type = eligibleTypes.find(t => t._id === correspondenceTypeId);
        setTypeDetail(type || null);
        setDocumentNumber("");
        setTargetNeighborhoodIds([]);
        setTargetUserIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [correspondenceTypeId]);

    useEffect(() => {
        fetchNeighborhoods({ limit: 100, active: true })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, []);

    useEffect(() => {
        fetchAssignableStaffByRoles(typeDetail?.allowedReceiverRoles || [])
            .then(setReceivers)
            .catch(() => setReceivers([]));
    }, [typeDetail]);

    const toggleNeighborhood = (nId: string) => {
        setTargetNeighborhoodIds(prev =>
            prev.includes(nId) ? prev.filter(v => v !== nId) : [...prev, nId],
        );
    };

    const toggleReceiver = (userId: string) => {
        setTargetUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(v => v !== userId)
                : [...prev, userId],
        );
    };

    const visibleReceivers = receivers.filter(r =>
        r.displayName.toLowerCase().includes(receiverSearch.toLowerCase()),
    );
    const showNeighborhoodPicker =
        typeDetail?.allowedReceiverRoles.includes("neighborhood_leader") ??
        false;

    const handleSubmit = async () => {
        if (!correspondenceTypeId && !isEdit) {
            toast.error("Vui lòng chọn loại văn bản");
            return;
        }
        if (
            !title.trim() ||
            !content.trim() ||
            !issuedAt ||
            (typeDetail?.requireDocumentNumber && !documentNumber.trim())
        ) {
            toast.error(
                "Vui lòng nhập đầy đủ thông tin bắt buộc (tiêu đề, nội dung, ngày ban hành" +
                    (typeDetail?.requireDocumentNumber
                        ? ", số/ký hiệu"
                        : "") +
                    ")",
            );
            return;
        }
        const input: CorrespondenceInput = {
            correspondenceTypeId,
            documentNumber: documentNumber.trim() || undefined,
            title: title.trim(),
            content: content.trim(),
            issuedAt,
            isUrgent,
            targetNeighborhoodIds,
            targetUserIds,
        };
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateCorrespondence(id, input);
                toast.success("Đã cập nhật văn bản");
                navigate("/correspondences");
            } else {
                const created = await createCorrespondence(input);
                toast.success(
                    "Đã tạo văn bản (bản nháp) - bạn có thể đính kèm tệp bên dưới",
                );
                // Chuyen sang trang sua (thay vi ve danh sach) de nguoi dung
                // thay ngay muc "Tep dinh kem" - muc nay chi hien khi isEdit
                // (can co id de gan file vao), nen o man tao moi se khong
                // thay gi neu quay ve danh sach.
                navigate(`/correspondences/${created._id}/edit`);
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        if (!id) return;
        try {
            setSending(true);
            await sendCorrespondence(id);
            toast.success("Đã gửi văn bản");
            navigate("/correspondences");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSending(false);
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
            const asset = await uploadCorrespondenceAttachment(id, file);
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
            await deleteCorrespondenceAttachment(id, fileId);
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
                    onClick={() => navigate("/correspondences")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa văn bản" : "Soạn văn bản"}
                </h1>
            </div>

            <div className="max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                {isEdit && loading && <LoadingState />}
                {isEdit && !loading && loadError && (
                    <ErrorState onRetry={loadDetail} />
                )}
                {(!isEdit || (!loading && !loadError)) && (
                    <div className="flex flex-col gap-4">
                        {isEdit && status === "da_gui" && (
                            <p className="rounded-lg bg-ng_10 px-3 py-2 text-xs text-text_2">
                                Văn bản đã được gửi, không thể sửa nội dung.
                            </p>
                        )}
                        <div className="space-y-1.5">
                            <Label>Loại văn bản</Label>
                            {isEdit ? (
                                <Input value={typeDetail?.name || ""} disabled />
                            ) : (
                                <Select
                                    value={correspondenceTypeId}
                                    onValueChange={setCorrespondenceTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại văn bản" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleTypes.map(t => (
                                            <SelectItem key={t._id} value={t._id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {!isEdit && eligibleTypes.length === 0 && (
                                <p className="text-xs text-text_2">
                                    Bạn chưa được phép gửi loại văn bản nào.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {typeDetail?.requireDocumentNumber && (
                                <div className="space-y-1.5">
                                    <Label>Số/ký hiệu văn bản</Label>
                                    <Input
                                        placeholder="VD: 123/CV-UBND"
                                        value={documentNumber}
                                        disabled={status === "da_gui"}
                                        onChange={e =>
                                            setDocumentNumber(e.target.value)
                                        }
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Ngày ban hành</Label>
                                <Input
                                    type="date"
                                    value={issuedAt}
                                    disabled={status === "da_gui"}
                                    onChange={e => setIssuedAt(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tiêu đề</Label>
                            <Input
                                placeholder="Nhập tiêu đề văn bản"
                                value={title}
                                disabled={status === "da_gui"}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                placeholder="Nội dung văn bản"
                                rows={6}
                                value={content}
                                disabled={status === "da_gui"}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={isUrgent}
                                disabled={status === "da_gui"}
                                onCheckedChange={checked =>
                                    setIsUrgent(checked === true)
                                }
                            />
                            Văn bản khẩn
                        </label>

                        {status !== "da_gui" && (
                            <div className="space-y-4 rounded-lg border border-divider_01 p-3">
                                {showNeighborhoodPicker && (
                                    <div>
                                        <Label>Gửi theo tổ dân phố</Label>
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
                                )}

                                <div>
                                    <Label>Gửi tới người nhận cụ thể</Label>
                                    <Input
                                        className="mt-1.5"
                                        placeholder="Tìm theo tên..."
                                        value={receiverSearch}
                                        onChange={e =>
                                            setReceiverSearch(e.target.value)
                                        }
                                    />
                                    <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-divider_01">
                                        {visibleReceivers.length === 0 && (
                                            <EmptyState label="Không tìm thấy người nhận phù hợp" />
                                        )}
                                        {visibleReceivers.map(r => (
                                            <label
                                                key={r.id}
                                                className="flex cursor-pointer items-center gap-2 border-b border-divider_01 px-3 py-2 text-sm last:border-0 hover:bg-ng_10"
                                            >
                                                <Checkbox
                                                    checked={targetUserIds.includes(
                                                        r.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleReceiver(r.id)
                                                    }
                                                />
                                                {r.displayName}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {canManage && status !== "da_gui" && (
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <Button loading={saving} onClick={handleSubmit}>
                                    {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                                </Button>
                                {isEdit && canSend && (
                                    <Button
                                        variant="outline"
                                        loading={sending}
                                        onClick={handleSend}
                                    >
                                        <Send className="mr-1 h-4 w-4" />
                                        Gửi văn bản
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
                                    {canManage && status !== "da_gui" && (
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
                                            {canManage &&
                                                status !== "da_gui" && (
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

export default CorrespondenceFormPage;
