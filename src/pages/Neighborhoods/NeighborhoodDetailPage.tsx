import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    LoadingState,
    EmptyState,
    ErrorState,
} from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import {
    AppError,
    Neighborhood,
    NeighborhoodLeaderAssignment,
    NeighborhoodColeaderAssignment,
    NeighborhoodHistory,
    NeighborhoodCollaboratorAssignment,
    NeighborhoodCollaboratorScope,
    NeighborhoodTerm,
    NeighborhoodTermStatus,
    FileAsset,
    House,
    InspectionCampaign,
    User,
} from "@dts";
import {
    assignNeighborhoodColeader,
    assignNeighborhoodCollaborator,
    assignNeighborhoodLeader,
    createNeighborhoodAttachment,
    createNeighborhoodTerm,
    deleteNeighborhoodAttachment,
    fetchNeighborhoodAttachments,
    fetchNeighborhoodById,
    fetchNeighborhoodColeaders,
    fetchNeighborhoodCollaborators,
    fetchNeighborhoodLeaderHistory,
    fetchNeighborhoodHistory,
    fetchNeighborhoodTerms,
    unassignNeighborhoodColeader,
    unassignNeighborhoodCollaborator,
    updateNeighborhoodTerm,
    updateNeighborhood,
} from "@service/neighborhoodApi";
import { fetchUsers } from "@service/userApi";
import { fetchHouses } from "@service/houseApi";
import { fetchInspectionCampaigns } from "@service/inspectionApi";
import NeighborhoodForm, {
    NeighborhoodFormValues,
    isNeighborhoodFormValid,
    toUpdateNeighborhoodInput,
} from "./NeighborhoodForm";

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

const TERM_STATUS_LABEL: Record<NeighborhoodTermStatus, string> = {
    PLANNED: "Dự kiến",
    ACTIVE: "Đang diễn ra",
    ENDED: "Đã kết thúc",
    CANCELLED: "Đã hủy",
};

