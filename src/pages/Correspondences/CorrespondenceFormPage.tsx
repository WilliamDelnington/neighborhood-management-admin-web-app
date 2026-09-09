import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    FileText,
    Info,
    Loader2,
    Maximize2,
    Paperclip,
    Send,
    Settings,
    Trash2,
    UploadCloud,
    Users,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { useAuthStore, usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { Badge } from "@components/ui/badge";
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

// Header dung chung cho tung khoi (Card) cua form - dong bo bo cuc voi trang
// Them khao sat (icon tron + tieu de + mo ta ngan).
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

const CorrespondenceFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canManage = usePermission(
        isEdit ? "correspondences.update" : "correspondences.create",
    );
    const canSend = usePermission("correspondences.send");
    const canManageTypes = usePermission("correspondence_types.update");
    const currentUser = useAuthStore(state => state.user);
    // Nhan hien thi vai tro cua nguoi dang dang nhap, de neu khong loai van
    // ban nao cho phep gui thi ho tu doi chieu duoc ngay vai tro minh dang
    // giu voi cot "Nguoi gui" o trang Loai van ban, thay vi phai doan.
    const currentUserRoleLabels = (currentUser?.roles || [])
        .map(r => currentUser?.roleLabels?.[r] || r)
        .join(", ");

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
    // Van ban chua duoc tao (chua co id) khong the goi uploadCorrespondenceAttachment
    // ngay (can relatedId that su) - file chon o man soan moi duoc giu tam o day,
    // roi tai len ngay sau khi createCorrespondence() thanh cong trong handleSubmit.
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewSource, setPreviewSource] = useState<PreviewSource | null>(
        null,
    );

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
                `Vui lòng nhập đầy đủ thông tin bắt buộc (tiêu đề, nội dung, ngày ban hành${
                    typeDetail?.requireDocumentNumber ? ", số/ký hiệu" : ""
                })`,
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
                // Tai len ngay cac file da chon o man soan (pendingFiles) -
                // chi co the goi API dinh kem SAU khi da co id that su. Dem
                // rieng so loi de bao nguoi dung neu co file khong tai len
                // duoc, thay vi im lang bo qua.
                const uploadResults = await Promise.allSettled(
                    pendingFiles.map(file =>
                        uploadCorrespondenceAttachment(created._id, file),
                    ),
                );
                const uploadFailures = uploadResults.filter(
                    r => r.status === "rejected",
                ).length;
                if (uploadFailures > 0) {
                    toast.error(
                        `Đã tạo văn bản nhưng ${uploadFailures} tệp đính kèm tải lên thất bại - vui lòng thử lại ở trang sửa`,
                    );
                } else {
                    toast.success("Đã tạo văn bản (bản nháp)");
                }
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

    const handleFile = async (file: File) => {
        // Chua co van ban (id) - chi giu tam file o local state, tai len that
        // su sau khi tao van ban thanh cong (xem handleSubmit).
        if (!id) {
            setPendingFiles(prev => [...prev, file]);
            return;
        }
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

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) handleFile(file);
    };

    // Keo-tha file vao khung dinh kem (xem CardContent "Tep dinh kem") - chi
    // nhan 1 file moi lan giong input hien tai, dung chung handleFile o tren.
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

    const handleRemovePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
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
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/correspondences")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {isEdit ? "Sửa văn bản" : "Soạn văn bản"}
                        </h1>
                        <p className="text-sm text-text_2">
                            {isEdit
                                ? "Cập nhật nội dung và đơn vị nhận của văn bản."
                                : "Chọn loại văn bản, nhập nội dung và chọn đơn vị nhận."}
                        </p>
                    </div>
                </div>
                {canManage && status !== "da_gui" && (
                    <div className="flex shrink-0 items-center gap-2">
                        {isEdit && canSend && (
                            <Button
                                size="lg"
                                variant="outline"
                                loading={sending}
                                onClick={handleSend}
                            >
                                <Send className="mr-1.5 h-4 w-4" />
                                Gửi văn bản
                            </Button>
                        )}
                        <Button
                            size="lg"
                            loading={saving}
                            onClick={handleSubmit}
                        >
                            {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                        </Button>
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
                <div className="flex flex-col gap-4">
                    {isEdit && status === "da_gui" && (
                        <div className="flex items-center gap-2 rounded-lg bg-ng_10 px-3 py-2.5 text-sm text-text_2">
                            <Info className="h-4 w-4 shrink-0" />
                            Văn bản đã được gửi, không thể sửa nội dung.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="flex flex-col gap-4">
                            <Card>
                                <SectionHeader
                                    icon={<FileText className="h-4 w-4" />}
                                    title="Thông tin văn bản"
                                    description="Loại văn bản, tiêu đề và nội dung chính."
                                />
                                <CardContent className="flex flex-col gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Loại văn bản</Label>
                                        {isEdit ? (
                                            <Input
                                                value={typeDetail?.name || ""}
                                                disabled
                                            />
                                        ) : (
                                            <Select
                                                value={correspondenceTypeId}
                                                onValueChange={
                                                    setCorrespondenceTypeId
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại văn bản" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eligibleTypes.map(t => (
                                                        <SelectItem
                                                            key={t._id}
                                                            value={t._id}
                                                        >
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {!isEdit &&
                                            eligibleTypes.length === 0 && (
                                                <div className="flex items-start gap-2 rounded-lg bg-ng_10 p-2.5 text-xs text-text_2">
                                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                    <span>
                                                        Chưa có loại văn bản
                                                        nào cấp quyền gửi cho
                                                        đơn vị/chức danh của
                                                        bạn - đây là do thiếu
                                                        cấu hình, không phải
                                                        lỗi.
                                                        {currentUserRoleLabels && (
                                                            <>
                                                                {" "}
                                                                Vai trò hiện
                                                                tại của bạn:{" "}
                                                                <span className="font-medium text-text_1">
                                                                    {
                                                                        currentUserRoleLabels
                                                                    }
                                                                </span>
                                                                . So dòng này
                                                                với cột &quot;Người
                                                                gửi&quot; ở
                                                                trang Loại văn
                                                                bản để biết
                                                                cần thêm quyền
                                                                cho vai trò
                                                                nào.
                                                            </>
                                                        )}
                                                        {canManageTypes && (
                                                            <>
                                                                {" "}
                                                                <Link
                                                                    to="/correspondence-types"
                                                                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                                                >
                                                                    <Settings className="h-3 w-3" />
                                                                    Vào trang
                                                                    Loại văn
                                                                    bản để cấu
                                                                    hình
                                                                </Link>
                                                                .
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {typeDetail?.requireDocumentNumber && (
                                            <div className="space-y-1.5">
                                                <Label>
                                                    Số/ký hiệu văn bản
                                                </Label>
                                                <Input
                                                    placeholder="VD: 123/CV-UBND"
                                                    value={documentNumber}
                                                    disabled={
                                                        status === "da_gui"
                                                    }
                                                    onChange={e =>
                                                        setDocumentNumber(
                                                            e.target.value,
                                                        )
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
                                                onChange={e =>
                                                    setIssuedAt(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Tiêu đề</Label>
                                        <Input
                                            placeholder="Nhập tiêu đề văn bản"
                                            value={title}
                                            disabled={status === "da_gui"}
                                            onChange={e =>
                                                setTitle(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Nội dung</Label>
                                        <Textarea
                                            placeholder="Nội dung văn bản"
                                            rows={8}
                                            value={content}
                                            disabled={status === "da_gui"}
                                            onChange={e =>
                                                setContent(e.target.value)
                                            }
                                        />
                                    </div>

                                    <label className="flex w-fit items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm">
                                        <Checkbox
                                            checked={isUrgent}
                                            disabled={status === "da_gui"}
                                            onCheckedChange={checked =>
                                                setIsUrgent(checked === true)
                                            }
                                        />
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                        Văn bản khẩn
                                    </label>
                                </CardContent>
                            </Card>

                            {status !== "da_gui" && (
                                <Card>
                                    <SectionHeader
                                        icon={<Building2 className="h-4 w-4" />}
                                        title="Đơn vị nhận văn bản"
                                        description="Chọn tổ dân phố và/hoặc người nhận cụ thể."
                                    />
                                    <CardContent className="flex flex-col gap-4">
                                        {!typeDetail && (
                                            <div className="flex items-start gap-2 rounded-lg bg-ng_10 p-2.5 text-xs text-text_2">
                                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    Chọn loại văn bản ở trên
                                                    trước để hiển thị đúng
                                                    đơn vị/người nhận được
                                                    phép.
                                                </span>
                                            </div>
                                        )}

                                        {typeDetail && showNeighborhoodPicker && (
                                            <div>
                                                <Label className="mb-1.5 flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5" />
                                                    Theo tổ dân phố
                                                    {targetNeighborhoodIds.length >
                                                        0 && (
                                                        <Badge tone="blue">
                                                            {
                                                                targetNeighborhoodIds.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </Label>
                                                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
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
                                        )}

                                        {typeDetail && (
                                            <div>
                                                <Label className="mb-1.5 flex items-center gap-1.5">
                                                    Người nhận cụ thể
                                                    {targetUserIds.length >
                                                        0 && (
                                                        <Badge tone="blue">
                                                            {
                                                                targetUserIds.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </Label>
                                                <Input
                                                    placeholder="Tìm theo tên..."
                                                    value={receiverSearch}
                                                    onChange={e =>
                                                        setReceiverSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-divider_01">
                                                    {visibleReceivers.length ===
                                                        0 && (
                                                        <EmptyState label="Không tìm thấy người nhận phù hợp" />
                                                    )}
                                                    {visibleReceivers.map(
                                                        r => (
                                                            <label
                                                                key={r.id}
                                                                className="flex cursor-pointer items-center gap-2 border-b border-divider_01 px-3 py-2 text-sm last:border-0 hover:bg-ng_10"
                                                            >
                                                                <Checkbox
                                                                    checked={targetUserIds.includes(
                                                                        r.id,
                                                                    )}
                                                                    onCheckedChange={() =>
                                                                        toggleReceiver(
                                                                            r.id,
                                                                        )
                                                                    }
                                                                />
                                                                {
                                                                    r.displayName
                                                                }
                                                            </label>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
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
                                            ? "Tệp chọn ở đây sẽ được tải lên ngay sau khi lưu bản nháp."
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
                                    {canManage && status !== "da_gui" && (
                                        <button
                                            type="button"
                                            disabled={uploading}
                                            onClick={handleUploadClick}
                                            onDragOver={
                                                handleDropzoneDragOver
                                            }
                                            onDragLeave={
                                                handleDropzoneDragLeave
                                            }
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
                                        pendingFiles.length === 0 &&
                                        (!canManage ||
                                            status === "da_gui") && (
                                            <EmptyState label="Chưa có file đính kèm" />
                                        )}
                                    {!isEdit &&
                                        pendingFiles.length === 0 &&
                                        (!canManage ||
                                            status === "da_gui") && (
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
                                                            {canManage &&
                                                                status !==
                                                                    "da_gui" && (
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
                                                        className="mt-3 h-[60vh]"
                                                    />
                                                </div>
                                            ))}
                                        {!isEdit &&
                                            pendingFiles.map(
                                                (file, index) => (
                                                    <div
                                                        key={`${file.name}-${index}`}
                                                        className="rounded-lg border border-divider_01 p-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2 text-sm">
                                                            <span className="flex min-w-0 items-center gap-2">
                                                                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate font-medium">
                                                                    {
                                                                        file.name
                                                                    }
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
                                                            className="mt-3 h-[60vh]"
                                                        />
                                                    </div>
                                                ),
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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

export default CorrespondenceFormPage;
