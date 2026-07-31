import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import { AppError, Neighborhood, Role, RoleRecord, User, UserStatus } from "@dts";
import { ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_TONE } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    assignUserRole,
    fetchUsers,
    revokeUserRole,
    revokeUserSession,
    updateUser,
} from "@service/userApi";
import { fetchRoles } from "@service/roleApi";
import {
    assignNeighborhoodLeader,
    fetchNeighborhoods,
} from "@service/neighborhoodApi";

const NEIGHBORHOOD_LEADER_ROLE = "neighborhood_leader";

const UserListPage: React.FC = () => (
    <AdminGuard permissions={["users.read"]}>
        <UserListContent />
    </AdminGuard>
);

const UserListContent: React.FC = () => {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<Role | "">("");
    const [items, setItems] = useState<User[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const roleNameByKey = React.useMemo(
        () => Object.fromEntries(roles.map(r => [r.key, r.name])),
        [roles],
    );
    const roleLabel = (key: Role) => roleNameByKey[key] ?? ROLE_LABEL[key] ?? key;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState<UserStatus>("active");
    const [saving, setSaving] = useState(false);
    const [roleToAssign, setRoleToAssign] = useState<Role>("resident");
    const [assigningRole, setAssigningRole] = useState(false);
    const [revokingRole, setRevokingRole] = useState<Role | null>(null);
    const [settingPrimaryRole, setSettingPrimaryRole] = useState<Role | null>(
        null,
    );
    const [revokingSession, setRevokingSession] = useState(false);

    const [managedNeighborhoods, setManagedNeighborhoods] = useState<
        Neighborhood[]
    >([]);
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<
        Neighborhood[]
    >([]);
    const [neighborhoodToAssign, setNeighborhoodToAssign] = useState("");
    const [assigningNeighborhood, setAssigningNeighborhood] = useState(false);
    const [unassigningNeighborhoodId, setUnassigningNeighborhoodId] = useState<
        string | null
    >(null);

    const load = (targetPage = 1, keyword = search) => {
        setLoading(true);
        setError(false);
        fetchUsers(
            targetPage,
            DEFAULT_PAGE_SIZE,
            keyword || undefined,
            role || undefined,
        )
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
                setTotal(res.total);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, role]);

    useEffect(() => {
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
    }, []);

    const loadNeighborhoodSections = (user: User) => {
        if (!user.roles.includes(NEIGHBORHOOD_LEADER_ROLE)) {
            setManagedNeighborhoods([]);
            setAvailableNeighborhoods([]);
            return;
        }
        fetchNeighborhoods({ leaderUserId: user.id })
            .then(res => setManagedNeighborhoods(res.items))
            .catch(() => setManagedNeighborhoods([]));
        fetchNeighborhoods({ active: true, limit: 30 })
            .then(res => setAvailableNeighborhoods(res.items))
            .catch(() => setAvailableNeighborhoods([]));
    };

    const openManageSheet = (user: User) => {
        setSelectedUser(user);
        setDisplayName(user.displayName || "");
        setPhone(user.phone || "");
        setStatus(user.status);
        setRoleToAssign("resident");
        setNeighborhoodToAssign("");
        loadNeighborhoodSections(user);
        setSheetOpen(true);
    };

    const refreshSelected = (updated: User) => {
        setSelectedUser(updated);
        setItems(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    };

    const handleSaveProfile = async () => {
        if (!selectedUser) return;
        try {
            setSaving(true);
            const updated = await updateUser(selectedUser.id, {
                displayName: displayName.trim(),
                phone: phone.trim() || undefined,
                status,
            });
            refreshSelected(updated);
            toast.success("Đã cập nhật người dùng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser) return;
        try {
            setAssigningRole(true);
            await assignUserRole(selectedUser.id, roleToAssign);
            toast.success(`Đã gán vai trò ${roleLabel(roleToAssign)}`);
            const updatedUser = {
                ...selectedUser,
                roles: selectedUser.roles.includes(roleToAssign)
                    ? selectedUser.roles
                    : [...selectedUser.roles, roleToAssign],
            };
            refreshSelected(updatedUser);
            if (roleToAssign === NEIGHBORHOOD_LEADER_ROLE) {
                loadNeighborhoodSections(updatedUser);
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigningRole(false);
        }
    };

    const handleSetPrimaryRole = async (r: Role) => {
        if (!selectedUser) return;
        try {
            setSettingPrimaryRole(r);
            const updated = await updateUser(selectedUser.id, {
                primaryRole: r,
            });
            refreshSelected(updated);
            toast.success(`Đã đặt ${roleLabel(r)} làm vai trò chính`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSettingPrimaryRole(null);
        }
    };

    const handleRevokeRole = async (r: Role) => {
        if (!selectedUser) return;
        try {
            setRevokingRole(r);
            const updated = await revokeUserRole(selectedUser.id, r);
            refreshSelected(updated);
            if (r === NEIGHBORHOOD_LEADER_ROLE) {
                loadNeighborhoodSections(updated);
            }
            toast.success(`Đã thu hồi vai trò ${roleLabel(r)}`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRevokingRole(null);
        }
    };

    const handleAssignNeighborhood = async () => {
        if (!selectedUser || !neighborhoodToAssign) return;
        try {
            setAssigningNeighborhood(true);
            await assignNeighborhoodLeader(neighborhoodToAssign, selectedUser.id);
            toast.success("Đã gán tổ dân phố phụ trách");
            setNeighborhoodToAssign("");
            loadNeighborhoodSections(selectedUser);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigningNeighborhood(false);
        }
    };

    const handleUnassignNeighborhood = async (neighborhoodId: string) => {
        if (!selectedUser) return;
        try {
            setUnassigningNeighborhoodId(neighborhoodId);
            await assignNeighborhoodLeader(neighborhoodId, null);
            toast.success("Đã bỏ gán tổ dân phố");
            loadNeighborhoodSections(selectedUser);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUnassigningNeighborhoodId(null);
        }
    };

    const handleRevokeSession = async () => {
        if (!selectedUser) return;
        try {
            setRevokingSession(true);
            await revokeUserSession(selectedUser.id);
            toast.success("Đã thu hồi phiên đăng nhập");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRevokingSession(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-lg font-semibold">Người dùng & vai trò</h1>
            </div>

            <Input
                className="mb-3 max-w-sm"
                placeholder="Tìm theo tên hoặc số điện thoại..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="mb-3 flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant={role === "" ? "default" : "outline"}
                    onClick={() => setRole("")}
                >
                    Tất cả
                </Button>
                {roles.map(r => (
                        <Button
                            key={r.key}
                            size="sm"
                            variant={role === r.key ? "default" : "outline"}
                            onClick={() => setRole(r.key)}
                        >
                            {r.name}
                        </Button>
                    ),
                )}
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">
                    {total} người dùng
                </div>
            )}

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không tìm thấy người dùng nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên/SĐT</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(u => (
                                <TableRow
                                    key={u.id}
                                    className="cursor-pointer"
                                    onClick={() => openManageSheet(u)}
                                >
                                    <TableCell className="font-medium">
                                        {u.displayName}
                                        {u.phone ? ` · ${u.phone}` : ""}
                                    </TableCell>
                                    <TableCell>
                                        {u.roles.map(roleLabel).join(", ")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={USER_STATUS_TONE[u.status]}>
                                            {USER_STATUS_LABEL[u.status]}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={p => load(p, search)}
                    disabled={loading}
                />
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Quản lý người dùng</SheetTitle>
                    </SheetHeader>

                    {selectedUser && (
                        <div className="flex-1 overflow-y-auto py-4">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Họ tên</Label>
                                    <Input
                                        value={displayName}
                                        onChange={e =>
                                            setDisplayName(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Số điện thoại</Label>
                                    <Input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Trạng thái tài khoản</Label>
                                    <Select
                                        value={status}
                                        onValueChange={v =>
                                            setStatus(v as UserStatus)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(
                                                Object.entries(
                                                    USER_STATUS_LABEL,
                                                ) as [UserStatus, string][]
                                            ).map(([key, label]) => (
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button loading={saving} onClick={handleSaveProfile}>
                                    Lưu thông tin
                                </Button>
                            </div>

                            <div className="mt-5 border-t border-divider_01 pt-4">
                                <h3 className="mb-2 text-sm font-semibold">
                                    Vai trò hiện tại
                                </h3>
                                {selectedUser.roles.length === 0 && (
                                    <div className="mb-2 text-xs text-text_2">
                                        Chưa có vai trò nào
                                    </div>
                                )}
                                {selectedUser.roles.map(r => (
                                    <div
                                        key={r}
                                        className="flex items-center justify-between border-b border-divider_01 py-2 last:border-0"
                                    >
                                        <div className="text-sm">
                                            {roleLabel(r)}
                                            {r === selectedUser.primaryRole && (
                                                <span className="text-xs text-primary">
                                                    {" "}
                                                    (Vai trò chính)
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            {r !== selectedUser.primaryRole && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    loading={
                                                        settingPrimaryRole === r
                                                    }
                                                    onClick={() =>
                                                        handleSetPrimaryRole(r)
                                                    }
                                                >
                                                    Đặt làm chính
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                loading={revokingRole === r}
                                                onClick={() =>
                                                    handleRevokeRole(r)
                                                }
                                            >
                                                Thu hồi
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-3 flex items-end gap-2">
                                    <div className="flex-1 space-y-1.5">
                                        <Label>Gán vai trò mới</Label>
                                        <Select
                                            value={roleToAssign}
                                            onValueChange={v =>
                                                setRoleToAssign(v as Role)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(r => (
                                                    <SelectItem
                                                        key={r.key}
                                                        value={r.key}
                                                    >
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        loading={assigningRole}
                                        onClick={handleAssignRole}
                                    >
                                        Gán
                                    </Button>
                                </div>
                            </div>

                            {selectedUser.roles.includes(
                                NEIGHBORHOOD_LEADER_ROLE,
                            ) && (
                                <div className="mt-5 border-t border-divider_01 pt-4">
                                    <h3 className="mb-2 text-sm font-semibold">
                                        Tổ dân phố phụ trách
                                    </h3>
                                    {managedNeighborhoods.length === 0 && (
                                        <div className="mb-2 text-xs text-text_2">
                                            Chưa phụ trách tổ dân phố nào
                                        </div>
                                    )}
                                    {managedNeighborhoods.map(n => (
                                        <div
                                            key={n._id}
                                            className="flex items-center justify-between border-b border-divider_01 py-2 last:border-0"
                                        >
                                            <div className="text-sm">
                                                {n.name}
                                                <span className="text-xs text-text_2">
                                                    {" "}
                                                    ({n.code})
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                loading={
                                                    unassigningNeighborhoodId ===
                                                    n._id
                                                }
                                                onClick={() =>
                                                    handleUnassignNeighborhood(
                                                        n._id,
                                                    )
                                                }
                                            >
                                                Bỏ gán
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="mt-3 flex items-end gap-2">
                                        <div className="flex-1 space-y-1.5">
                                            <Label>Gán tổ dân phố mới</Label>
                                            <Select
                                                value={neighborhoodToAssign}
                                                onValueChange={setNeighborhoodToAssign}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tổ dân phố" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableNeighborhoods
                                                        .filter(
                                                            n =>
                                                                !managedNeighborhoods.some(
                                                                    m =>
                                                                        m._id ===
                                                                        n._id,
                                                                ),
                                                        )
                                                        .map(n => (
                                                            <SelectItem
                                                                key={n._id}
                                                                value={n._id}
                                                            >
                                                                {n.name} ({n.code})
                                                                {n.leaderUserId
                                                                    ? ` · đang có tổ trưởng: ${n.leaderUserId.displayName}`
                                                                    : ""}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            loading={assigningNeighborhood}
                                            disabled={!neighborhoodToAssign}
                                            onClick={handleAssignNeighborhood}
                                        >
                                            Gán
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 border-t border-divider_01 pt-4">
                                <Button
                                    className="w-full !text-red-500"
                                    variant="outline"
                                    loading={revokingSession}
                                    onClick={handleRevokeSession}
                                >
                                    Thu hồi phiên đăng nhập (đăng xuất bắt buộc)
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default UserListPage;
