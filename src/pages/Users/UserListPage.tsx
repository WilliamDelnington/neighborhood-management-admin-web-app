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
import { AppError, Role, User, UserStatus } from "@dts";
import { ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_TONE } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    assignUserRole,
    fetchUsers,
    revokeUserRole,
    revokeUserSession,
    updateUser,
} from "@service/userApi";

const UserListPage: React.FC = () => (
    <AdminGuard roles={["admin"]}>
        <UserListContent />
    </AdminGuard>
);

const UserListContent: React.FC = () => {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<Role | "">("");
    const [items, setItems] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState<UserStatus>("active");
    const [clustersText, setClustersText] = useState("");
    const [saving, setSaving] = useState(false);
    const [roleToAssign, setRoleToAssign] = useState<Role>("resident");
    const [assigningRole, setAssigningRole] = useState(false);
    const [revokingRole, setRevokingRole] = useState<Role | null>(null);
    const [settingPrimaryRole, setSettingPrimaryRole] = useState<Role | null>(
        null,
    );
    const [revokingSession, setRevokingSession] = useState(false);

    const load = (targetPage = 1, keyword = search) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchUsers(
            targetPage,
            DEFAULT_PAGE_SIZE,
            keyword || undefined,
            role || undefined,
        )
            .then(res => {
                setItems(prev =>
                    targetPage === 1 ? res.items : [...prev, ...res.items],
                );
                setPage(res.page);
                setTotalPages(res.totalPages);
                setTotal(res.total);
            })
            .catch(() => setError(true))
            .finally(() => {
                setLoading(false);
                setLoadingMore(false);
            });
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, role]);

    const openManageSheet = (user: User) => {
        setSelectedUser(user);
        setDisplayName(user.displayName || "");
        setPhone(user.phone || "");
        setStatus(user.status);
        setClustersText((user.assignedClusters || []).join(", "));
        setRoleToAssign("resident");
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
                assignedClusters: clustersText
                    .split(",")
                    .map(c => c.trim())
                    .filter(Boolean),
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
            toast.success(`Đã gán vai trò ${ROLE_LABEL[roleToAssign]}`);
            refreshSelected({
                ...selectedUser,
                roles: selectedUser.roles.includes(roleToAssign)
                    ? selectedUser.roles
                    : [...selectedUser.roles, roleToAssign],
            });
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
            toast.success(`Đã đặt ${ROLE_LABEL[r]} làm vai trò chính`);
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
            toast.success(`Đã thu hồi vai trò ${ROLE_LABEL[r]}`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRevokingRole(null);
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
                {(Object.entries(ROLE_LABEL) as [Role, string][]).map(
                    ([key, label]) => (
                        <Button
                            key={key}
                            size="sm"
                            variant={role === key ? "default" : "outline"}
                            onClick={() => setRole(key)}
                        >
                            {label}
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
                                        {u.roles
                                            .map(r => ROLE_LABEL[r])
                                            .join(", ")}
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

            {!loading && !error && page < totalPages && (
                <div className="mt-3">
                    <Button
                        variant="outline"
                        disabled={loadingMore}
                        onClick={() => load(page + 1, search)}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm"}
                    </Button>
                </div>
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
                                <div className="space-y-1.5">
                                    <Label>
                                        Cụm dân cư phụ trách (cách nhau bởi dấu
                                        phẩy)
                                    </Label>
                                    <Input
                                        placeholder="Cụm 1, Cụm 2"
                                        value={clustersText}
                                        onChange={e =>
                                            setClustersText(e.target.value)
                                        }
                                    />
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
                                            {ROLE_LABEL[r]}
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
                                                {(
                                                    Object.entries(
                                                        ROLE_LABEL,
                                                    ) as [Role, string][]
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
                                    <Button
                                        loading={assigningRole}
                                        onClick={handleAssignRole}
                                    >
                                        Gán
                                    </Button>
                                </div>
                            </div>

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
