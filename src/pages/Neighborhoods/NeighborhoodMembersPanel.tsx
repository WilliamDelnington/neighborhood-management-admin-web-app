import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import { COLLABORATOR_SCOPE_LABEL, ROLE_LABEL } from "@constants/domain";
import {
    AppError,
    House,
    InspectionCampaign,
    Neighborhood,
    NeighborhoodCollaboratorScope,
    RoleRecord,
    User,
} from "@dts";
import {
    assignNeighborhoodCollaborator,
    assignNeighborhoodColeader,
    assignNeighborhoodLeader,
    fetchNeighborhoodColeaderHistory,
    fetchNeighborhoodColeaders,
    fetchNeighborhoodCollaboratorHistory,
    fetchNeighborhoodCollaborators,
    fetchNeighborhoodLeaderHistory,
    unassignNeighborhoodCollaborator,
    unassignNeighborhoodColeader,
} from "@service/neighborhoodApi";
import { fetchRoles } from "@service/roleApi";
import { fetchUsers } from "@service/userApi";
import { fetchHouses } from "@service/houseApi";
import { fetchInspectionCampaigns } from "@service/inspectionApi";
import {
    assignScope,
    fetchScopeHolders,
    ScopeHolder,
    unassignScope,
} from "@service/scopeAssignmentApi";
import NeighborhoodMemberImportSheet from "./NeighborhoodMemberImportSheet";

const NEIGHBORHOOD_LEADER_ROLE = "neighborhood_leader";
const NEIGHBORHOOD_COLEADER_ROLE = "neighborhood_coleader";
const NEIGHBORHOOD_COLLABORATOR_ROLE = "neighborhood_collaborator";
// 3 vai tro co san, moi vai tro co quy tac nghiep vu rieng (denormalize
// Neighborhood.leaderUserId, gioi han 1 to/nguoi, sub-scope+campaign expiry) -
// van di qua ham chuyen dung trong neighborhoodApi.ts, KHONG qua
// assignScope/unassignScope chung. Vai tro NEIGHBORHOOD-scope nao khac (hien
// chua co, nhung Role.scopeType da ho tro tu truoc) roi ve nhanh chung.
const KNOWN_ROLE_KEYS = [
    NEIGHBORHOOD_LEADER_ROLE,
    NEIGHBORHOOD_COLEADER_ROLE,
    NEIGHBORHOOD_COLLABORATOR_ROLE,
];

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

type MemberRow = {
    key: string;
    userId: string;
    displayName: string;
    phone?: string;
    avatarUrl?: string;
    roleKey: string;
    roleLabel: string;
    subScopeLabel?: string;
    assignedAt?: string;
    note?: string;
    // Du lieu can de dispatch dung ham unassign - _id cua ScopeAssignment (chi
    // Cong tac vien/vai tro khac dung), khong dung cho leader/coleader (dung
    // userId lam khoa thay).
    scopeAssignmentId?: string;
};

type HistoryRow = {
    key: string;
    roleLabel: string;
    displayName: string;
    assignedAt: string;
    endedAt?: string;
    stillActive: boolean;
    note?: string;
};

export interface NeighborhoodMembersPanelProps {
    neighborhood: Neighborhood;
    onMutated?: () => void;
}

