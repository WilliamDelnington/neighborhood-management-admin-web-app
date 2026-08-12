import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Paperclip, Trash2, Upload } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import StatCard from "@components/admin/StatCard";
import RecordHistorySection from "@components/admin/RecordHistorySection";
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

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !id) return;
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
            } else {
                const created = await createMeeting(input);
                toast.success(
                    "Đã tạo cuộc họp - bạn có thể đính kèm tệp bên dưới",
                );
                navigate(`/meetings/${created._id}/edit`);
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/meetings")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa cuộc họp" : "Thêm cuộc họp"}
                </h1>
            </div>

            <div className="max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                {isEdit && loading && <LoadingState />}
                {isEdit && !loading && loadError && (
                    <ErrorState onRetry={loadDetail} />
                )}
                {(!isEdit || (!loading && !loadError)) && (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <Label>Tên cuộc họp</Label>
                            <Input
                                placeholder="Nhập tên cuộc họp"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Thời gian</Label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Địa điểm</Label>
                            <Input
                                placeholder="Nhập địa điểm tổ chức"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                placeholder="Nội dung cuộc họp"
                                rows={4}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Biên bản (nếu có)</Label>
                            <Textarea
                                placeholder="Biên bản cuộc họp"
                                rows={3}
                                value={minutes}
                                onChange={e => setMinutes(e.target.value)}
                            />
                        </div>

                        <label
                            htmlFor="published"
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="published"
                                checked={published}
                                onCheckedChange={checked =>
                                    setPublished(checked === true)
                                }
                            />
                            Đăng công khai lên web app cho người dân
                        </label>

                        <div className="rounded-2xl border border-divider_01 p-4">
                            <h2 className="mb-3 text-sm font-semibold">
                                Đối tượng nhận thông báo
                            </h2>

                            <label className="mb-3 flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={eligibleAll}
                                    onCheckedChange={checked =>
                                        setEligibleAll(checked === true)
                                    }
                                />
                                Áp dụng cho tất cả mọi người
                            </label>

                            {!eligibleAll && (
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <Label className="mb-1.5 block">
                                            Vai trò
                                        </Label>
                                        <div className="flex flex-wrap gap-3">
                                            {roles.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có vai trò nào
                                                </span>
                                            )}
                                            {roles.map(r => (
                                                <label
                                                    key={r.key}
                                                    className="flex items-center gap-1.5 text-sm"
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
                                                    {r.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Đường / phố
                                        </Label>
                                        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {streets.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có đường/phố nào
                                                </span>
                                            )}
                                            {streets.map(s => (
                                                <label
                                                    key={s._id}
                                                    className="flex items-center gap-1.5 text-sm"
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
                                                    {s.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Tổ dân phố
                                        </Label>
                                        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {neighborhoods.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có tổ dân phố nào
                                                </span>
                                            )}
                                            {neighborhoods.map(n => (
                                                <label
                                                    key={n._id}
                                                    className="flex items-center gap-1.5 text-sm"
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
                                                    {n.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Loại hình kinh doanh
                                        </Label>
                                        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {businessTypes.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có loại hình kinh doanh nào
                                                </span>
                                            )}
                                            {businessTypes.map(bt => (
                                                <label
                                                    key={bt._id}
                                                    className="flex items-center gap-1.5 text-sm"
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
                                                    {bt.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-text_2">
                                        Chỉ những người khớp vai trò đã chọn
                                        (nếu có) VÀ khớp ít nhất một trong các
                                        tiêu chí đường/phố, tổ dân phố, hoặc
                                        loại hình kinh doanh (nếu có chọn) mới
                                        nhận được thông báo về cuộc họp này.
                                    </p>
                                </div>
                            )}
                        </div>

                        {canManage && (
                            <div className="mt-2">
                                <Button loading={saving} onClick={handleSubmit}>
                                    {isEdit ? "Lưu thay đổi" : "Tạo cuộc họp"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isEdit && (
                <div className="mt-4 max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">
                            Tệp đính kèm
                        </h2>
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
                    {!attachmentsLoading && attachments.length === 0 && (
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
                                            deletingAttachmentId === a._id
                                        }
                                        onClick={() =>
                                            handleDeleteAttachment(a._id)
                                        }
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                </div>
            )}

            {isEdit && (
                <div className="mt-4 max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold">
                        Tình hình đăng ký tham dự
                    </h2>

                    {regLoading && <LoadingState />}

                    {!regLoading && (
                        <>
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <StatCard
                                    label={DANG_KY_HOP_LABEL.co}
                                    value={countByAnswer("co")}
                                    tone="success"
                                />
                                <StatCard
                                    label={DANG_KY_HOP_LABEL.khong}
                                    value={countByAnswer("khong")}
                                    tone="danger"
                                />
                                <StatCard
                                    label={DANG_KY_HOP_LABEL.uy_quyen}
                                    value={countByAnswer("uy_quyen")}
                                    tone="warning"
                                />
                            </div>

                            {registrations.length === 0 ? (
                                <EmptyState label="Chưa có ai đăng ký tham dự" />
                            ) : (
                                <div className="divide-y divide-divider_01">
                                    {registrations.map(r => (
                                        <div key={r._id} className="py-2.5">
                                            <div className="text-sm font-medium">
                                                {registrantName(r)}
                                            </div>
                                            <div className="text-xs text-text_2">
                                                {DANG_KY_HOP_LABEL[r.answer]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {isEdit && id && (
                <RecordHistorySection
                    className="mt-4 max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm"
                    fetchHistory={params => fetchMeetingAuditLogs(id, params)}
                    actionLabels={MEETING_AUDIT_ACTION_LABEL}
                    historyHref={`/meetings/${id}/history`}
                />
            )}
        </div>
    );
};

export default MeetingFormPage;
