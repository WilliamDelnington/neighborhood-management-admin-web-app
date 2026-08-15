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
    ComplaintTypeDefinition,
    FileAsset,
} from "@dts";
import {
    NHOM_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import {
    assignComplaint,
    choosePersonInCharge,
    deleteComplaint,
    fetchComplaintAttachments,
    fetchComplaintDetail,
    receiveComplaint,
    requestComplaintInfo,
} from "@service/complaintApi";
import { fetchComplaintTypeDefinitions } from "@service/complaintTypeApi";
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
    const canDelete = usePermission("complaints.delete");

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [timeline, setTimeline] = useState<ComplaintTimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);

    // Danh sach day du (ke ca da ngung dung) de hien nhan nhom phan anh dung
    // ten quan tri duoc, thay vi bang tinh NHOM_PHAN_ANH_LABEL - xem cung
    // pattern trong ComplaintListPage.tsx.
    const [complaintTypes, setComplaintTypes] = useState<
        ComplaintTypeDefinition[]
    >([]);
    useEffect(() => {
        fetchComplaintTypeDefinitions({ limit: 200 })
            .then(res => setComplaintTypes(res.items))
            .catch(() => {
                /* giu fallback tinh (NHOM_PHAN_ANH_LABEL) neu goi API loi */
            });
    }, []);
    const categoryLabel = (key: string) =>
        complaintTypes.find(t => t.key === key)?.name ||
        NHOM_PHAN_ANH_LABEL[key] ||
        key;

    const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [assigneeStaff, setAssigneeStaff] = useState<AssignableStaff[]>([]);
    const [assigneeLoading, setAssigneeLoading] = useState(false);
    const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
    const [transferReason, setTransferReason] = useState("");
    const [assigning, setAssigning] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Luong "Tiep nhan" / "Chon nguoi phu trach" - chi hien khi phan anh dang
    // "moi_tiep_nhan", tach rieng khoi dialog "Phân công xử lý" o tren (giu
    // nguyen card do khong doi, van dung endpoint /assign de tai phan cong).
    const [receiving, setReceiving] = useState(false);
    const [chooseDialogOpen, setChooseDialogOpen] = useState(false);
    const [chooseSearch, setChooseSearch] = useState("");
    const [chooseStaff, setChooseStaff] = useState<AssignableStaff[]>([]);
    const [chooseLoading, setChooseLoading] = useState(false);
    const [choosing, setChoosing] = useState(false);

    // "Yeu cau bo sung thong tin" - chi hien cung nhom voi Tiep nhan/Chon
    // nguoi phu trach (canAssign, "moi_tiep_nhan"), chuyen phan anh sang
    // "can_bo_sung" thay vi tiep nhan/chon nguoi phu trach ngay.
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);
    const [infoContent, setInfoContent] = useState("");
    const [requestingInfo, setRequestingInfo] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchComplaintDetail(id)
            .then(res => {
                setComplaint(res.complaint);
                setTimeline(res.timeline);
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

    useEffect(() => {
        if (!chooseDialogOpen) return;
        setChooseLoading(true);
        fetchAssignableStaff()
            .then(setChooseStaff)
            .catch(() => setChooseStaff([]))
            .finally(() => setChooseLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chooseDialogOpen]);

    const chooseResults = chooseStaff.filter(s =>
        s.displayName.toLowerCase().includes(chooseSearch.toLowerCase()),
    );

    const handleRequestInfo = async () => {
        if (!id) return;
        if (!infoContent.trim()) {
            toast.error("Vui lòng nhập thông tin cần bổ sung");
            return;
        }
        try {
            setRequestingInfo(true);
            const updated = await requestComplaintInfo(
                id,
                infoContent.trim(),
            );
            setComplaint(updated);
            setInfoDialogOpen(false);
            setInfoContent("");
            toast.success("Đã yêu cầu bổ sung thông tin");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRequestingInfo(false);
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

    const handleReceive = async () => {
        if (!id) return;
        try {
            setReceiving(true);
            const updated = await receiveComplaint(id);
            setComplaint(updated);
            toast.success("Đã tiếp nhận phản ánh");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setReceiving(false);
        }
    };

    const handleChoosePersonInCharge = async (staff: AssignableStaff) => {
        if (!id) return;
        try {
            setChoosing(true);
            const updated = await choosePersonInCharge(id, staff.id);
            setComplaint(updated);
            setChooseDialogOpen(false);
            toast.success(`Đã chọn ${staff.displayName} phụ trách`);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setChoosing(false);
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
                            {categoryLabel(complaint.category)}
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

                    {canAssign && complaint.canReceiveOrChooseAssignee && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold">
                                Tiếp nhận phản ánh
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    loading={receiving}
                                    onClick={handleReceive}
                                >
                                    Tiếp nhận
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setChooseDialogOpen(true)}
                                >
                                    Chọn người phụ trách
                                </Button>
                                {/* Yeu cau bo sung thong tin: chi con dung
                                duoc khi phan anh CON dang "moi_tiep_nhan"
                                (backend requestComplaintInfo van gioi han
                                nhu vay) - khac Tiep nhan/Chon nguoi phu
                                trach, co the lap lai qua nhieu vong doi cua
                                phan anh (xem canReceiveOrChooseAssignee). */}
                                {complaint.status === "moi_tiep_nhan" && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setInfoDialogOpen(true)
                                        }
                                    >
                                        Yêu cầu bổ sung thông tin
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

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

            <Dialog open={chooseDialogOpen} onOpenChange={setChooseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chọn người phụ trách</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Tìm theo tên cán bộ..."
                        value={chooseSearch}
                        onChange={e => setChooseSearch(e.target.value)}
                    />
                    <div className="max-h-80 overflow-y-auto">
                        {chooseLoading && <LoadingState />}
                        {!chooseLoading && chooseResults.length === 0 && (
                            <EmptyState label="Không tìm thấy cán bộ phù hợp" />
                        )}
                        {!chooseLoading &&
                            chooseResults.map(u => (
                                <button
                                    key={u.id}
                                    type="button"
                                    disabled={choosing}
                                    className="block w-full border-b border-divider_01 py-2 text-left text-sm last:border-0 hover:bg-ng_10 disabled:opacity-50"
                                    onClick={() => handleChoosePersonInCharge(u)}
                                >
                                    {u.displayName}
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yêu cầu bổ sung thông tin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <label className="text-sm text-text_2">
                            Thông tin cần người gửi bổ sung
                        </label>
                        <Textarea
                            placeholder="Ví dụ: Vui lòng cung cấp ảnh chụp vị trí cụ thể..."
                            value={infoContent}
                            onChange={e => setInfoContent(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setInfoDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={requestingInfo}
                            disabled={!infoContent.trim()}
                            onClick={handleRequestInfo}
                        >
                            Gửi yêu cầu
                        </Button>
                    </DialogFooter>
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
