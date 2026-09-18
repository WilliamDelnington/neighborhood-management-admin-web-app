import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import {
    LoadingState,
    EmptyState,
    ErrorState,
} from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import { AppError, Neighborhood, NeighborhoodHistory, FileAsset } from "@dts";
import {
    createNeighborhoodAttachment,
    deleteNeighborhoodAttachment,
    fetchNeighborhoodAttachments,
    fetchNeighborhoodById,
    fetchNeighborhoodHistory,
    updateNeighborhood,
} from "@service/neighborhoodApi";
import NeighborhoodForm, {
    NeighborhoodFormValues,
    isNeighborhoodFormValid,
    toUpdateNeighborhoodInput,
} from "./NeighborhoodForm";
import NeighborhoodMembersPanel from "./NeighborhoodMembersPanel";

const toFormValues = (n: Neighborhood): NeighborhoodFormValues => ({
    name: n.name,
    code: n.code,
    sequence: String(n.sequence),
    active: n.active,
    status: n.status || (n.active ? "ACTIVE" : "INACTIVE"),
    effectiveFrom: n.effectiveFrom?.slice(0, 10) || "",
    effectiveTo: n.effectiveTo?.slice(0, 10) || "",
    provinceCode: n.provinceCode ? String(n.provinceCode) : "",
    provinceName: n.provinceName || "",
    wardCode: n.wardCode ? String(n.wardCode) : "",
    wardName: n.wardName || "",
    address: n.address || "",
    description: n.description || "",
    contactPhone: n.contactPhone || "",
    notes: n.notes || "",
    streetIds: n.streetIds?.map(street => street._id) || [],
    alleyDescriptions: n.alleyDescriptions?.join("\n") || "",
    boundaryType: n.boundaryType || "NONE",
    geometry: n.geometry,
});

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
};

const formatDate = (iso?: string) => {
    if (!iso) return "Chưa xác định";
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("vi-VN");
};

const NeighborhoodDetailPage: React.FC = () => (
    <AdminGuard permissions={["neighborhoods.read"]}>
        <NeighborhoodDetailContent />
    </AdminGuard>
);

const NeighborhoodDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canManage = usePermission("neighborhoods.manage");

    const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<NeighborhoodFormValues | null>(null);
    const [saving, setSaving] = useState(false);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
    const [attachmentForm, setAttachmentForm] = useState({ name: "", url: "", description: "" });
    const [savingAttachment, setSavingAttachment] = useState(false);
    const [organizationHistory, setOrganizationHistory] = useState<NeighborhoodHistory[]>([]);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchNeighborhoodById(id)
            .then(n => {
                setNeighborhood(n);
                setForm(toFormValues(n));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const loadAttachments = () => {
        if (!id) return;
        setAttachmentsLoading(true);
        fetchNeighborhoodAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    const loadOrganizationHistory = () => {
        if (!id) return;
        fetchNeighborhoodHistory(id)
            .then(setOrganizationHistory)
            .catch(() => setOrganizationHistory([]));
    };

    useEffect(() => {
        load();
        loadAttachments();
        loadOrganizationHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        if (!id || !form) return;
        if (!isNeighborhoodFormValid(form, "edit")) {
            toast.error("Vui lòng nhập tên tổ dân phố");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateNeighborhood(
                id,
                toUpdateNeighborhoodInput(form),
            );
            setNeighborhood(updated);
            setForm(toFormValues(updated));
            setEditing(false);
            loadOrganizationHistory();
            toast.success("Đã cập nhật tổ dân phố");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddAttachment = async () => {
        if (!id || !attachmentForm.name.trim() || !attachmentForm.url.trim()) {
            toast.error("Vui lòng nhập tên và đường dẫn tài liệu");
            return;
        }
        try {
            setSavingAttachment(true);
            await createNeighborhoodAttachment(id, {
                name: attachmentForm.name.trim(),
                url: attachmentForm.url.trim(),
                description: attachmentForm.description.trim() || undefined,
            });
            setAttachmentForm({ name: "", url: "", description: "" });
            loadAttachments();
            loadOrganizationHistory();
            toast.success("Đã thêm hồ sơ đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingAttachment(false);
        }
    };

    const handleDeleteAttachment = async (fileId: string) => {
        if (!id) return;
        try {
            setDeletingAttachmentId(fileId);
            await deleteNeighborhoodAttachment(id, fileId);
            loadAttachments();
            loadOrganizationHistory();
            toast.success("Đã xóa hồ sơ đính kèm");
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
                    onClick={() => navigate("/neighborhoods")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Tổ dân phố</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && neighborhood && form && (
                <>
                    <div className="rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {neighborhood.code} — {neighborhood.name}
                            </h2>
                            <Badge tone={neighborhood.status === "ACTIVE" ? "green" : "gray"}>
                                {{
                                    ACTIVE: "Đang hoạt động",
                                    INACTIVE: "Ngừng hoạt động",
                                    MERGED: "Đã sáp nhập",
                                    CLOSED: "Đã giải thể",
                                }[neighborhood.status]}
                            </Badge>
                        </div>

                        {editing ? (
                            <>
                                <NeighborhoodForm
                                    values={form}
                                    onChange={setForm}
                                    mode="edit"
                                />
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setForm(toFormValues(neighborhood));
                                            setEditing(false);
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button loading={saving} onClick={handleSave}>
                                        Lưu
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <InfoRow
                                    label="Tỉnh/Thành phố"
                                    value={neighborhood.provinceName || "Chưa gán"}
                                />
                                <InfoRow
                                    label="Phường/Xã"
                                    value={neighborhood.wardName || "Chưa gán"}
                                />
                                <InfoRow
                                    label="Địa chỉ"
                                    value={neighborhood.address || "Chưa có"}
                                />
                                <InfoRow
                                    label="Hiệu lực"
                                    value={`${formatDate(neighborhood.effectiveFrom)} → ${formatDate(neighborhood.effectiveTo)}`}
                                />
                                <InfoRow
                                    label="Tuyến đường phụ trách"
                                    value={neighborhood.streetIds?.map(street => street.name).join(", ") || "Chưa gán"}
                                />
                                <InfoRow
                                    label="Hẻm/ngõ"
                                    value={neighborhood.alleyDescriptions?.join(", ") || "Chưa có"}
                                />
                                <InfoRow
                                    label="Ranh giới"
                                    value={
                                        neighborhood.boundaryType === "GEOJSON"
                                            ? "Đã có dữ liệu GIS"
                                            : neighborhood.boundaryType === "DOCUMENT"
                                              ? "Theo hồ sơ đính kèm"
                                              : "Chưa có dữ liệu GIS/hồ sơ"
                                    }
                                />
                                <InfoRow
                                    label="Số Nhà số"
                                    value={String(neighborhood.houseCount || 0)}
                                />
                                <div className="mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/houses?neighborhoodId=${neighborhood._id}`)}
                                    >
                                        Xem danh sách Nhà số thuộc Tổ
                                    </Button>
                                </div>
                                <InfoRow
                                    label="Số điện thoại liên hệ"
                                    value={neighborhood.contactPhone || "Chưa có"}
                                />
                                <InfoRow
                                    label="Mô tả"
                                    value={neighborhood.description || "Chưa có"}
                                />
                                <InfoRow
                                    label="Ghi chú"
                                    value={neighborhood.notes || "Chưa có"}
                                />

                                {canManage && (
                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setEditing(true)}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h2 className="mb-2 text-base font-semibold">Hồ sơ quyết định / ranh giới</h2>
                        {canManage && (
                            <div className="mb-3 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                                <Input placeholder="Tên tài liệu" value={attachmentForm.name} onChange={e => setAttachmentForm({ ...attachmentForm, name: e.target.value })} />
                                <Input placeholder="https://..." value={attachmentForm.url} onChange={e => setAttachmentForm({ ...attachmentForm, url: e.target.value })} />
                                <Button loading={savingAttachment} onClick={handleAddAttachment}>Thêm</Button>
                                <Textarea className="md:col-span-3" placeholder="Mô tả tài liệu (không bắt buộc)" value={attachmentForm.description} onChange={e => setAttachmentForm({ ...attachmentForm, description: e.target.value })} />
                            </div>
                        )}
                        <AttachmentsPanel
                            className=""
                            title=""
                            attachments={attachments}
                            loading={attachmentsLoading}
                            canManage={canManage}
                            deletingId={deletingAttachmentId}
                            onDelete={handleDeleteAttachment}
                            emptyLabel="Chưa có hồ sơ đính kèm"
                        />
                    </div>

                    <NeighborhoodMembersPanel
                        neighborhood={neighborhood}
                        onMutated={loadOrganizationHistory}
                    />
                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h2 className="mb-2 text-base font-semibold">Lịch sử thay đổi Tổ</h2>
                        {organizationHistory.length === 0 && (
                            <EmptyState label="Chưa có lịch sử thay đổi" />
                        )}
                        {organizationHistory.map(item => (
                            <div key={item._id} className="border-b border-divider_01 py-2 text-sm last:border-0">
                                <div className="font-medium">
                                    {{
                                        CREATED: "Tạo Tổ dân phố",
                                        UPDATED: "Cập nhật thông tin",
                                        STATUS_CHANGED: "Thay đổi trạng thái",
                                        TERM_CREATED: "Tạo nhiệm kỳ",
                                        TERM_UPDATED: "Cập nhật nhiệm kỳ",
                                        LEADER_ASSIGNED: "Phân công tổ trưởng",
                                        LEADER_UNASSIGNED: "Kết thúc phân công tổ trưởng",
                                        COLEADER_ASSIGNED: "Phân công tổ phó",
                                        COLEADER_UNASSIGNED: "Kết thúc phân công tổ phó",
                                        COLLABORATOR_ASSIGNED: "Phân công cộng tác viên",
                                        COLLABORATOR_UNASSIGNED: "Kết thúc phân công cộng tác viên",
                                        ATTACHMENT_ADDED: "Thêm hồ sơ đính kèm",
                                        ATTACHMENT_REMOVED: "Xóa hồ sơ đính kèm",
                                    }[item.action] || item.action}
                                </div>
                                <div className="text-xs text-text_2">
                                    {formatDateTime(item.createdAt)}
                                    {item.actorId?.displayName ? ` · ${item.actorId.displayName}` : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <div className="flex justify-between border-b border-divider_01 py-2 text-sm last:border-0">
        <span className="text-text_2">{label}</span>
        <span>{value}</span>
    </div>
);

export default NeighborhoodDetailPage;