const NeighborhoodMembersPanel: React.FC<NeighborhoodMembersPanelProps> = ({
    neighborhood,
    onMutated,
}) => {
    const navigate = useNavigate();
    const canManage = usePermission("neighborhoods.manage");
    const canReadRoles = usePermission("roles.read");
    const neighborhoodId = neighborhood._id;

    const [loading, setLoading] = useState(true);

    // Du lieu "giau" (rich) cho 3 vai tro co san - giu nguyen cac ham fetch cu
    // (co populate assignedBy/subScope day du) thay vi dung fetchScopeHolders
    // chung (chi populate userId, se lam mat thong tin hien thi hien co).
    const [coleaders, setColeaders] = useState<
        Awaited<ReturnType<typeof fetchNeighborhoodColeaders>>
    >([]);
    const [collaborators, setCollaborators] = useState<
        Awaited<ReturnType<typeof fetchNeighborhoodCollaborators>>
    >([]);
    const [leaderHistory, setLeaderHistory] = useState<
        Awaited<ReturnType<typeof fetchNeighborhoodLeaderHistory>>
    >([]);
    const [coleaderHistory, setColeaderHistory] = useState<
        Awaited<ReturnType<typeof fetchNeighborhoodColeaderHistory>>
    >([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<
        Awaited<ReturnType<typeof fetchNeighborhoodCollaboratorHistory>>
    >([]);
    // Bat ky vai tro NEIGHBORHOOD-scope nao KHAC 3 vai tro tren (hien luon
    // rong tren thuc te, nhung ho tro san cho vai tro tuy chinh sau nay - xem
    // Role.scopeType o backend).
    const [otherHolders, setOtherHolders] = useState<ScopeHolder[]>([]);
    const [otherRoles, setOtherRoles] = useState<RoleRecord[]>([]);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const [assignRoleKey, setAssignRoleKey] = useState<string>(
        NEIGHBORHOOD_LEADER_ROLE,
    );
    const [assignUserId, setAssignUserId] = useState("");
    const [candidateUsers, setCandidateUsers] = useState<User[]>([]);
    const [collaboratorScopeType, setCollaboratorScopeType] =
        useState<NeighborhoodCollaboratorScope>("WHOLE_NEIGHBORHOOD");
    const [streetId, setStreetId] = useState("");
    const [houseIds, setHouseIds] = useState<string[]>([]);
    const [campaignId, setCampaignId] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [note, setNote] = useState("");
    const [scopeHouses, setScopeHouses] = useState<House[]>([]);
    const [scopeCampaigns, setScopeCampaigns] = useState<InspectionCampaign[]>(
        [],
    );
    const [saving, setSaving] = useState(false);
    const [unassigningKey, setUnassigningKey] = useState<string | null>(null);

    const roleLabel = (key: string) =>
        otherRoles.find(r => r.key === key)?.name ||
        (ROLE_LABEL as Record<string, string>)[key] ||
        key;

    const load = () => {
        setLoading(true);
        Promise.all([
            fetchNeighborhoodColeaders(neighborhoodId),
            fetchNeighborhoodCollaborators(neighborhoodId),
            fetchScopeHolders({
                scopeType: "NEIGHBORHOOD",
                scopeId: neighborhoodId,
            }).catch((): ScopeHolder[] => []),
        ])
            .then(([coleaderList, collaboratorList, holders]) => {
                setColeaders(coleaderList);
                setCollaborators(collaboratorList);
                setOtherHolders(
                    holders.filter(h => !KNOWN_ROLE_KEYS.includes(h.roleKey)),
                );
            })
            .finally(() => setLoading(false));
    };

    const loadHistory = () => {
        fetchNeighborhoodLeaderHistory(neighborhoodId)
            .then(setLeaderHistory)
            .catch(() => setLeaderHistory([]));
        fetchNeighborhoodColeaderHistory(neighborhoodId)
            .then(setColeaderHistory)
            .catch(() => setColeaderHistory([]));
        fetchNeighborhoodCollaboratorHistory(neighborhoodId)
            .then(setCollaboratorHistory)
            .catch(() => setCollaboratorHistory([]));
    };

    useEffect(() => {
        load();
        loadHistory();
        fetchHouses({ neighborhoodId, limit: 200 })
            .then(res => setScopeHouses(res.items))
            .catch(() => setScopeHouses([]));
        fetchInspectionCampaigns({ page: 1, status: "ACTIVE" })
            .then(res => setScopeCampaigns(res.items))
            .catch(() => setScopeCampaigns([]));
        if (canReadRoles) {
            fetchRoles({ active: true, limit: 200 })
                .then(res =>
                    setOtherRoles(
                        res.items.filter(
                            r =>
                                r.scopeType === "NEIGHBORHOOD" &&
                                !KNOWN_ROLE_KEYS.includes(r.key),
                        ),
                    ),
                )
                .catch(() => setOtherRoles([]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [neighborhoodId]);

    // Danh sach tai khoan de chon lam nguoi duoc gan - tai lai moi khi doi vai
    // tro trong form gan moi (moi vai tro co tap ung vien khac nhau).
    useEffect(() => {
        fetchUsers(1, 100, undefined, assignRoleKey)
            .then(res =>
                setCandidateUsers(res.items.filter(u => u.status === "active")),
            )
            .catch(() => setCandidateUsers([]));
    }, [assignRoleKey]);

    const resetAssignForm = () => {
        setAssignUserId("");
        setCollaboratorScopeType("WHOLE_NEIGHBORHOOD");
        setStreetId("");
        setHouseIds([]);
        setCampaignId("");
        setStartAt("");
        setEndAt("");
        setNote("");
    };

    const afterMutation = () => {
        load();
        loadHistory();
        onMutated?.();
    };

    const handleAssign = async () => {
        if (!assignUserId) {
            toast.error("Vui lòng chọn tài khoản");
            return;
        }
        try {
            setSaving(true);
            if (assignRoleKey === NEIGHBORHOOD_LEADER_ROLE) {
                await assignNeighborhoodLeader(neighborhoodId, assignUserId);
                toast.success("Đã phân công tổ trưởng");
            } else if (assignRoleKey === NEIGHBORHOOD_COLEADER_ROLE) {
                await assignNeighborhoodColeader(neighborhoodId, assignUserId);
                toast.success("Đã phân công tổ phó");
            } else if (assignRoleKey === NEIGHBORHOOD_COLLABORATOR_ROLE) {
                await assignNeighborhoodCollaborator(neighborhoodId, {
                    collaboratorUserId: assignUserId,
                    scopeType: collaboratorScopeType,
                    streetId: streetId || undefined,
                    houseIds,
                    campaignId: campaignId || undefined,
                    startAt: startAt || undefined,
                    endAt: endAt || undefined,
                    note: note.trim() || undefined,
                });
                toast.success("Đã phân công cộng tác viên");
            } else {
                await assignScope({
                    userId: assignUserId,
                    roleKey: assignRoleKey,
                    scopeType: "NEIGHBORHOOD",
                    scopeId: neighborhoodId,
                    note: note.trim() || undefined,
                });
                toast.success(`Đã phân công ${roleLabel(assignRoleKey)}`);
            }
            resetAssignForm();
            afterMutation();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleUnassign = async (row: MemberRow) => {
        try {
            setUnassigningKey(row.key);
            if (row.roleKey === NEIGHBORHOOD_LEADER_ROLE) {
                await assignNeighborhoodLeader(neighborhoodId, null);
            } else if (row.roleKey === NEIGHBORHOOD_COLEADER_ROLE) {
                await unassignNeighborhoodColeader(neighborhoodId, row.userId);
            } else if (row.roleKey === NEIGHBORHOOD_COLLABORATOR_ROLE) {
                if (row.scopeAssignmentId) {
                    await unassignNeighborhoodCollaborator(
                        neighborhoodId,
                        row.scopeAssignmentId,
                    );
                }
            } else {
                await unassignScope({
                    userId: row.userId,
                    roleKey: row.roleKey,
                    scopeType: "NEIGHBORHOOD",
                    scopeId: neighborhoodId,
                });
            }
            toast.success(`Đã gỡ phân công ${row.roleLabel}`);
            afterMutation();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUnassigningKey(null);
        }
    };

    const members: MemberRow[] = [];
    if (neighborhood.leaderUserId) {
        members.push({
            key: "leader",
            userId: neighborhood.leaderUserId._id,
            displayName: neighborhood.leaderUserId.displayName,
            phone: neighborhood.leaderUserId.phone,
            roleKey: NEIGHBORHOOD_LEADER_ROLE,
            roleLabel: "Tổ trưởng",
            assignedAt: leaderHistory.find(h => !h.unassignedAt)?.assignedAt,
        });
    }
    coleaders.forEach(c => {
        if (!c.userId) return;
        members.push({
            key: `coleader-${c._id}`,
            userId: c.userId._id,
            displayName: c.userId.displayName,
            phone: c.userId.phone,
            avatarUrl: c.userId.avatarUrl,
            roleKey: NEIGHBORHOOD_COLEADER_ROLE,
            roleLabel: "Tổ phó",
            assignedAt: c.assignedAt,
            note: c.note,
        });
    });
    collaborators.forEach(c => {
        if (!c.userId) return;
        const scopeParts = [
            COLLABORATOR_SCOPE_LABEL[c.subScope.kind],
            c.subScope.streetId?.name,
            c.subScope.houseIds.length
                ? `${c.subScope.houseIds.length} Nhà số`
                : undefined,
            c.subScope.campaignId?.name,
        ].filter(Boolean);
        members.push({
            key: `collaborator-${c._id}`,
            userId: c.userId._id,
            displayName: c.userId.displayName,
            phone: c.userId.phone,
            avatarUrl: c.userId.avatarUrl,
            roleKey: NEIGHBORHOOD_COLLABORATOR_ROLE,
            roleLabel: "Cộng tác viên",
            subScopeLabel: scopeParts.join(" · "),
            assignedAt: c.assignedAt,
            note: c.note,
            scopeAssignmentId: c._id,
        });
    });
    otherHolders.forEach(h => {
        if (typeof h.userId === "string") return;
        members.push({
            key: `other-${h._id}`,
            userId: h.userId._id,
            displayName: h.userId.displayName,
            phone: h.userId.phone,
            roleKey: h.roleKey,
            roleLabel: roleLabel(h.roleKey),
            assignedAt: h.assignedAt,
            note: h.note,
        });
    });

    const history: HistoryRow[] = [
        ...leaderHistory.map(h => ({
            key: `leader-${h._id}`,
            roleLabel: "Tổ trưởng",
            displayName: h.userId?.displayName || "(tài khoản đã xóa)",
            assignedAt: h.assignedAt,
            endedAt: h.unassignedAt,
            stillActive: !h.unassignedAt,
            note: h.note,
        })),
        ...coleaderHistory.map(h => ({
            key: `coleader-${h._id}`,
            roleLabel: "Tổ phó",
            displayName: h.userId?.displayName || "(tài khoản đã xóa)",
            assignedAt: h.assignedAt,
            endedAt: h.unassignedAt,
            stillActive: !h.unassignedAt,
            note: h.note,
        })),
        ...collaboratorHistory.map(h => ({
            key: `collaborator-${h._id}`,
            roleLabel: "Cộng tác viên",
            displayName: h.userId?.displayName || "(tài khoản đã xóa)",
            assignedAt: h.assignedAt,
            endedAt: h.unassignedAt || h.endAt,
            stillActive: !h.unassignedAt,
            note: h.note,
        })),
    ].sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));

    const roleOptions = [
        { key: NEIGHBORHOOD_LEADER_ROLE, name: "Tổ trưởng" },
        { key: NEIGHBORHOOD_COLEADER_ROLE, name: "Tổ phó" },
        { key: NEIGHBORHOOD_COLLABORATOR_ROLE, name: "Cộng tác viên" },
        ...otherRoles.map(r => ({ key: r.key, name: r.name })),
    ];

    return (
        <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                    Thành viên phụ trách Tổ
                </h2>
                {canManage && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setImportOpen(true)}
                    >
                        <UploadCloud className="mr-1 h-3.5 w-3.5" />
                        Nhập từ Excel
                    </Button>
                )}
            </div>
            <p className="mb-3 text-xs text-text_2">
                Tổ trưởng/Tổ phó/Cộng tác viên (và các vai trò khác được gán
                theo phạm vi Tổ dân phố) đều được quản lý chung ở đây.
            </p>

            {loading && <LoadingState />}
            {!loading && members.length === 0 && (
                <EmptyState label="Chưa có thành viên nào được phân công" />
            )}
            {!loading &&
                members.map(m => (
                    <div
                        key={m.key}
                        className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                    >
                        <button
                            type="button"
                            className="text-left hover:underline"
                            onClick={() =>
                                navigate(
                                    canManage
                                        ? `/users/${m.userId}`
                                        : `/users/${m.userId}?readOnly=1`,
                                )
                            }
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {m.displayName}
                                </span>
                                <Badge tone="gray">{m.roleLabel}</Badge>
                            </div>
                            <div className="text-xs text-text_2">
                                {m.phone}
                                {m.subScopeLabel ? ` · ${m.subScopeLabel}` : ""}
                                {m.assignedAt
                                    ? ` · từ ${formatDate(m.assignedAt)}`
                                    : ""}
                            </div>
                        </button>
                        {canManage && (
                            <Button
                                size="sm"
                                variant="outline"
                                loading={unassigningKey === m.key}
                                onClick={() => handleUnassign(m)}
                            >
                                Gỡ phân công
                            </Button>
                        )}
                    </div>
                ))}

            {canManage && (
                <div className="mt-4 grid gap-3 rounded-lg bg-bg_2 p-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Vai trò</Label>
                        <Select
                            value={assignRoleKey}
                            onValueChange={value => {
                                setAssignRoleKey(value);
                                resetAssignForm();
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map(r => (
                                    <SelectItem key={r.key} value={r.key}>
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Tài khoản</Label>
                        <Select
                            value={assignUserId}
                            onValueChange={setAssignUserId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn tài khoản" />
                            </SelectTrigger>
                            <SelectContent>
                                {candidateUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.displayName}
                                        {u.phone ? ` · ${u.phone}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {assignRoleKey === NEIGHBORHOOD_COLLABORATOR_ROLE && (
                        <>
                            <div className="space-y-1.5">
                                <Label>Phạm vi</Label>
                                <Select
                                    value={collaboratorScopeType}
                                    onValueChange={value => {
                                        setCollaboratorScopeType(
                                            value as NeighborhoodCollaboratorScope,
                                        );
                                        setStreetId("");
                                        setHouseIds([]);
                                        setCampaignId("");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(
                                            COLLABORATOR_SCOPE_LABEL,
                                        ).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {collaboratorScopeType === "STREET" && (
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Tuyến đường</Label>
                                    <Select
                                        value={streetId}
                                        onValueChange={setStreetId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn tuyến thuộc Tổ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {neighborhood.streetIds?.map(
                                                street => (
                                                    <SelectItem
                                                        key={street._id}
                                                        value={street._id}
                                                    >
                                                        {street.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {collaboratorScopeType === "HOUSE_GROUP" && (
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Nhóm Nhà số</Label>
                                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-divider_01 bg-ui_bg p-3">
                                        {scopeHouses.map(house => (
                                            <label
                                                key={house._id}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={houseIds.includes(
                                                        house._id,
                                                    )}
                                                    onChange={event =>
                                                        setHouseIds(
                                                            event.target.checked
                                                                ? [
                                                                      ...houseIds,
                                                                      house._id,
                                                                  ]
                                                                : houseIds.filter(
                                                                      id =>
                                                                          id !==
                                                                          house._id,
                                                                  ),
                                                        )
                                                    }
                                                />
                                                {house.code} · {house.address}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {collaboratorScopeType === "CAMPAIGN" && (
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>Chiến dịch</Label>
                                    <Select
                                        value={campaignId}
                                        onValueChange={setCampaignId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn chiến dịch được giao cho Tổ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {scopeCampaigns.map(campaign => (
                                                <SelectItem
                                                    key={campaign._id}
                                                    value={campaign._id}
                                                >
                                                    {campaign.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Bắt đầu</Label>
                                <Input
                                    type="date"
                                    value={startAt}
                                    onChange={e => setStartAt(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Kết thúc</Label>
                                <Input
                                    type="date"
                                    value={endAt}
                                    onChange={e => setEndAt(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {![
                        NEIGHBORHOOD_LEADER_ROLE,
                        NEIGHBORHOOD_COLEADER_ROLE,
                    ].includes(assignRoleKey) && (
                        <div className="space-y-1.5 md:col-span-2">
                            <Label>Ghi chú</Label>
                            <Input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <Button loading={saving} onClick={handleAssign}>
                            <Plus className="mr-1 h-4 w-4" /> Phân công
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryOpen(v => !v)}
                >
                    {historyOpen
                        ? "Ẩn lịch sử phân công"
                        : "Xem lịch sử phân công"}
                </Button>
                {historyOpen && (
                    <div className="mt-3">
                        {history.length === 0 && (
                            <EmptyState label="Chưa có lịch sử phân công" />
                        )}
                        {history.map(h => (
                            <div
                                key={h.key}
                                className="border-b border-divider_01 py-2 text-sm last:border-0"
                            >
                                <div className="font-medium">
                                    {h.displayName}{" "}
                                    <span className="text-xs text-text_2">
                                        ({h.roleLabel})
                                    </span>
                                </div>
                                <div className="text-xs text-text_2">
                                    {formatDateTime(h.assignedAt)} →{" "}
                                    {h.stillActive
                                        ? "hiện tại"
                                        : formatDateTime(h.endedAt)}
                                </div>
                                {h.note && (
                                    <div className="text-xs text-text_2">
                                        {h.note}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {canManage && (
                <NeighborhoodMemberImportSheet
                    neighborhoodId={neighborhoodId}
                    open={importOpen}
                    onOpenChange={setImportOpen}
                    onImported={afterMutation}
                />
            )}
        </div>
    );
};

export default NeighborhoodMembersPanel;
