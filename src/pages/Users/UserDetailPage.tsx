import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Upload, UserRound } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
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
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import FilterableSelect from "@components/admin/FilterableSelect";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import { usePermission } from "@store/authStore";
import { resolveAssetUrl } from "@constants/common";
import {
    ROLE_LABEL,
    USER_AUDIT_ACTION_LABEL,
    USER_STATUS_LABEL,
    USER_STATUS_TONE,
} from "@constants/domain";
import {
    AppError,
    FileAsset,
    Neighborhood,
    Province,
    Role,
    RoleRecord,
    User,
    UserStatus,
    Ward,
} from "@dts";
import {
    assignUserRole,
    deleteUserAttachment,
    fetchUserAttachments,
    fetchUserAuditLogs,
    fetchUserById,
    fetchUserManagementScope,
    lockUserAccount,
    resetUserPassword,
    revokeUserRole,
    revokeUserSession,
    updateUser,
    uploadUserAttachment,
    uploadUserAvatar,
    UserManagementScopeEntry,
} from "@service/userApi";
import { fetchRoles } from "@service/roleApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { assignScope, unassignScope } from "@service/scopeAssignmentApi";
import {
    fetchProvinces,
    fetchWardsByProvince,
} from "@service/administrativeDivisionApi";

const NEIGHBORHOOD_LEADER_ROLE = "neighborhood_leader";
const PEOPLE_COMMITTEE_OFFICIAL_ROLE = "people_committee_official";
const SECRETARY_ROLE = "secretary";
const REGIONAL_POLICE_ROLE = "regional_police";
// Cung danh sach voi UserListPage.tsx - xem ghi chu o do.
const WARD_SCOPED_ROLES: Role[] = [
    PEOPLE_COMMITTEE_OFFICIAL_ROLE,
    SECRETARY_ROLE,
    REGIONAL_POLICE_ROLE,
];

const SCOPE_TYPE_LABEL: Record<string, string> = {
    ALL: "Toàn hệ thống",
    WARD: "Phường/Xã",
    NEIGHBORHOOD: "Tổ dân phố",
    HOUSE: "Nhà số",
    HOUSEHOLD: "Hộ dân",
    BUSINESS: "Hộ kinh doanh",
    COMPANY: "Công ty",
};

const UserDetailPage: React.FC = () => (
    <AdminGuard permissions={["users.read"]}>
        <UserDetailContent />
    </AdminGuard>
);

const UserDetailContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // to truong (neighborhood_leader) chi co users.lock: xem duoc (users.read,
    // da gioi han theo to dan pho o backend) nhung chi doi duoc trang thai tai
    // khoan, khong sua ten/sdt/vai tro - xem userService.listUsers/lockUserStatus
    // o backend.
    const canFullUpdate = usePermission("users.update");
    const canAssignRoles = usePermission("users.assign_roles");
    const canResetPassword = usePermission("users.reset_password");
    const canReadRoles = usePermission("roles.read");

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const roleLabel = (key: Role) =>
        roles.find(r => r.key === key)?.name ?? ROLE_LABEL[key] ?? key;

    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [address, setAddress] = useState("");
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

    const [managedNeighborhoods, setManagedNeighborhoods] = useState<
        Neighborhood[]
    >([]);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [wardProvinceCode, setWardProvinceCode] = useState("");
    const [wardProvinceName, setWardProvinceName] = useState("");
    const [wardCode, setWardCode] = useState("");
    const [wardName, setWardName] = useState("");
    const [savingWard, setSavingWard] = useState(false);

    const [revokingSession, setRevokingSession] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [resettingPassword, setResettingPassword] = useState(false);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);

    const [scopeEntries, setScopeEntries] = useState<
        UserManagementScopeEntry[]
    >([]);
    const [scopeLoading, setScopeLoading] = useState(true);

    const loadNeighborhoodSections = (u: User) => {
        if (!u.roles.includes(NEIGHBORHOOD_LEADER_ROLE)) {
            setManagedNeighborhoods([]);
            return;
        }
        fetchNeighborhoods({ leaderUserId: u.id })
            .then(res => setManagedNeighborhoods(res.items))
            .catch(() => setManagedNeighborhoods([]));
    };

    const applyUser = (u: User) => {
        setUser(u);
        setDisplayName(u.displayName || "");
        setPhone(u.phone || "");
        setIdNumber(u.idNumber || "");
        setAddress(u.address || "");
        setStatus(u.status);
        setOriginalStatus(u.status);
        setStatusReason("");
        setWardProvinceCode(u.provinceCode ? String(u.provinceCode) : "");
        setWardProvinceName(u.provinceName || "");
        setWardCode(u.wardCode ? String(u.wardCode) : "");
        setWardName(u.wardName || "");
        loadNeighborhoodSections(u);
    };

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchUserById(id)
            .then(applyUser)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(load, [id]);

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

    useEffect(() => {
        if (!id) return;
        setAttachmentsLoading(true);
        fetchUserAttachments(id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setScopeLoading(true);
        fetchUserManagementScope(id)
            .then(res => setScopeEntries(res.scopes))
            .catch(() => setScopeEntries([]))
            .finally(() => setScopeLoading(false));
    }, [id]);

    const statusChanged = status !== originalStatus;

    const handleSaveProfile = async () => {
        if (!user) return;
        if (statusChanged && !statusReason.trim()) {
            toast.error("Vui lòng nhập lý do khi khóa/mở tài khoản");
            return;
        }
        try {
            setSaving(true);
            let updated: User;
            if (canFullUpdate) {
                updated = await updateUser(user.id, {
                    displayName: displayName.trim(),
                    phone: phone.trim() || undefined,
                    idNumber: idNumber.trim() || undefined,
                    address: address.trim() || undefined,
                    // Chi gui status/statusReason khi thuc su thay doi trang
                    // thai - tranh bat buoc nhap ly do cho cac lan chi sua
                    // thong tin khac (xem updateUserSchema o backend, yeu cau
                    // statusReason bat cu khi nao status co mat trong payload).
                    ...(statusChanged
                        ? { status, statusReason: statusReason.trim() }
                        : {}),
                });
            } else {
                // To truong (users.lock, khong co users.update) chi doi duoc
                // trang thai tai khoan, khong sua thong tin khac - xem PATCH
                // /api/users/:id/lock o backend.
                if (!statusChanged) return;
                updated = await lockUserAccount(
                    user.id,
                    status as "active" | "locked",
                    statusReason.trim(),
                );
            }
            applyUser(updated);
            toast.success("Đã cập nhật người dùng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleAssignRole = async () => {
        if (!user) return;
        try {
            setAssigningRole(true);
            await assignUserRole(user.id, roleToAssign);
            toast.success(`Đã gán vai trò ${roleLabel(roleToAssign)}`);
            const updatedUser = {
                ...user,
                roles: user.roles.includes(roleToAssign)
                    ? user.roles
                    : [...user.roles, roleToAssign],
            };
            setUser(updatedUser);
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
        if (!user) return;
        try {
            setSettingPrimaryRole(r);
            const updated = await updateUser(user.id, { primaryRole: r });
            // setUser (khong phai applyUser) - tranh ghi de cac truong dang
            // sua do trong khung "Thong tin" (displayName/idNumber/...) chi
            // vi mot thao tac vai tro khong lien quan.
            setUser(updated);
            toast.success(`Đã đặt ${roleLabel(r)} làm vai trò chính`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSettingPrimaryRole(null);
        }
    };

    const handleRevokeRole = async (r: Role) => {
        if (!user) return;
        try {
            setRevokingRole(r);
            const updated = await revokeUserRole(user.id, r);
            setUser(updated);
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

    // Xem ghi chu chi tiet o UserListPage.tsx (truoc khi doi thanh trang rieng) -
    // dung assignScope/unassignScope thay vi updateUser(wardCode...) truc tiep.
    const handleSaveWard = async () => {
        if (!user) return;
        const roleKey = WARD_SCOPED_ROLES.find(r => user.roles.includes(r));
        if (!roleKey) return;
        const previousWardCode = user.wardCode;
        const nextWardCode = wardCode ? Number(wardCode) : undefined;
        if (previousWardCode === nextWardCode) return;
        try {
            setSavingWard(true);
            if (previousWardCode) {
                await unassignScope({
                    userId: user.id,
                    roleKey,
                    scopeType: "WARD",
                    scopeId: previousWardCode,
                });
            }
            if (nextWardCode) {
                await assignScope({
                    userId: user.id,
                    roleKey,
                    scopeType: "WARD",
                    scopeId: nextWardCode,
                });
            }
            const updated = await fetchUserById(user.id);
            setUser(updated);
            toast.success("Đã cập nhật phường/xã phụ trách");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingWard(false);
        }
    };

    const handleRevokeSession = async () => {
        if (!user) return;
        try {
            setRevokingSession(true);
            await revokeUserSession(user.id);
            toast.success("Đã thu hồi phiên đăng nhập");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRevokingSession(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user || newPassword.trim().length < 6) return;
        try {
            setResettingPassword(true);
            await resetUserPassword(user.id, newPassword.trim());
            toast.success(
                "Đã đặt lại mật khẩu, tài khoản này sẽ phải đăng nhập lại",
            );
            setNewPassword("");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setResettingPassword(false);
        }
    };

    const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !user) return;
        setUploadingAvatar(true);
        uploadUserAvatar(user.id, file)
            .then(updated => {
                setUser(updated);
                toast.success("Đã cập nhật ảnh đại diện");
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setUploadingAvatar(false));
    };

    const handleAttachmentUpload = (file: File) => {
        if (!id) return;
        setUploadingAttachment(true);
        uploadUserAttachment(id, file)
            .then(asset => {
                setAttachments(prev => [asset, ...prev]);
                toast.success("Đã tải lên tài liệu");
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setUploadingAttachment(false));
    };

    const handleAttachmentDelete = (fileId: string) => {
        if (!id) return;
        setDeletingAttachmentId(fileId);
        deleteUserAttachment(id, fileId)
            .then(() => {
                setAttachments(prev => prev.filter(a => a._id !== fileId));
                toast.success("Đã xóa tài liệu");
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setDeletingAttachmentId(null));
    };

    if (!id) return null;

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/users")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Người dùng</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && user && (
                <>
                    <div className="rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                disabled={!canFullUpdate}
                                onClick={() => avatarInputRef.current?.click()}
                                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-main to-primary-dark ring-2 ring-blue_10 disabled:cursor-default"
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={resolveAssetUrl(user.avatarUrl)}
                                        alt={user.displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-full w-full p-3 text-white" />
                                )}
                                {canFullUpdate && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                                        <Upload className="h-5 w-5 text-white" />
                                    </span>
                                )}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={handleAvatarSelected}
                            />
                            <div>
                                <h2 className="text-xl font-semibold text-text_1">
                                    {user.displayName}
                                </h2>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <Badge tone={USER_STATUS_TONE[user.status]}>
                                        {USER_STATUS_LABEL[user.status]}
                                    </Badge>
                                    {user.roles.map(r => (
                                        <Badge key={r} tone="gray">
                                            {roleLabel(r)}
                                        </Badge>
                                    ))}
                                </div>
                                {uploadingAvatar && (
                                    <p className="mt-1 text-xs text-text_2">
                                        Đang tải lên ảnh đại diện...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        {!canFullUpdate && (
                            <p className="mb-3 rounded-lg bg-ng_10 px-3 py-2 text-xs text-text_2">
                                Bạn chỉ có thể khóa/mở tài khoản chủ nhà thuộc
                                tổ dân phố phụ trách, không sửa được thông tin
                                khác.
                            </p>
                        )}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <Label>Số CMND/CCCD</Label>
                                <Input
                                    value={idNumber}
                                    disabled={!canFullUpdate}
                                    placeholder="Chưa cập nhật"
                                    onChange={e => setIdNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Địa chỉ</Label>
                                <Input
                                    value={address}
                                    disabled={!canFullUpdate}
                                    placeholder="Chưa cập nhật"
                                    onChange={e => setAddress(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            <Label>Trạng thái tài khoản</Label>
                            <Select
                                value={status}
                                onValueChange={v => setStatus(v as UserStatus)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(USER_STATUS_LABEL) as [
                                            UserStatus,
                                            string,
                                        ][]
                                    )
                                        // To truong chi doi qua PATCH
                                        // /api/users/:id/lock, chi nhan
                                        // "active"/"locked" (xem
                                        // lockUserStatusSchema o backend) - an
                                        // "pending" de khong chon duoc gia tri
                                        // gui len se bi tu choi.
                                        .filter(
                                            ([key]) =>
                                                canFullUpdate ||
                                                key === "active" ||
                                                key === "locked",
                                        )
                                        .map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {statusChanged && (
                            <div className="mt-4 space-y-1.5">
                                <Label>Lý do đổi trạng thái tài khoản</Label>
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
                            className="mt-4"
                            loading={saving}
                            disabled={!canFullUpdate && !statusChanged}
                            onClick={handleSaveProfile}
                        >
                            Lưu thông tin
                        </Button>
                    </div>

                    {canAssignRoles && (
                        <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                            <h3 className="mb-2 text-base font-semibold">
                                Vai trò hiện tại
                            </h3>
                            {user.roles.length === 0 && (
                                <div className="mb-2 text-xs text-text_2">
                                    Chưa có vai trò nào
                                </div>
                            )}
                            {user.roles.map(r => (
                                <div
                                    key={r}
                                    className="flex items-center justify-between border-b border-divider_01 py-2 last:border-0"
                                >
                                    <div className="text-sm">
                                        {roleLabel(r)}
                                        {r === user.primaryRole && (
                                            <span className="text-xs text-primary">
                                                {" "}
                                                (Vai trò chính)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5">
                                        {r !== user.primaryRole && (
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
                                            onClick={() => handleRevokeRole(r)}
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

                    {user.roles.includes(NEIGHBORHOOD_LEADER_ROLE) && (
                        <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                            <h3 className="mb-2 text-base font-semibold">
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
                                </div>
                            ))}
                            <div className="mt-2 text-xs text-text_2">
                                Việc phân công tổ trưởng được thực hiện ở
                                trang thông tin tổ dân phố, không thực hiện ở
                                đây.
                            </div>
                        </div>
                    )}

                    {canFullUpdate &&
                        user.roles.some(r => WARD_SCOPED_ROLES.includes(r)) && (
                            <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                                <h3 className="mb-2 text-base font-semibold">
                                    Phường/xã phụ trách
                                </h3>
                                <p className="mb-3 text-xs text-text_2">
                                    Xác định phường/xã thuộc phạm vi quản lý
                                    của cán bộ hoặc bí thư này.
                                </p>
                                <div className="flex flex-col gap-3 sm:max-w-md">
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

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h3 className="mb-2 text-base font-semibold">
                            Phạm vi quản lý
                        </h3>
                        {scopeLoading && <LoadingState />}
                        {!scopeLoading && scopeEntries.length === 0 && (
                            <div className="text-xs text-text_2">
                                Chưa quản lý phạm vi nào
                            </div>
                        )}
                        {!scopeLoading &&
                            scopeEntries.map(entry => (
                                <div
                                    key={`${entry.roleKey}-${entry.scopeType}`}
                                    className="border-b border-divider_01 py-2 last:border-0"
                                >
                                    <div className="text-sm font-medium">
                                        {roleLabel(entry.roleKey)} —{" "}
                                        {SCOPE_TYPE_LABEL[entry.scopeType] ||
                                            entry.scopeType}
                                    </div>
                                    {entry.unrestricted ? (
                                        <div className="text-xs text-text_2">
                                            Không giới hạn phạm vi
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {entry.items.map(item => (
                                                <Badge key={item.id} tone="gray">
                                                    {item.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>

                    <AttachmentsPanel
                        attachments={attachments}
                        loading={attachmentsLoading}
                        canManage={canFullUpdate}
                        deletingId={deletingAttachmentId}
                        onDelete={handleAttachmentDelete}
                        onUpload={handleAttachmentUpload}
                        uploading={uploadingAttachment}
                    />

                    {canResetPassword && (
                        <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                            <Label>Đặt lại mật khẩu</Label>
                            <p className="mb-2 mt-1 text-xs text-text_2">
                                Dùng khi tài khoản chưa có mật khẩu (vd tạo qua
                                Nhập Excel) hoặc chủ tài khoản quên mật khẩu và
                                cần được hỗ trợ. Sau khi đặt lại, tài khoản sẽ
                                phải đăng nhập lại bằng mật khẩu mới.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                                    value={newPassword}
                                    onChange={e =>
                                        setNewPassword(e.target.value)
                                    }
                                />
                                <Button
                                    disabled={newPassword.trim().length < 6}
                                    loading={resettingPassword}
                                    onClick={handleResetPassword}
                                >
                                    Đặt lại
                                </Button>
                            </div>
                        </div>
                    )}

                    {canFullUpdate && (
                        <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
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

                    <RecordHistorySection
                        fetchHistory={params => fetchUserAuditLogs(id, params)}
                        actionLabels={USER_AUDIT_ACTION_LABEL}
                        historyHref={`/users/${id}/history`}
                    />
                </>
            )}
        </div>
    );
};

export default UserDetailPage;
