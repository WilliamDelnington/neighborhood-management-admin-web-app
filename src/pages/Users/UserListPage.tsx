import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
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
import FilterableSelect from "@components/admin/FilterableSelect";
import { AppError, Neighborhood, Province, Role, RoleRecord, User, UserStatus, Ward } from "@dts";
import { ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_TONE } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    assignUserRole,
    fetchUsers,
    lockUserAccount,
    revokeUserRole,
    revokeUserSession,
    updateUser,
} from "@service/userApi";
import { fetchRoles } from "@service/roleApi";
import {
    assignNeighborhoodLeader,
    fetchNeighborhoods,
} from "@service/neighborhoodApi";
import {
    fetchProvinces,
    fetchWardsByProvince,
} from "@service/administrativeDivisionApi";
import { usePermission } from "@store/authStore";

const NEIGHBORHOOD_LEADER_ROLE = "neighborhood_leader";
const PEOPLE_COMMITTEE_OFFICIAL_ROLE = "people_committee_official";
const SECRETARY_ROLE = "secretary";
const WARD_SCOPED_ROLES: Role[] = [
    PEOPLE_COMMITTEE_OFFICIAL_ROLE,
    SECRETARY_ROLE,
];

const UserListPage: React.FC = () => (
    <AdminGuard permissions={["users.read"]}>
        <UserListContent />
    </AdminGuard>
);

