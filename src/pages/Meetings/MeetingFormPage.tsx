import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    CalendarClock,
    ClipboardList,
    Globe,
    Loader2,
    Maximize2,
    Paperclip,
    Trash2,
    UploadCloud,
    Users,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
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
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import FilePreviewDialog, {
    FilePreviewContent,
    PreviewSource,
} from "@components/admin/FilePreviewDialog";
import { DANG_KY_HOP_LABEL, MEETING_AUDIT_ACTION_LABEL } from "@constants/domain";
import { resolveAssetUrl } from "@constants/common";
import {
    AnnouncementAttachment,
    AppError,
    BusinessType,
    DangKyHop,
    MeetingRegistration,
    Neighborhood,
    RoleRecord,
    Street,
} from "@dts";
import {
    MeetingInput,
    createMeeting,
    deleteMeetingAttachment,
    fetchMeetingAttachments,
    fetchMeetingAuditLogs,
    fetchMeetingDetail,
    fetchMeetingRegistrations,
    updateMeeting,
    uploadMeetingAttachment,
} from "@service/meetingApi";
import { fetchStreets } from "@service/streetApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { fetchBusinessTypes } from "@service/businessTypeApi";
import { fetchRoles } from "@service/roleApi";

const idOf = (ref: string | { _id: string }): string =>
    typeof ref === "string" ? ref : ref._id;

/** Chuyen ISO string sang dinh dang gia tri cho input[type=datetime-local]. */
const toDateTimeLocalValue = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate(),
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const registrantName = (r: MeetingRegistration) => {
    if (typeof r.userId === "string") return r.delegateName || r.userId;
    return r.userId?.displayName || r.delegateName || "Người dùng";
};

const REGISTRATION_TONE: Record<DangKyHop, string> = {
    co: "text-success",
    khong: "text-danger",
    uy_quyen: "text-warning",
};

// Header dung chung cho tung khoi (Card) - dong bo bo cuc voi cac form khac
// (Soan van ban, Them tin tuc, Them thong bao...): icon tron + tieu de + mo
// ta ngan.
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

const MeetingFormPage: React.FC = () => (
    <AdminGuard permissions={["meetings.read"]}>
        <MeetingFormContent />
    </AdminGuard>
);

const MeetingFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canManage = usePermission(isEdit ? "meetings.update" : "meetings.create");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("");
    const [location, setLocation] = useState("");
    const [content, setContent] = useState("");
    const [minutes, setMinutes] = useState("");
    const [published, setPublished] = useState(false);

    const [eligibleAll, setEligibleAll] = useState(true);
    const [eligibleRoles, setEligibleRoles] = useState<string[]>([]);
    const [eligibleStreetIds, setEligibleStreetIds] = useState<string[]>([]);
    const [eligibleNeighborhoodIds, setEligibleNeighborhoodIds] = useState<
        string[]
    >([]);
    const [eligibleBusinessTypeIds, setEligibleBusinessTypeIds] = useState<
        string[]
    >([]);

    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [streets, setStreets] = useState<Street[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

    const [registrations, setRegistrations] = useState<MeetingRegistration[]>(
        [],
    );
    const [regLoading, setRegLoading] = useState(false);

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

    // Chua co cuoc hop (chua co id) khong the goi API dinh kem ngay (can id
    // that su) - file chon o man tao moi duoc giu tam o day, roi tai len
    // ngay sau khi createMeeting() thanh cong. Cung mau voi cac form khac.
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const loadDetail = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchMeetingDetail(id)
            .then(m => {
                setTitle(m.title);
                setStartTime(toDateTimeLocalValue(m.startTime));
                setLocation(m.location);
                setContent(m.content);
                setMinutes(m.minutes || "");
                setPublished(m.published);
                setEligibleAll(m.eligibleAll ?? true);
                setEligibleRoles(m.eligibleRoles || []);
                setEligibleStreetIds((m.eligibleStreetIds || []).map(idOf));
                setEligibleNeighborhoodIds(
                    (m.eligibleNeighborhoodIds || []).map(idOf),
                );
                setEligibleBusinessTypeIds(
                    (m.eligibleBusinessTypeIds || []).map(idOf),
                );
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchMeetingAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    const loadRegistrations = () => {
        if (!id) return;
        setRegLoading(true);
        fetchMeetingRegistrations(id)
            .then(res => setRegistrations(res.items))
            .catch(() => setRegistrations([]))
            .finally(() => setRegLoading(false));
    };

    useEffect(() => {
        loadDetail();
        loadRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        fetchRoles({ limit: 100, active: true })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
        fetchStreets({ limit: 200, active: true })
            .then(res => setStreets(res.items))
            .catch(() => setStreets([]));
        fetchNeighborhoods({ limit: 200, active: true })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
        fetchBusinessTypes({ limit: 200, active: true })
            .then(res => setBusinessTypes(res.items))
            .catch(() => setBusinessTypes([]));
    }, []);

    const toggleId = (
        list: string[],
        setList: (v: string[]) => void,
        id2: string,
    ) => {
        setList(
            list.includes(id2) ? list.filter(x => x !== id2) : [...list, id2],
        );
    };

    const countByAnswer = (answer: DangKyHop) =>
        registrations.filter(r => r.answer === answer).length;

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFile = async (file: File) => {
        if (!id) {
            setPendingFiles(prev => [...prev, file]);
            return;
        }
        try {
            setUploading(true);
            const asset = await uploadMeetingAttachment(id, file);
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
            await deleteMeetingAttachment(id, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    const handleSubmit = async () => {
        if (
            !title.trim() ||
            !startTime ||
            !location.trim() ||
            !content.trim()
        ) {
            toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }
        const input: MeetingInput = {
            title: title.trim(),
            startTime: new Date(startTime).toISOString(),
            location: location.trim(),
            content: content.trim(),
            minutes: minutes.trim() || undefined,
            published,
            eligibleAll,
            eligibleRoles: eligibleAll ? [] : eligibleRoles,
            eligibleStreetIds: eligibleAll ? [] : eligibleStreetIds,
            eligibleNeighborhoodIds: eligibleAll ? [] : eligibleNeighborhoodIds,
            eligibleBusinessTypeIds: eligibleAll ? [] : eligibleBusinessTypeIds,
        };
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateMeeting(id, input);
                toast.success("Đã cập nhật cuộc họp");
                navigate("/meetings");
                return;
            }

            const created = await createMeeting(input);
            if (pendingFiles.length > 0) {
                const results = await Promise.allSettled(
                    pendingFiles.map(file =>
                        uploadMeetingAttachment(created._id, file),
                    ),
                );
                const failures = results.filter(
                    r => r.status === "rejected",
                ).length;
                if (failures > 0) {
                    toast.error(
                        `Đã tạo cuộc họp nhưng ${failures} tệp đính kèm tải lên thất bại - vui lòng thử lại ở bước tiếp theo`,
                    );
                }
            }
            toast.success("Đã tạo cuộc họp");
            navigate(`/meetings/${created._id}/edit`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/meetings")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {isEdit ? "Sửa cuộc họp" : "Thêm cuộc họp"}
                        </h1>
                        <p className="text-sm text-text_2">
                            Thông tin cuộc họp, đối tượng tham dự và tài liệu
                            đính kèm.
                        </p>
                    </div>
                </div>
                {canManage && (
                    <Button size="lg" loading={saving} onClick={handleSubmit}>
                        {isEdit ? "Lưu thay đổi" : "Tạo cuộc họp"}
                    </Button>
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
                    <div className="flex flex-col gap-4 lg:col-span-2">
                        <Card>
                            <SectionHeader
                                icon={<CalendarClock className="h-4 w-4" />}
                                title="Thông tin cuộc họp"
                                description="Tên, thời gian, địa điểm và nội dung cuộc họp."
                            />
                            <CardContent className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Tên cuộc họp</Label>
                                    <Input
                                        placeholder="Nhập tên cuộc họp"
                                        value={title}
                                        onChange={e =>
                                            setTitle(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Thời gian</Label>
                                        <Input
                                            type="datetime-local"
                                            value={startTime}
                                            onChange={e =>
                                                setStartTime(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Địa điểm</Label>
                                        <Input
                                            placeholder="Nhập địa điểm tổ chức"
                                            value={location}
                                            onChange={e =>
                                                setLocation(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Nội dung</Label>
                                    <Textarea
                                        placeholder="Nội dung cuộc họp"
                                        rows={5}
                                        value={content}
                                        onChange={e =>
                                            setContent(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Biên bản (nếu có)</Label>
                                    <Textarea
                                        placeholder="Biên bản cuộc họp"
                                        rows={4}
                                        value={minutes}
                                        onChange={e =>
                                            setMinutes(e.target.value)
                                        }
                                    />
                                </div>

                                <label
                                    htmlFor="published"
                                    className="flex w-fit items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm"
                                >
                                    <Checkbox
                                        id="published"
                                        checked={published}
                                        onCheckedChange={checked =>
                                            setPublished(checked === true)
                                        }
                                    />
                                    <Globe className="h-3.5 w-3.5 text-text_2" />
                                    Đăng công khai lên web app cho người dân
                                </label>
                            </CardContent>
                        </Card>

                        <Card>
                            <SectionHeader
                                icon={<Users className="h-4 w-4" />}
                                title="Đối tượng tham dự"
                                description="Ai được thấy và đăng ký tham dự cuộc họp này."
                            />
                            <CardContent>
                                <label className="flex items-center gap-2 rounded-lg border border-divider_01 bg-ng_10 px-3 py-2.5 text-sm font-medium">
                                    <Checkbox
                                        checked={eligibleAll}
                                        onCheckedChange={checked =>
                                            setEligibleAll(checked === true)
                                        }
                                    />
                                    Áp dụng cho tất cả mọi người
                                </label>

                                {!eligibleAll && (
                                    <div className="mt-3 flex flex-col gap-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <Label>Vai trò</Label>
                                                    {eligibleRoles.length >
                                                        0 && (
                                                        <Badge tone="blue">
                                                            {
                                                                eligibleRoles.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                                    {roles.length === 0 && (
                                                        <span className="p-1 text-xs text-text_2">
                                                            Chưa có vai trò
                                                            nào
                                                        </span>
                                                    )}
                                                    {roles.map(r => (
                                                        <label
                                                            key={r.key}
                                                            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-ng_10"
                                                        >
                                                            <Checkbox
                                                                checked={eligibleRoles.includes(
                                                                    r.key,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleId(
                                                                        eligibleRoles,
                                                                        setEligibleRoles,
                                                                        r.key,
                                                                    )
                                                                }
                                                            />
                                                            <span className="truncate">
                                                                {r.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <Label>Đường / phố</Label>
                                                    {eligibleStreetIds.length >
                                                        0 && (
                                                        <Badge tone="blue">
                                                            {
                                                                eligibleStreetIds.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                                    {streets.length === 0 && (
                                                        <span className="p-1 text-xs text-text_2">
                                                            Chưa có đường/phố
                                                            nào
                                                        </span>
                                                    )}
                                                    {streets.map(s => (
                                                        <label
                                                            key={s._id}
                                                            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-ng_10"
                                                        >
                                                            <Checkbox
                                                                checked={eligibleStreetIds.includes(
                                                                    s._id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleId(
                                                                        eligibleStreetIds,
                                                                        setEligibleStreetIds,
                                                                        s._id,
                                                                    )
                                                                }
                                                            />
                                                            <span className="truncate">
                                                                {s.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <Label>Tổ dân phố</Label>
                                                    {eligibleNeighborhoodIds.length >
                                                        0 && (
                                                        <Badge tone="blue">
                                                            {
                                                                eligibleNeighborhoodIds.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                                    {neighborhoods.length ===
                                                        0 && (
                                                        <span className="p-1 text-xs text-text_2">
                                                            Chưa có tổ dân
                                                            phố nào
                                                        </span>
                                                    )}
                                                    {neighborhoods.map(n => (
                                                        <label
                                                            key={n._id}
                                                            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-ng_10"
                                                        >
                                                            <Checkbox
                                                                checked={eligibleNeighborhoodIds.includes(
                                                                    n._id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleId(
                                                                        eligibleNeighborhoodIds,
                                                                        setEligibleNeighborhoodIds,
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
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <Label>
                                                        Loại hình kinh doanh
                                                    </Label>
                                                    {eligibleBusinessTypeIds.length >
                                                        0 && (
                                                        <Badge tone="blue">
                                                            {
                                                                eligibleBusinessTypeIds.length
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                                    {businessTypes.length ===
                                                        0 && (
                                                        <span className="p-1 text-xs text-text_2">
                                                            Chưa có loại hình
                                                            kinh doanh nào
                                                        </span>
                                                    )}
                                                    {businessTypes.map(
                                                        bt => (
                                                            <label
                                                                key={bt._id}
                                                                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-ng_10"
                                                            >
                                                                <Checkbox
                                                                    checked={eligibleBusinessTypeIds.includes(
                                                                        bt._id,
                                                                    )}
                                                                    onCheckedChange={() =>
                                                                        toggleId(
                                                                            eligibleBusinessTypeIds,
                                                                            setEligibleBusinessTypeIds,
                                                                            bt._id,
                                                                        )
                                                                    }
                                                                />
                                                                <span className="truncate">
                                                                    {
                                                                        bt.name
                                                                    }
                                                                </span>
                                                            </label>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="rounded-lg bg-ng_10 p-2.5 text-xs text-text_2">
                                            Chỉ những người khớp vai trò đã
                                            chọn (nếu có) VÀ khớp ít nhất một
                                            trong các tiêu chí đường/phố, tổ
                                            dân phố, hoặc loại hình kinh doanh
                                            (nếu có chọn) mới thấy được cuộc
                                            họp này.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit">
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
                                        className={`flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                                            isDragOver
                                                ? "border-primary bg-blue_10"
                                                : "border-divider_01 hover:border-primary hover:bg-ng_10"
                                        }`}
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-text_2" />
                                        ) : (
                                            <UploadCloud className="h-5 w-5 text-text_2" />
                                        )}
                                        <p className="text-xs">
                                            <span className="font-medium text-primary">
                                                Bấm để chọn tệp
                                            </span>{" "}
                                            hoặc kéo thả vào đây
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
                                                    className="mt-2 h-56"
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
                                                    className="mt-2 h-56"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>

                        {isEdit && (
                            <Card>
                                <SectionHeader
                                    icon={
                                        <ClipboardList className="h-4 w-4" />
                                    }
                                    title="Tình hình đăng ký"
                                    action={
                                        registrations.length > 0 && (
                                            <Badge tone="blue">
                                                {registrations.length}
                                            </Badge>
                                        )
                                    }
                                />
                                <CardContent>
                                    {regLoading && <LoadingState />}
                                    {!regLoading && (
                                        <>
                                            <div className="mb-3 grid grid-cols-3 gap-2">
                                                {(
                                                    [
                                                        "co",
                                                        "khong",
                                                        "uy_quyen",
                                                    ] as DangKyHop[]
                                                ).map(answer => (
                                                    <div
                                                        key={answer}
                                                        className="rounded-lg border border-divider_01 p-2 text-center"
                                                    >
                                                        <div
                                                            className={`text-lg font-bold ${REGISTRATION_TONE[answer]}`}
                                                        >
                                                            {countByAnswer(
                                                                answer,
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] leading-tight text-text_2">
                                                            {
                                                                DANG_KY_HOP_LABEL[
                                                                    answer
                                                                ]
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {registrations.length === 0 ? (
                                                <EmptyState label="Chưa có ai đăng ký tham dự" />
                                            ) : (
                                                <div className="max-h-64 divide-y divide-divider_01 overflow-y-auto">
                                                    {registrations.map(r => (
                                                        <div
                                                            key={r._id}
                                                            className="py-2"
                                                        >
                                                            <div className="text-sm font-medium">
                                                                {registrantName(
                                                                    r,
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-text_2">
                                                                {
                                                                    DANG_KY_HOP_LABEL[
                                                                        r
                                                                            .answer
                                                                    ]
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {isEdit && id && (
                            <RecordHistorySection
                                className="rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm"
                                fetchHistory={params =>
                                    fetchMeetingAuditLogs(id, params)
                                }
                                actionLabels={MEETING_AUDIT_ACTION_LABEL}
                                historyHref={`/meetings/${id}/history`}
                            />
                        )}
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

export default MeetingFormPage;
