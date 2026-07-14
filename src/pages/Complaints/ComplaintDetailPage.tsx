import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
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
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import {
    AppError,
    AssignableStaff,
    Complaint,
    ComplaintTimelineEntry,
    TrangThaiPhanAnh,
} from "@dts";
import {
    NHOM_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import {
    assignComplaint,
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
    const canAssign = usePermission("complaints.assign");
    const canUpdateStatus = usePermission("complaints.update_status");

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [timeline, setTimeline] = useState<ComplaintTimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [newStatus, setNewStatus] = useState<TrangThaiPhanAnh | "">("");
    const [note, setNote] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [assigneeStaff, setAssigneeStaff] = useState<AssignableStaff[]>([]);
    const [assigneeLoading, setAssigneeLoading] = useState(false);
    const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
    const [assigning, setAssigning] = useState(false);

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
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!assigneeDialogOpen) return;
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

    const handleAssign = async (staff: AssignableStaff) => {
        if (!id) return;
        try {
            setAssigning(true);
            const updated = await assignComplaint(
                id,
                staff.id,
                expectedCompletionDate
                    ? new Date(expectedCompletionDate).toISOString()
                    : undefined,
            );
            setComplaint(updated);
            setAssigneeDialogOpen(false);
            toast.success(`Đã giao cho ${staff.displayName}`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigning(false);
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

    return (
        <div>
            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && complaint && (
                <>
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h1 className="text-lg font-semibold">
                                {complaint.code}
                            </h1>
                            <Badge tone={TRANG_THAI_PHAN_ANH_TONE[complaint.status]}>
                                {TRANG_THAI_PHAN_ANH_LABEL[complaint.status]}
                            </Badge>
                        </div>
                        <div className="text-sm font-medium">
                            {complaint.title}
                        </div>
                        <div className="mt-1 text-xs text-text_2">
                            {NHOM_PHAN_ANH_LABEL[complaint.category]}
                            {complaint.area ? ` • ${complaint.area}` : ""}
                        </div>
                        <p className="mt-3 text-sm">{complaint.content}</p>

                        {complaint.images.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {complaint.images.map(img => (
                                    <img
                                        key={img}
                                        src={img}
                                        alt="Ảnh đính kèm"
                                        className="h-[88px] w-[88px] rounded-lg object-cover"
                                    />
                                ))}
                            </div>
                        )}

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
                            <InfoRow
                                label="Người phụ trách"
                                value={assigneeName || "Chưa phân công"}
                            />
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
                                    ).map(([key, label]) => (
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
                                    <Badge tone={TRANG_THAI_PHAN_ANH_TONE[t.status]}>
                                        {TRANG_THAI_PHAN_ANH_LABEL[t.status]}
                                    </Badge>
                                    <span className="text-xs text-text_2">
                                        {formatDateTime(t.createdAt)}
                                    </span>
                                </div>
                                {t.note && (
                                    <p className="mt-1 text-sm">{t.note}</p>
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
                                    disabled={assigning}
                                    className="block w-full border-b border-divider_01 py-2 text-left text-sm last:border-0 hover:bg-ng_10 disabled:opacity-50"
                                    onClick={() => handleAssign(u)}
                                >
                                    {u.displayName}
                                </button>
                            ))}
                    </div>
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
