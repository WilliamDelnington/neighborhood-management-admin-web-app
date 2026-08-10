import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
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
import { AppError, Neighborhood, NeighborhoodLeaderAssignment, User } from "@dts";
import {
    assignNeighborhoodLeader,
    fetchNeighborhoodById,
    fetchNeighborhoodLeaderHistory,
    updateNeighborhood,
} from "@service/neighborhoodApi";
import { fetchUsers } from "@service/userApi";
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
    provinceCode: n.provinceCode ? String(n.provinceCode) : "",
    provinceName: n.provinceName || "",
    wardCode: n.wardCode ? String(n.wardCode) : "",
    wardName: n.wardName || "",
    address: n.address || "",
    description: n.description || "",
    contactPhone: n.contactPhone || "",
    notes: n.notes || "",
});

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
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

    useEffect(() => {
        load();
        loadCandidateLeaders();
        loadHistory();
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
            toast.success("Đã cập nhật tổ dân phố");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleAssignLeader = async () => {
        if (!id || !leaderToAssign) return;
        try {
            setAssigningLeader(true);
            const updated = await assignNeighborhoodLeader(id, leaderToAssign);
            setNeighborhood(updated);
            setLeaderToAssign("");
            loadHistory();
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
            toast.success("Đã bỏ gán tổ trưởng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUnassigningLeader(false);
        }
    };

    const otherCandidates = candidateLeaders.filter(
        u => u.id !== neighborhood?.leaderUserId?._id,
    );

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
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {neighborhood.code} — {neighborhood.name}
                            </h2>
                            <Badge tone={neighborhood.active ? "green" : "gray"}>
                                {neighborhood.active
                                    ? "Đang hoạt động"
                                    : "Ngừng hoạt động"}
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

                    <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <h2 className="mb-2 text-base font-semibold">
                            Thông tin tổ trưởng
                        </h2>
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
                                    disabled={!leaderToAssign}
                                    onClick={handleAssignLeader}
                                >
                                    Gán
                                </Button>
                            </div>
                        )}
                    </div>

                    {canManage && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
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
                                        {h.note && (
                                            <div className="text-xs text-text_2">
                                                {h.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
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