const UserListContent: React.FC = () => {
    // to truong (neighborhood_leader) chi co users.lock: xem duoc danh sach
    // (users.read, da gioi han theo to dan pho o backend) nhung chi doi duoc
    // trang thai tai khoan (qua lockUserAccount), khong sua ten/sdt/vai tro -
    // xem userService.listUsers/lockUserStatus o backend.
    const canFullUpdate = usePermission("users.update");
    const canAssignRoles = usePermission("users.assign_roles");
    // to truong khong co roles.read - goi fetchRoles se luon 403. Danh sach
    // nay chi phuc vu bo loc theo vai tro + man gan vai tro (da an voi to
    // truong qua canAssignRoles), nen bo qua hoan toan thay vi goi roi bo ket
    // qua qua .catch().
    const canReadRoles = usePermission("roles.read");
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
    const [originalStatus, setOriginalStatus] = useState<UserStatus>("active");
    const [statusReason, setStatusReason] = useState("");
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

    // Pham vi phuong/xa cho can bo UBND va bi thu. `wardCode` la ma dinh danh
    // on dinh tu danh muc hanh chinh, dung kem ten de hien thi.
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [wardProvinceCode, setWardProvinceCode] = useState("");
    const [wardProvinceName, setWardProvinceName] = useState("");
    const [wardCode, setWardCode] = useState("");
    const [wardName, setWardName] = useState("");
    const [savingWard, setSavingWard] = useState(false);

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
        if (!canReadRoles) return;
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canReadRoles]);

    useEffect(() => {
        if (!canFullUpdate) return;
        fetchProvinces()
            .then(setProvinces)
            .catch(() => setProvinces([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canFullUpdate]);

    useEffect(() => {
        if (!wardProvinceCode) {
            setWards([]);
            return;
        }
        fetchWardsByProvince(Number(wardProvinceCode))
            .then(setWards)
            .catch(() => setWards([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wardProvinceCode]);

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
        setOriginalStatus(user.status);
        setStatusReason("");
        setRoleToAssign("resident");
        setNeighborhoodToAssign("");
        loadNeighborhoodSections(user);
        setWardProvinceCode(user.provinceCode ? String(user.provinceCode) : "");
        setWardProvinceName(user.provinceName || "");
        setWardCode(user.wardCode ? String(user.wardCode) : "");
        setWardName(user.wardName || "");
        setSheetOpen(true);
    };

    const refreshSelected = (updated: User) => {
        setSelectedUser(updated);
        setItems(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    };

    const statusChanged = status !== originalStatus;

    const handleSaveProfile = async () => {
        if (!selectedUser) return;
        if (statusChanged && !statusReason.trim()) {
            toast.error("Vui lòng nhập lý do khi khóa/mở tài khoản");
            return;
        }
        try {
            setSaving(true);
            let updated: User;
            if (canFullUpdate) {
                updated = await updateUser(selectedUser.id, {
                    displayName: displayName.trim(),
                    phone: phone.trim() || undefined,
                    // Chi gui status/statusReason khi thuc su thay doi trang
                    // thai - tranh bat buoc nhap ly do cho cac lan chi sua
                    // ten/sdt (xem updateUserSchema o backend, yeu cau
                    // statusReason bat cu khi nao status co mat trong payload).
                    ...(statusChanged
                        ? { status, statusReason: statusReason.trim() }
                        : {}),
                });
            } else {
                // To truong (users.lock, khong co users.update) chi doi duoc
                // trang thai tai khoan, khong sua ten/sdt - xem
                // PATCH /api/users/:id/lock o backend.
                if (!statusChanged) return;
                // UI chi cho chon "active"/"locked" khi khong co canFullUpdate
                // (xem filter cua Select ben duoi) - "pending" khong the toi
                // day trong nhanh nay.
                updated = await lockUserAccount(
                    selectedUser.id,
                    status as "active" | "locked",
                    statusReason.trim(),
                );
            }
            refreshSelected(updated);
            setOriginalStatus(updated.status);
            setStatusReason("");
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

    const handleSaveWard = async () => {
        if (!selectedUser) return;
        try {
            setSavingWard(true);
            const updated = await updateUser(selectedUser.id, {
                provinceCode: wardProvinceCode ? Number(wardProvinceCode) : null,
                provinceName: wardProvinceName || null,
                wardCode: wardCode ? Number(wardCode) : null,
                wardName: wardName || null,
            });
            refreshSelected(updated);
            toast.success("Đã cập nhật phường/xã phụ trách");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingWard(false);
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
            <PageHeader
                title="Người dùng & vai trò"
                description="Quản lý tài khoản người dùng và vai trò được gán."
            />

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
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên/SĐT</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((u, index) => (
                                <TableRow
                                    key={u.id}
                                    className="cursor-pointer"
                                    onClick={() => openManageSheet(u)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
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
                                {!canFullUpdate && (
                                    <p className="rounded-lg bg-ng_10 px-3 py-2 text-xs text-text_2">
                                        Bạn chỉ có thể khóa/mở tài khoản chủ nhà
                                        thuộc tổ dân phố phụ trách, không sửa
                                        được tên/số điện thoại hoặc vai trò.
                                    </p>
                                )}
                                <div className="space-y-1.5">
                                    <Label>Họ tên</Label>
                                    <Input
                                        value={displayName}
                                        disabled={!canFullUpdate}
                                        onChange={e =>
                                            setDisplayName(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Số điện thoại</Label>
                                    <Input
                                        value={phone}
                                        disabled={!canFullUpdate}
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
                                            )
                                                // To truong chi doi qua PATCH
                                                // /api/users/:id/lock, chi
                                                // nhan "active"/"locked" (xem
                                                // lockUserStatusSchema o
                                                // backend) - an "pending" de
                                                // khong chon duoc gia tri gui
                                                // len se bi tu choi.
                                                .filter(
                                                    ([key]) =>
                                                        canFullUpdate ||
                                                        key === "active" ||
                                                        key === "locked",
                                                )
                                                .map(([key, label]) => (
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
                                {statusChanged && (
                                    <div className="space-y-1.5">
                                        <Label>
                                            Lý do đổi trạng thái tài khoản
                                        </Label>
                                        <Textarea
                                            value={statusReason}
                                            onChange={e =>
                                                setStatusReason(e.target.value)
                                            }
                                            placeholder="VD: Vi phạm quy định, yêu cầu của tổ dân phố, mở lại sau xác minh..."
                                        />
                                    </div>
                                )}
                                <Button
                                    loading={saving}
                                    disabled={!canFullUpdate && !statusChanged}
                                    onClick={handleSaveProfile}
                                >
                                    Lưu thông tin
                                </Button>
                            </div>

                            {canAssignRoles && (
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
                            )}

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
                                        <div className="flex-1">
                                            <FilterableSelect
                                                label="Gán tổ dân phố mới"
                                                placeholder="Chọn tổ dân phố"
                                                searchPlaceholder="Tìm theo tên tổ dân phố..."
                                                items={availableNeighborhoods.filter(
                                                    n =>
                                                        !managedNeighborhoods.some(
                                                            m =>
                                                                m._id ===
                                                                n._id,
                                                        ),
                                                )}
                                                getId={n => n._id}
                                                getLabel={n =>
                                                    `${n.name} (${n.code})`
                                                }
                                                getSubLabel={n =>
                                                    n.leaderUserId
                                                        ? `Đang có tổ trưởng: ${n.leaderUserId.displayName}`
                                                        : ""
                                                }
                                                value={neighborhoodToAssign}
                                                onChange={id =>
                                                    setNeighborhoodToAssign(
                                                        id || "",
                                                    )
                                                }
                                            />
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

                            {canFullUpdate &&
                                selectedUser.roles.some(role =>
                                    WARD_SCOPED_ROLES.includes(role),
                                ) && (
                                <div className="mt-5 border-t border-divider_01 pt-4">
                                    <h3 className="mb-2 text-sm font-semibold">
                                        Phường/xã phụ trách
                                    </h3>
                                    <p className="mb-3 text-xs text-text_2">
                                        Xác định phường/xã thuộc phạm vi quản
                                        lý của cán bộ hoặc bí thư này.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <FilterableSelect
                                            label="Tỉnh/Thành phố"
                                            placeholder="Chọn tỉnh/thành phố"
                                            searchPlaceholder="Tìm theo tên tỉnh/thành phố..."
                                            items={provinces}
                                            getId={p => String(p.code)}
                                            getLabel={p => p.name}
                                            value={wardProvinceCode}
                                            valueLabel={wardProvinceName}
                                            onChange={(code, province) => {
                                                setWardProvinceCode(code || "");
                                                setWardProvinceName(
                                                    province?.name || "",
                                                );
                                                setWardCode("");
                                                setWardName("");
                                            }}
                                        />
                                        <FilterableSelect
                                            label="Phường/Xã"
                                            placeholder={
                                                wardProvinceCode
                                                    ? "Chọn phường/xã"
                                                    : "Chọn tỉnh/thành phố trước"
                                            }
                                            searchPlaceholder="Tìm theo tên phường/xã..."
                                            items={wards}
                                            getId={w => String(w.code)}
                                            getLabel={w => w.name}
                                            value={wardCode}
                                            valueLabel={wardName}
                                            onChange={(code, ward) => {
                                                setWardCode(code || "");
                                                setWardName(ward?.name || "");
                                            }}
                                            disabled={!wardProvinceCode}
                                        />
                                        <Button
                                            loading={savingWard}
                                            onClick={handleSaveWard}
                                        >
                                            Lưu phường/xã phụ trách
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {canFullUpdate && (
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
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default UserListPage;
