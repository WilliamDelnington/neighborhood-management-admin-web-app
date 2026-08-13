import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import {
    AppError,
    AssignableStaff,
    Complaint,
    ComplaintTimelineEntry,
    FileAsset,
    TrangThaiPhanAnh,
} from "@dts";
import {
    NHOM_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import {
    assignComplaint,
    deleteComplaint,
    fetchComplaintAttachments,
    fetchComplaintDetail,
    updateComplaintStatus,
} from "@service/complaintApi";
import { fetchAssignableStaff } from "@service/userApi";

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";
const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const ComplaintDetailPage: React.FC = () => (
    <AdminGuard permissions={["complaints.read"]}>
        <ComplaintDetailContent />
    </AdminGuard>
);

const ComplaintDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canAssign = usePermission("complaints.assign");
    const canUpdateStatus = usePermission("complaints.update_status");
    const canDelete = usePermission("complaints.delete");

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [timeline, setTimeline] = useState<ComplaintTimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);

    const [newStatus, setNewStatus] = useState<TrangThaiPhanAnh | "">("");
    const [note, setNote] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [assigneeStaff, setAssigneeStaff] = useState<AssignableStaff[]>([]);
    const [assigneeLoading, setAssigneeLoading] = useState(false);
    const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
    const [transferReason, setTransferReason] = useState("");
    const [assigning, setAssigning] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchComplaintDetail(id)
            .then(res => {
                setComplaint(res.complaint);
                setTimeline(res.timeline);
                setNewStatus(res.complaint.status);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        fetchComplaintAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!assigneeDialogOpen) return;
        setTransferReason("");
        setAssigneeLoading(true);
        fetchAssignableStaff()
            .then(setAssigneeStaff)
            .catch(() => setAssigneeStaff([]))
            .finally(() => setAssigneeLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assigneeDialogOpen]);

    const assigneeResults = assigneeStaff.filter(s =>
        s.displayName.toLowerCase().includes(assigneeSearch.toLowerCase()),
    );

    const handleUpdateStatus = async () => {
        if (!id || !newStatus) return;
        try {
            setUpdating(true);
            const updated = await updateComplaintStatus(id, {
                status: newStatus,
                note: note.trim() || undefined,
                isPublic,
            });
            setComplaint(updated);
            setNote("");
            toast.success("Đã cập nhật trạng thái phản ánh");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUpdating(false);
        }
    };

    const wasAssigned = !!complaint?.assigneeId;

    const handleAssign = async (staff: AssignableStaff) => {
        if (!id) return;
        if (wasAssigned && !transferReason.trim()) {
            toast.error("Vui lòng nhập lý do khi đổi người phụ trách");
            return;
        }
        try {
            setAssigning(true);
            const updated = await assignComplaint(
                id,
                staff.id,
                expectedCompletionDate
                    ? new Date(expectedCompletionDate).toISOString()
                    : undefined,
                wasAssigned ? transferReason.trim() : undefined,
            );
            setComplaint(updated);
            setAssigneeDialogOpen(false);
            setTransferReason("");
            toast.success(`Đã giao cho ${staff.displayName}`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigning(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await deleteComplaint(id);
            toast.success("Đã xóa phản ánh");
            navigate("/complaints");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    const assigneeName =
        complaint &&
        typeof complaint.assigneeId === "object" &&
        complaint.assigneeId
            ? complaint.assigneeId.displayName
            : undefined;
    const creator =
        complaint && typeof complaint.createdByUserId === "object"
            ? complaint.createdByUserId
            : undefined;
    const targetHouse =
        complaint && typeof complaint.targetHouseId === "object"
            ? complaint.targetHouseId
            : undefined;

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/complaints")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Phản ánh</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && complaint && (
                <>
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {complaint.code}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Badge
                                    tone={
                                        TRANG_THAI_PHAN_ANH_TONE[
                                            complaint.status
                                        ]
                                    }
                                >
                                    {
                                        TRANG_THAI_PHAN_ANH_LABEL[
                                            complaint.status
                                        ]
                                    }
                                </Badge>
                                {!complaint.neighborhoodId && (
                                    <Badge tone="red">
                                        Chưa xác định tổ dân phố
                                    </Badge>
                                )}
                                {canDelete && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setDeleteDialogOpen(true)
                                        }
                                    >
                                        Xóa
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="text-sm font-medium">
                            {complaint.title}
                        </div>
                        <div className="mt-1 text-xs text-text_2">
                            {NHOM_PHAN_ANH_LABEL[complaint.category]}
                            {complaint.area ? ` • ${complaint.area}` : ""}
                        </div>
                        <p className="mt-3 text-sm">{complaint.content}</p>

                        <div className="mt-3 border-t border-divider_01 pt-3">
                            {creator && (
                                <InfoRow
                                    label="Người gửi"
                                    value={`${creator.displayName}${
                                        creator.phone
                                            ? ` (${creator.phone})`
                                            : ""
                                    }`}
                                />
                            )}
                            {targetHouse && (
                                <InfoRow
                                    label="Nhà số liên quan"
                                    value={`${targetHouse.code}${
                                        targetHouse.address
                                            ? ` — ${targetHouse.address}`
                                            : ""
                                    }`}
                                />
                            )}
                            <InfoRow
                                label="Người phụ trách"
                                value={assigneeName || "Chưa phân công"}
                            />
                            {complaint.rating !== undefined && (
                                <InfoRow
                                    label="Đánh giá của người gửi"
                                    value={`${"★".repeat(
                                        complaint.rating,
                                    )}${"☆".repeat(5 - complaint.rating)}${
                                        complaint.ratingNote
                                            ? ` — ${complaint.ratingNote}`
                                            : ""
                                    }`}
                                />
                            )}
                            {complaint.expectedCompletionDate && (
                                <InfoRow
                                    label="Dự kiến hoàn thành"
                                    value={formatDate(
                                        complaint.expectedCompletionDate,
                                    )}
                                />
                            )}
                            {complaint.actualCompletionDate && (
                                <InfoRow
                                    label="Ngày hoàn thành"
                                    value={formatDate(
                                        complaint.actualCompletionDate,
                                    )}
                                />
                            )}
                            {complaint.internalNotes && (
                                <InfoRow
                                    label="Ghi chú nội bộ"
                                    value={complaint.internalNotes}
                                />
                            )}
                        </div>
                    </div>

                    <AttachmentsPanel
                        attachments={attachments}
                        loading={attachmentsLoading}
                        canManage={false}
                    />

                    {canAssign && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold">
                                Phân công xử lý
                            </h2>
                            <label
                                htmlFor="expectedCompletionDate"
                                className="mb-1 block text-sm text-text_2"
                            >
                                Dự kiến hoàn thành (tùy chọn)
                            </label>
                            <Input
                                id="expectedCompletionDate"
                                type="date"
                                value={expectedCompletionDate}
                                onChange={e =>
                                    setExpectedCompletionDate(e.target.value)
                                }
                            />
                            <div className="mt-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setAssigneeDialogOpen(true)}
                                >
                                    {assigneeName
                                        ? `Đang giao: ${assigneeName} — Đổi người`
                                        : "Chọn người phụ trách"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {canUpdateStatus && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold">
                                Cập nhật trạng thái
                            </h2>
                            <Select
                                value={newStatus}
                                onValueChange={v =>
                                    setNewStatus(v as TrangThaiPhanAnh)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Trạng thái mới" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(
                                            TRANG_THAI_PHAN_ANH_LABEL,
                                        ) as [TrangThaiPhanAnh, string][]
                                    )
                                        // "hoan_thanh" chi nguoi gui phan anh
                                        // moi duoc xac nhan (xem
                                        // confirmComplaintResolution o
                                        // backend) - nhan vien khong chon
                                        // duoc trang thai nay o day. "da_tiep_nhan"/
                                        // "da_chuyen_ubnd" bi an theo yeu cau.
                                        .filter(
                                            ([key]) =>
                                                ![
                                                    "hoan_thanh",
                                                    "da_tiep_nhan",
                                                    "da_chuyen_ubnd",
                                                ].includes(key),
                                        )
                                        .map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <Textarea
                                className="mt-3"
                                placeholder="Nội dung cập nhật, phản hồi cho người dân..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                            <label
                                htmlFor="isPublic"
                                className="mt-3 flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="isPublic"
                                    checked={isPublic}
                                    onCheckedChange={checked =>
                                        setIsPublic(checked === true)
                                    }
                                />
                                Công khai cho người dân
                            </label>
                            <div className="mt-3">
                                <Button
                                    loading={updating}
                                    disabled={!newStatus}
                                    onClick={handleUpdateStatus}
                                >
                                    Cập nhật trạng thái
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <h2 className="mb-3 text-base font-semibold">
                            Lịch sử xử lý
                        </h2>
                        {timeline.length === 0 && (
                            <EmptyState label="Chưa có lịch sử xử lý" />
                        )}
                        {timeline.map(t => (
                            <div
                                key={t._id}
                                className="border-b border-divider_01 py-2 last:border-0"
                            >
                                <div className="flex items-center justify-between">
                                    {t.action === "reevaluation_request" ? (
                                        <Badge tone="yellow">
                                            Đề nghị xem xét lại
                                        </Badge>
                                    ) : t.action === "edited" ? (
                                        <Badge tone="blue">
                                            Đã chỉnh sửa phản ánh
                                        </Badge>
                                    ) : (
                                        <Badge
                                            tone={
                                                TRANG_THAI_PHAN_ANH_TONE[
                                                    t.status
                                                ]
                                            }
                                        >
                                            {
                                                TRANG_THAI_PHAN_ANH_LABEL[
                                                    t.status
                                                ]
                                            }
                                        </Badge>
                                    )}
                                    <span className="text-xs text-text_2">
                                        {formatDateTime(t.createdAt)}
                                    </span>
                                </div>
                                {t.note && (
                                    <p className="mt-1 text-sm">{t.note}</p>
                                )}
                                {t.action === "edited" &&
                                    t.patch &&
                                    Object.entries(t.patch).map(
                                        ([field, value]) => (
                                            <p
                                                key={field}
                                                className="mt-1 text-xs text-text_2"
                                            >
                                                {field}:{" "}
                                                {String(
                                                    t.previousSnapshot?.[
                                                        field
                                                    ] ?? "",
                                                )}
                                                {" → "}
                                                {String(value)}
                                            </p>
                                        ),
                                    )}
                                {!t.isPublic && (
                                    <p className="mt-1 text-xs text-text_3">
                                        (Ghi chú nội bộ)
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Dialog open={assigneeDialogOpen} onOpenChange={setAssigneeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chọn người phụ trách</DialogTitle>
                    </DialogHeader>
                    {wasAssigned && (
                        <div className="space-y-1.5">
                            <label className="text-sm text-text_2">
                                Lý do đổi người phụ trách
                            </label>
                            <Textarea
                                placeholder="Bắt buộc khi đổi người phụ trách hiện tại"
                                value={transferReason}
                                onChange={e => setTransferReason(e.target.value)}
                            />
                        </div>
                    )}
                    <Input
                        placeholder="Tìm theo tên cán bộ..."
                        value={assigneeSearch}
                        onChange={e => setAssigneeSearch(e.target.value)}
                    />
                    <div className="max-h-80 overflow-y-auto">
                        {assigneeLoading && <LoadingState />}
                        {!assigneeLoading && assigneeResults.length === 0 && (
                            <EmptyState label="Không tìm thấy cán bộ phù hợp" />
                        )}
                        {!assigneeLoading &&
                            assigneeResults.map(u => (
                                <button
                                    key={u.id}
                                    type="button"
                                    disabled={
                                        assigning ||
                                        (wasAssigned && !transferReason.trim())
                                    }
                                    className="block w-full border-b border-divider_01 py-2 text-left text-sm last:border-0 hover:bg-ng_10 disabled:opacity-50"
                                    onClick={() => handleAssign(u)}
                                >
                                    {u.displayName}
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa phản ánh?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa phản ánh này? Hành động này không
                        thể hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <div className="flex justify-between py-1 text-sm">
        <span className="text-text_2">{label}</span>
        <span className="max-w-[70%] text-right">{value}</span>
    </div>
);

export default ComplaintDetailPage;