const COLLABORATOR_SCOPE_LABEL: Record<NeighborhoodCollaboratorScope, string> = {
    WHOLE_NEIGHBORHOOD: "Toàn Tổ",
    STREET: "Một tuyến đường",
    HOUSE_GROUP: "Một nhóm Nhà số",
    CAMPAIGN: "Một chiến dịch",
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

    const [candidateLeaders, setCandidateLeaders] = useState<User[]>([]);
    const [leaderToAssign, setLeaderToAssign] = useState("");
    const [assigningLeader, setAssigningLeader] = useState(false);
    const [unassigningLeader, setUnassigningLeader] = useState(false);

    const [history, setHistory] = useState<NeighborhoodLeaderAssignment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [candidateColeaders, setCandidateColeaders] = useState<User[]>([]);
    const [coleaders, setColeaders] = useState<NeighborhoodColeaderAssignment[]>(
        [],
    );
    const [coleadersLoading, setColeadersLoading] = useState(true);
    const [coleaderToAssign, setColeaderToAssign] = useState("");
    const [assigningColeader, setAssigningColeader] = useState(false);
    const [unassigningColeaderId, setUnassigningColeaderId] = useState<
        string | null
    >(null);
    const [terms, setTerms] = useState<NeighborhoodTerm[]>([]);
    const [termsLoading, setTermsLoading] = useState(true);
    const [termFormOpen, setTermFormOpen] = useState(false);
    const [termForm, setTermForm] = useState({
        name: "",
        startAt: "",
        endAt: "",
        status: "PLANNED" as NeighborhoodTermStatus,
        notes: "",
    });
    const [savingTerm, setSavingTerm] = useState(false);
    const [selectedTermId, setSelectedTermId] = useState("");
    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
    const [attachmentForm, setAttachmentForm] = useState({ name: "", url: "", description: "" });
    const [savingAttachment, setSavingAttachment] = useState(false);
    const [organizationHistory, setOrganizationHistory] = useState<NeighborhoodHistory[]>([]);
    const [candidateCollaborators, setCandidateCollaborators] = useState<User[]>([]);
    const [collaborators, setCollaborators] = useState<NeighborhoodCollaboratorAssignment[]>([]);
    const [collaboratorsLoading, setCollaboratorsLoading] = useState(true);
    const [scopeHouses, setScopeHouses] = useState<House[]>([]);
    const [scopeCampaigns, setScopeCampaigns] = useState<InspectionCampaign[]>([]);
    const [collaboratorForm, setCollaboratorForm] = useState({
        collaboratorUserId: "",
        scopeType: "WHOLE_NEIGHBORHOOD" as NeighborhoodCollaboratorScope,
        streetId: "",
        houseIds: [] as string[],
        campaignId: "",
        startAt: "",
        endAt: "",
        note: "",
    });
    const [savingCollaborator, setSavingCollaborator] = useState(false);
    const [unassigningCollaboratorId, setUnassigningCollaboratorId] = useState<string | null>(null);

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

    const loadCandidateLeaders = () => {
        fetchUsers(1, 50, undefined, "neighborhood_leader")
            .then(res =>
                setCandidateLeaders(
                    res.items.filter(u => u.status === "active"),
                ),
            )
            .catch(() => setCandidateLeaders([]));
    };

    const loadHistory = () => {
        if (!id) return;
        setHistoryLoading(true);
        fetchNeighborhoodLeaderHistory(id)
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setHistoryLoading(false));
    };

    const loadCandidateColeaders = () => {
        fetchUsers(1, 50, undefined, "neighborhood_coleader")
            .then(res =>
                setCandidateColeaders(
                    res.items.filter(u => u.status === "active"),
                ),
            )
            .catch(() => setCandidateColeaders([]));
    };

    const loadColeaders = () => {
        if (!id) return;
        setColeadersLoading(true);
        fetchNeighborhoodColeaders(id)
            .then(setColeaders)
            .catch(() => setColeaders([]))
            .finally(() => setColeadersLoading(false));
    };

    const loadTerms = () => {
        if (!id) return;
        setTermsLoading(true);
        fetchNeighborhoodTerms(id)
            .then(items => {
                setTerms(items);
                const activeTerm = items.find(term => term.status === "ACTIVE");
                setSelectedTermId(current => current || activeTerm?._id || "");
            })
            .catch(() => setTerms([]))
            .finally(() => setTermsLoading(false));
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

    const loadCollaborators = () => {
        if (!id) return;
        setCollaboratorsLoading(true);
        fetchNeighborhoodCollaborators(id)
            .then(setCollaborators)
            .catch(() => setCollaborators([]))
            .finally(() => setCollaboratorsLoading(false));
    };

    useEffect(() => {
        load();
        loadCandidateLeaders();
        loadHistory();
        loadCandidateColeaders();
        loadColeaders();
        loadTerms();
        loadAttachments();
        loadOrganizationHistory();
        loadCollaborators();
        fetchUsers(1, 100, undefined, "neighborhood_collaborator")
            .then(result => setCandidateCollaborators(result.items.filter(user => user.status === "active")))
            .catch(() => setCandidateCollaborators([]));
        if (id) {
            fetchHouses({ neighborhoodId: id, limit: 200 })
                .then(result => setScopeHouses(result.items))
                .catch(() => setScopeHouses([]));
            fetchInspectionCampaigns({ page: 1, status: "ACTIVE" })
                .then(result => setScopeCampaigns(result.items))
                .catch(() => setScopeCampaigns([]));
        }
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

    const handleAssignLeader = async () => {
        if (!id || !leaderToAssign) return;
        // To truong khong con la mot phan cong "doc lap" voi nhiem ky nua -
        // bat buoc phai co nhiem ky dang hoat dong duoc chon truoc khi gan
        // (xem ghi chu o assignLeaderSchema/assignNeighborhoodLeader o backend).
        if (!selectedTermId) {
            toast.error(
                "Vui lòng tạo và chọn nhiệm kỳ đang hoạt động trước khi gán tổ trưởng",
            );
            return;
        }
        try {
            setAssigningLeader(true);
            const updated = await assignNeighborhoodLeader(
                id,
                leaderToAssign,
                undefined,
                { termId: selectedTermId },
            );
            setNeighborhood(updated);
            setLeaderToAssign("");
            loadHistory();
            loadOrganizationHistory();
            toast.success("Đã gán tổ trưởng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigningLeader(false);
        }
    };

    const handleUnassignLeader = async () => {
        if (!id) return;
        try {
            setUnassigningLeader(true);
            const updated = await assignNeighborhoodLeader(id, null);
            setNeighborhood(updated);
            loadHistory();
            loadOrganizationHistory();
            toast.success("Đã bỏ gán tổ trưởng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUnassigningLeader(false);
        }
    };

    const handleAssignColeader = async () => {
        if (!id || !coleaderToAssign) return;
        // Cung quy tac voi to truong - xem ghi chu trong handleAssignLeader.
        if (!selectedTermId) {
            toast.error(
                "Vui lòng tạo và chọn nhiệm kỳ đang hoạt động trước khi gán tổ phó",
            );
            return;
        }
        try {
            setAssigningColeader(true);
            await assignNeighborhoodColeader(
                id,
                coleaderToAssign,
                undefined,
                { termId: selectedTermId },
            );
            setColeaderToAssign("");
            loadColeaders();
            loadOrganizationHistory();
            toast.success("Đã gán tổ phó");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigningColeader(false);
        }
    };

    const handleCreateTerm = async () => {
        if (!id || !termForm.name.trim() || !termForm.startAt || !termForm.endAt) {
            toast.error("Vui lòng nhập đủ tên và thời gian nhiệm kỳ");
            return;
        }
        try {
            setSavingTerm(true);
            await createNeighborhoodTerm(id, {
                ...termForm,
                name: termForm.name.trim(),
                notes: termForm.notes.trim() || undefined,
            });
            setTermForm({ name: "", startAt: "", endAt: "", status: "PLANNED", notes: "" });
            setTermFormOpen(false);
            loadTerms();
            loadOrganizationHistory();
            toast.success("Đã tạo nhiệm kỳ");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingTerm(false);
        }
    };

    const handleEndTerm = async (term: NeighborhoodTerm) => {
        if (!id) return;
        try {
            await updateNeighborhoodTerm(id, term._id, { status: "ENDED" });
            loadTerms();
            load();
            loadColeaders();
            loadOrganizationHistory();
            toast.success("Đã kết thúc nhiệm kỳ và thu hồi phân công liên quan");
        } catch (err) {
            toast.error((err as AppError).message);
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

    const handleUnassignColeader = async (coleaderUserId: string) => {
        if (!id) return;
        try {
            setUnassigningColeaderId(coleaderUserId);
            await unassignNeighborhoodColeader(id, coleaderUserId);
            loadColeaders();
            loadOrganizationHistory();
            toast.success("Đã bỏ gán tổ phó");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUnassigningColeaderId(null);
        }
    };

    const handleAssignCollaborator = async () => {
        if (!id || !collaboratorForm.collaboratorUserId) {
            toast.error("Vui lòng chọn cộng tác viên");
            return;
        }
        try {
            setSavingCollaborator(true);
            await assignNeighborhoodCollaborator(id, {
                collaboratorUserId: collaboratorForm.collaboratorUserId,
                scopeType: collaboratorForm.scopeType,
                streetId: collaboratorForm.streetId || undefined,
                houseIds: collaboratorForm.houseIds,
                campaignId: collaboratorForm.campaignId || undefined,
                startAt: collaboratorForm.startAt || undefined,
                endAt: collaboratorForm.endAt || undefined,
                note: collaboratorForm.note.trim() || undefined,
            });
            setCollaboratorForm({
                collaboratorUserId: "",
                scopeType: "WHOLE_NEIGHBORHOOD",
                streetId: "",
                houseIds: [],
                campaignId: "",
                startAt: "",
                endAt: "",
                note: "",
            });
            loadCollaborators();
            loadOrganizationHistory();
            toast.success("Đã phân công cộng tác viên");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingCollaborator(false);
        }
    };

    const handleUnassignCollaborator = async (assignmentId: string) => {
        if (!id) return;
        try {
            setUnassigningCollaboratorId(assignmentId);
            await unassignNeighborhoodCollaborator(id, assignmentId);
            loadCollaborators();
            loadOrganizationHistory();
            toast.success("Đã kết thúc phân công cộng tác viên");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUnassigningCollaboratorId(null);
        }
    };

    const otherCandidates = candidateLeaders.filter(
        u => u.id !== neighborhood?.leaderUserId?._id,
    );
    const otherCandidateColeaders = candidateColeaders.filter(
        u => !coleaders.some(c => c.coleaderUserId?._id === u.id),
    );
    const assignableTerms = terms.filter(term => term.status === "ACTIVE");
    const activeLeaderAssignment = history.find(item => !item.unassignedAt);

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
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold">Nhiệm kỳ</h2>
                                <p className="text-xs text-text_2">
                                    Kết thúc nhiệm kỳ sẽ thu hồi phân công, không xóa tài khoản hoặc lịch sử.
                                </p>
                            </div>
                            {canManage && (
                                <Button size="sm" variant="outline" onClick={() => setTermFormOpen(value => !value)}>
                                    <Plus className="mr-1 h-4 w-4" /> Thêm nhiệm kỳ
                                </Button>
                            )}
                        </div>
                        {termFormOpen && (
                            <div className="mb-4 grid gap-3 rounded-lg bg-bg_2 p-3 md:grid-cols-2">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Tên nhiệm kỳ</Label>
                                    <Input value={termForm.name} onChange={e => setTermForm({ ...termForm, name: e.target.value })} placeholder="VD: Nhiệm kỳ 2026–2029" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Từ ngày</Label>
                                    <Input type="date" value={termForm.startAt} onChange={e => setTermForm({ ...termForm, startAt: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Đến ngày</Label>
                                    <Input type="date" value={termForm.endAt} onChange={e => setTermForm({ ...termForm, endAt: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Trạng thái</Label>
                                    <Select value={termForm.status} onValueChange={value => setTermForm({ ...termForm, status: value as NeighborhoodTermStatus })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PLANNED">Dự kiến</SelectItem>
                                            <SelectItem value="ACTIVE">Đang diễn ra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Ghi chú</Label>
                                    <Input value={termForm.notes} onChange={e => setTermForm({ ...termForm, notes: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <Button loading={savingTerm} onClick={handleCreateTerm}>Lưu nhiệm kỳ</Button>
                                </div>
                            </div>
                        )}
                        {termsLoading && <LoadingState />}
                        {!termsLoading && terms.length === 0 && <EmptyState label="Chưa có nhiệm kỳ" />}
                        {!termsLoading && terms.map(term => (
                            <div key={term._id} className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0">
                                <div>
                                    <div className="font-medium">{term.name}</div>
                                    <div className="text-xs text-text_2">
                                        {formatDate(term.startAt)} → {formatDate(term.endAt)} · {TERM_STATUS_LABEL[term.status]}
                                    </div>
                                </div>
                                {canManage && term.status === "ACTIVE" && (
                                    <Button size="sm" variant="outline" onClick={() => handleEndTerm(term)}>Kết thúc</Button>
                                )}
                            </div>
                        ))}
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

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h2 className="mb-2 text-base font-semibold">
                            Thông tin tổ trưởng
                        </h2>
                        {canManage && assignableTerms.length > 0 && (
                            <div className="mb-3 max-w-md space-y-1.5">
                                <Label>
                                    Nhiệm kỳ áp dụng cho phân công mới{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                                    <SelectTrigger><SelectValue placeholder="Chọn nhiệm kỳ" /></SelectTrigger>
                                    <SelectContent>
                                        {assignableTerms.map(term => (
                                            <SelectItem key={term._id} value={term._id}>
                                                {term.name} · {formatDate(term.endAt)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-text_2">
                                    Bắt buộc phải chọn một nhiệm kỳ trước khi
                                    gán tổ trưởng/tổ phó mới - tổ trưởng/tổ
                                    phó luôn gắn với một nhiệm kỳ cụ thể, khi
                                    nhiệm kỳ kết thúc họ sẽ tự động thôi quản
                                    lý tổ dân phố này.
                                </p>
                            </div>
                        )}
                        {canManage && assignableTerms.length === 0 && (
                            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                Tổ dân phố này chưa có nhiệm kỳ đang hoạt
                                động. Vui lòng tạo và kích hoạt một nhiệm kỳ ở
                                mục &quot;Nhiệm kỳ&quot; bên trên trước khi có
                                thể gán tổ trưởng/tổ phó.
                            </div>
                        )}
                        {neighborhood.leaderUserId ? (
                            <div className="flex items-center justify-between border-b border-divider_01 py-2">
                                <div className="text-sm">
                                    <div className="font-medium">
                                        {neighborhood.leaderUserId.displayName}
                                    </div>
                                    {neighborhood.leaderUserId.phone && (
                                        <div className="text-xs text-text_2">
                                            {neighborhood.leaderUserId.phone}
                                        </div>
                                    )}
                                    {activeLeaderAssignment?.termId && (
                                        <div className="text-xs text-text_2">
                                            {activeLeaderAssignment.termId.name} · đến {formatDate(activeLeaderAssignment.endAt)}
                                        </div>
                                    )}
                                </div>
                                {canManage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        loading={unassigningLeader}
                                        onClick={handleUnassignLeader}
                                    >
                                        Bỏ gán
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="mb-2 text-xs text-text_2">
                                Chưa có tổ trưởng
                            </div>
                        )}

                        {canManage && (
                            <div className="mt-3 flex items-end gap-2">
                                <div className="flex-1 space-y-1.5">
                                    <Label>
                                        {neighborhood.leaderUserId
                                            ? "Đổi sang tổ trưởng khác"
                                            : "Gán tổ trưởng"}
                                    </Label>
                                    <Select
                                        value={leaderToAssign}
                                        onValueChange={setLeaderToAssign}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn tài khoản tổ trưởng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {otherCandidates.map(u => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.displayName}
                                                    {u.phone
                                                        ? ` · ${u.phone}`
                                                        : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-text_2">
                                        Nếu tài khoản này đang phụ trách tổ dân
                                        phố khác, họ sẽ được chuyển sang tổ
                                        này.
                                    </p>
                                </div>
                                <Button
                                    loading={assigningLeader}
                                    disabled={!leaderToAssign || !selectedTermId}
                                    onClick={handleAssignLeader}
                                >
                                    Gán
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h2 className="mb-2 text-base font-semibold">
                            Tổ phó
                        </h2>
                        {coleadersLoading && <LoadingState />}
                        {!coleadersLoading && coleaders.length === 0 && (
                            <div className="mb-2 text-xs text-text_2">
                                Chưa có tổ phó
                            </div>
                        )}
                        {!coleadersLoading &&
                            coleaders.map(c => (
                                <div
                                    key={c._id}
                                    className="flex items-center justify-between border-b border-divider_01 py-2 last:border-0"
                                >
                                    <div className="text-sm">
                                        <div className="font-medium">
                                            {c.coleaderUserId?.displayName ||
                                                "(tài khoản đã xóa)"}
                                        </div>
                                        {c.coleaderUserId?.phone && (
                                            <div className="text-xs text-text_2">
                                                {c.coleaderUserId.phone}
                                            </div>
                                        )}
                                        {c.termId && (
                                            <div className="text-xs text-text_2">
                                                {c.termId.name} · đến {formatDate(c.endAt)}
                                            </div>
                                        )}
                                    </div>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={
                                                unassigningColeaderId ===
                                                c.coleaderUserId?._id
                                            }
                                            onClick={() =>
                                                c.coleaderUserId &&
                                                handleUnassignColeader(
                                                    c.coleaderUserId._id,
                                                )
                                            }
                                        >
                                            Bỏ gán
                                        </Button>
                                    )}
                                </div>
                            ))}

                        {canManage && (
                            <div className="mt-3 flex items-end gap-2">
                                <div className="flex-1 space-y-1.5">
                                    <Label>Thêm tổ phó</Label>
                                    <Select
                                        value={coleaderToAssign}
                                        onValueChange={setColeaderToAssign}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn tài khoản tổ phó" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {otherCandidateColeaders.map(u => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.displayName}
                                                    {u.phone
                                                        ? ` · ${u.phone}`
                                                        : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-text_2">
                                        Một tổ dân phố có thể có nhiều tổ phó,
                                        nhưng một người chỉ có thể là tổ phó
                                        của một tổ tại một thời điểm.
                                    </p>
                                </div>
                                <Button
                                    loading={assigningColeader}
                                    disabled={!coleaderToAssign || !selectedTermId}
                                    onClick={handleAssignColeader}
                                >
                                    Gán
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h2 className="mb-1 text-base font-semibold">Cộng tác viên</h2>
                        <p className="mb-3 text-xs text-text_2">
                            Phạm vi hẹp không tự mở quyền xem toàn Tổ; chiến dịch vẫn kiểm tra từng Nhà được giao.
                        </p>
                        {collaboratorsLoading && <LoadingState />}
                        {!collaboratorsLoading && collaborators.length === 0 && (
                            <EmptyState label="Chưa có cộng tác viên được phân công" />
                        )}
                        {!collaboratorsLoading && collaborators.map(assignment => (
                            <div key={assignment._id} className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0">
                                <div>
                                    <div className="font-medium">
                                        {assignment.collaboratorUserId?.displayName || "(tài khoản đã xóa)"}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {COLLABORATOR_SCOPE_LABEL[assignment.scopeType]}
                                        {assignment.streetId ? ` · ${assignment.streetId.name}` : ""}
                                        {assignment.houseIds.length ? ` · ${assignment.houseIds.length} Nhà số` : ""}
                                        {assignment.campaignId ? ` · ${assignment.campaignId.name}` : ""}
                                        {` · ${formatDate(assignment.startAt)} → ${formatDate(assignment.endAt)}`}
                                    </div>
                                    {assignment.note && <div className="text-xs text-text_2">{assignment.note}</div>}
                                </div>
                                {canManage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        loading={unassigningCollaboratorId === assignment._id}
                                        onClick={() => handleUnassignCollaborator(assignment._id)}
                                    >
                                        Kết thúc
                                    </Button>
                                )}
                            </div>
                        ))}

                        {canManage && (
                            <div className="mt-4 grid gap-3 rounded-lg bg-bg_2 p-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Cộng tác viên</Label>
                                    <Select
                                        value={collaboratorForm.collaboratorUserId}
                                        onValueChange={value => setCollaboratorForm({ ...collaboratorForm, collaboratorUserId: value })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Chọn tài khoản cộng tác viên" /></SelectTrigger>
                                        <SelectContent>
                                            {candidateCollaborators.map(user => (
                                                <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Phạm vi</Label>
                                    <Select
                                        value={collaboratorForm.scopeType}
                                        onValueChange={value => setCollaboratorForm({
                                            ...collaboratorForm,
                                            scopeType: value as NeighborhoodCollaboratorScope,
                                            streetId: "",
                                            houseIds: [],
                                            campaignId: "",
                                        })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(COLLABORATOR_SCOPE_LABEL).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {collaboratorForm.scopeType === "STREET" && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label>Tuyến đường</Label>
                                        <Select value={collaboratorForm.streetId} onValueChange={value => setCollaboratorForm({ ...collaboratorForm, streetId: value })}>
                                            <SelectTrigger><SelectValue placeholder="Chọn tuyến thuộc Tổ" /></SelectTrigger>
                                            <SelectContent>
                                                {neighborhood.streetIds?.map(street => (
                                                    <SelectItem key={street._id} value={street._id}>{street.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {collaboratorForm.scopeType === "HOUSE_GROUP" && (
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Nhóm Nhà số</Label>
                                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-divider_01 bg-ui_bg p-3">
                                            {scopeHouses.map(house => (
                                                <label key={house._id} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={collaboratorForm.houseIds.includes(house._id)}
                                                        onChange={event => setCollaboratorForm({
                                                            ...collaboratorForm,
                                                            houseIds: event.target.checked
                                                                ? [...collaboratorForm.houseIds, house._id]
                                                                : collaboratorForm.houseIds.filter(id => id !== house._id),
                                                        })}
                                                    />
                                                    {house.code} · {house.address}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {collaboratorForm.scopeType === "CAMPAIGN" && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label>Chiến dịch</Label>
                                        <Select value={collaboratorForm.campaignId} onValueChange={value => setCollaboratorForm({ ...collaboratorForm, campaignId: value })}>
                                            <SelectTrigger><SelectValue placeholder="Chọn chiến dịch được giao cho Tổ" /></SelectTrigger>
                                            <SelectContent>
                                                {scopeCampaigns.map(campaign => (
                                                    <SelectItem key={campaign._id} value={campaign._id}>{campaign.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label>Bắt đầu</Label>
                                    <Input type="date" value={collaboratorForm.startAt} onChange={e => setCollaboratorForm({ ...collaboratorForm, startAt: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Kết thúc</Label>
                                    <Input type="date" value={collaboratorForm.endAt} onChange={e => setCollaboratorForm({ ...collaboratorForm, endAt: e.target.value })} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Ghi chú</Label>
                                    <Input value={collaboratorForm.note} onChange={e => setCollaboratorForm({ ...collaboratorForm, note: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <Button loading={savingCollaborator} onClick={handleAssignCollaborator}>
                                        Phân công cộng tác viên
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {canManage && (
                        <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                            <h2 className="mb-2 text-base font-semibold">
                                Lịch sử tổ trưởng
                            </h2>
                            {historyLoading && <LoadingState />}
                            {!historyLoading && history.length === 0 && (
                                <EmptyState label="Chưa có lịch sử phân công tổ trưởng" />
                            )}
                            {!historyLoading &&
                                history.map(h => (
                                    <div
                                        key={h._id}
                                        className="border-b border-divider_01 py-2 text-sm last:border-0"
                                    >
                                        <div className="font-medium">
                                            {h.leaderUserId?.displayName ||
                                                "(tài khoản đã xóa)"}
                                        </div>
                                        <div className="text-xs text-text_2">
                                            {formatDateTime(h.assignedAt)} →{" "}
                                            {h.unassignedAt
                                                ? formatDateTime(h.unassignedAt)
                                                : "hiện tại"}
                                            {h.assignedBy &&
                                                ` · gán bởi ${h.assignedBy.displayName}`}
                                        </div>
                                        {h.termId && (
                                            <div className="text-xs text-text_2">
                                                {h.termId.name} · hiệu lực đến {formatDate(h.endAt)}
                                            </div>
                                        )}
                                        {h.note && (
                                            <div className="text-xs text-text_2">
                                                {h.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}

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
