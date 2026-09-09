import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@components/ui/dialog";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import {
    AccessScopeTier,
    AppError,
    ModulePermissionGroup,
    NeighborhoodCollaboratorScope,
    NhomPhanAnh,
    RequestType,
    RoleRecord,
    ScopeAssignmentMechanism,
} from "@dts";
import {
    ACCESS_SCOPE_TIER_LABEL,
    ACCOUNT_CREATION_RESERVED_ROLE_KEYS,
    COLLABORATOR_SCOPE_LABEL,
    NHOM_PHAN_ANH_LABEL,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    createRole,
    deleteRole,
    fetchRolePermissionRegistry,
    fetchRoles,
    updateRole,
} from "@service/roleApi";
import { fetchRequestTypeDefinitions } from "@service/requestTypeApi";
import { fetchComplaintTypeDefinitions } from "@service/complaintTypeApi";

const RoleListPage: React.FC = () => (
    <AdminGuard permissions={["roles.read"]}>
        <RoleListContent />
    </AdminGuard>
);

type FormState = {
    key: string;
    name: string;
    description: string;
    active: boolean;
    sortOrder: number;
    permissions: string[];
    // null = khong gioi han (xem tat ca nhom phan anh) - mac dinh cho den khi admin chot.
    allowedComplaintCategories: NhomPhanAnh[] | null;
    // null = khong gioi han (gui duoc tat ca loai yeu cau) - cung quy uoc.
    allowedRequestTypes: RequestType[] | null;
    // KHAC 2 truong tren: mang thuong (khong co gia tri null/"khong gioi
    // han") - rong = khong duoc tao vai tro nao ngoai house_owner khi "Tạo
    // tài khoản" (mac dinh an toan, xem Role.ts o backend).
    allowedCreatableRoles: string[];
    scopeType: AccessScopeTier;
    // "1 nguoi" (gia tri 1) hoac "khong gioi han" (null) - khong cho nhap so
    // tuy y, xem ghi chu tai UI (chua co quy uoc UI/UX cho gia tri > 1).
    maxActivePerScope: number | null;
    maxActiveScopesPerUser: number | null;
    subScopeKinds: NeighborhoodCollaboratorScope[];
};

// scopeMechanism suy tu scopeType (khong cho chon rieng o UI, tranh ket hop
// vo nghia vd WARD+OWNED) - xem Role.ts pre("validate") o backend, cung quy
// uoc.
const deriveScopeMechanism = (
    tier: AccessScopeTier,
): ScopeAssignmentMechanism | undefined => {
    if (tier === "ALL") return undefined;
    if (tier === "WARD" || tier === "NEIGHBORHOOD") return "ASSIGNED";
    return "OWNED";
};

// Tu dong sinh key tu ten vai tro (bo dau, snake_case) - form khong con
// cho nhap key thu cong nua.
const slugifyKey = (value: string) =>
    value
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const EMPTY_FORM: FormState = {
    key: "",
    name: "",
    description: "",
    active: true,
    sortOrder: 0,
    permissions: [],
    allowedComplaintCategories: null,
    allowedRequestTypes: null,
    allowedCreatableRoles: [],
    scopeType: "ALL",
    maxActivePerScope: null,
    maxActiveScopesPerUser: null,
    subScopeKinds: [],
};

const RoleListContent: React.FC = () => {
    const canCreate = usePermission("roles.create");
    const canUpdate = usePermission("roles.update");
    const canDelete = usePermission("roles.delete");
    const canManagePermissions = usePermission("roles.manage");
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [registry, setRegistry] = useState<ModulePermissionGroup[]>([]);
    const [requestTypeOptions, setRequestTypeOptions] = useState<
        Array<{ key: RequestType; name: string }>
    >([]);
    const [complaintCategoryOptions, setComplaintCategoryOptions] = useState<
        Array<{ key: NhomPhanAnh; name: string }>
    >(
        Object.entries(NHOM_PHAN_ANH_LABEL).map(([key, name]) => ({ key, name })),
    );
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        Promise.all([
            fetchRoles({ page: targetPage, limit: size }),
            fetchRolePermissionRegistry(),
            fetchRequestTypeDefinitions({ active: true, limit: 200 }),
            fetchComplaintTypeDefinitions({ active: true, limit: 200 }),
        ])
            .then(([roleList, permissionRegistry, customTypes, complaintTypes]) => {
                setRoles(roleList.items);
                setPage(roleList.page);
                setTotalPages(roleList.totalPages);
                setRegistry(permissionRegistry);
                setRequestTypeOptions(
                    customTypes.items.map(type => ({
                        key: type.key,
                        name: type.name,
                    })),
                );
                setComplaintCategoryOptions(
                    complaintTypes.items.map(type => ({
                        key: type.key,
                        name: type.name,
                    })),
                );
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
    }, []);

    const openCreateSheet = () => {
        setEditingRole(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (role: RoleRecord) => {
        setEditingRole(role);
        setForm({
            key: role.key,
            name: role.name,
            description: role.description || "",
            active: role.active,
            sortOrder: role.sortOrder,
            permissions: role.permissions,
            allowedComplaintCategories: role.allowedComplaintCategories ?? null,
            allowedRequestTypes: role.allowedRequestTypes ?? null,
            allowedCreatableRoles: role.allowedCreatableRoles ?? [],
            scopeType: role.scopeType,
            maxActivePerScope: role.maxActivePerScope ?? null,
            maxActiveScopesPerUser: role.maxActiveScopesPerUser ?? null,
            subScopeKinds: role.subScopeKinds ?? [],
        });
        setSheetOpen(true);
    };

    // Lua chon cho checkbox "Vai trò được phép tạo" - tru house_owner (luon
    // mo san, khong can chon), cac vai tro trong ACCOUNT_CREATION_RESERVED_ROLE_KEYS
    // (khong bao gio duoc phep du co chon), va chinh vai tro dang sua (tu-tham-chieu
    // vo nghia).
    const creatableRoleOptions = roles.filter(
        r =>
            r.key !== "house_owner" &&
            r.key !== editingRole?.key &&
            !ACCOUNT_CREATION_RESERVED_ROLE_KEYS.includes(r.key),
    );

    const toggleCreatableRole = (key: string) => {
        setForm(prev => ({
            ...prev,
            allowedCreatableRoles: prev.allowedCreatableRoles.includes(key)
                ? prev.allowedCreatableRoles.filter(k => k !== key)
                : [...prev.allowedCreatableRoles, key],
        }));
    };

    const toggleComplaintCategoryRestriction = (restricted: boolean) => {
        setForm(prev => ({
            ...prev,
            allowedComplaintCategories: restricted ? [] : null,
        }));
    };

    const toggleComplaintCategory = (category: NhomPhanAnh) => {
        setForm(prev => {
            const current = prev.allowedComplaintCategories || [];
            return {
                ...prev,
                allowedComplaintCategories: current.includes(category)
                    ? current.filter(c => c !== category)
                    : [...current, category],
            };
        });
    };

    const toggleRequestTypeRestriction = (restricted: boolean) => {
        setForm(prev => ({
            ...prev,
            allowedRequestTypes: restricted ? [] : null,
        }));
    };

    const toggleRequestType = (type: RequestType) => {
        setForm(prev => {
            const current = prev.allowedRequestTypes || [];
            return {
                ...prev,
                allowedRequestTypes: current.includes(type)
                    ? current.filter(t => t !== type)
                    : [...current, type],
            };
        });
    };

    const toggleSubScopeKind = (kind: NeighborhoodCollaboratorScope) => {
        setForm(prev => ({
            ...prev,
            subScopeKinds: prev.subScopeKinds.includes(kind)
                ? prev.subScopeKinds.filter(k => k !== kind)
                : [...prev.subScopeKinds, kind],
        }));
    };

    const togglePermission = (key: string) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter(p => p !== key)
                : [...prev.permissions, key],
        }));
    };

    const toggleModule = (group: ModulePermissionGroup) => {
        const moduleKeys = group.permissions.map(p => p.key);
        const allChecked = moduleKeys.every(k => form.permissions.includes(k));
        setForm(prev => ({
            ...prev,
            permissions: allChecked
                ? prev.permissions.filter(p => !moduleKeys.includes(p))
                : [...new Set([...prev.permissions, ...moduleKeys])],
        }));
    };

    const handleSave = async () => {
        const canSave = editingRole ? canUpdate : canCreate;
        if (!canSave) return;
        // Chi gui cac truong con thuc su ap dung cho scopeType da chon - giong
        // logic tu don dep cua Role.ts pre("validate") o backend, tranh gui
        // len gia tri "con sot lai" tu lan chon scopeType truoc do trong form.
        const mechanism = deriveScopeMechanism(form.scopeType);
        const scopeFields = {
            scopeType: form.scopeType,
            scopeMechanism: mechanism,
            maxActivePerScope:
                mechanism === "ASSIGNED" ? form.maxActivePerScope : null,
            maxActiveScopesPerUser:
                mechanism === "ASSIGNED" ? form.maxActiveScopesPerUser : null,
            subScopeKinds:
                form.scopeType === "NEIGHBORHOOD"
                    ? form.subScopeKinds
                    : undefined,
        };
        try {
            setSaving(true);
            if (editingRole) {
                await updateRole(editingRole._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                    ...(canManagePermissions
                        ? { permissions: form.permissions }
                        : {}),
                    allowedComplaintCategories: form.allowedComplaintCategories,
                    allowedRequestTypes: form.allowedRequestTypes,
                    allowedCreatableRoles: form.allowedCreatableRoles,
                    ...scopeFields,
                });
                load(page);
                toast.success("Đã cập nhật vai trò");
            } else {
                await createRole({
                    key: form.key.trim(),
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                    permissions: form.permissions,
                    allowedComplaintCategories:
                        form.allowedComplaintCategories ?? undefined,
                    allowedRequestTypes: form.allowedRequestTypes ?? undefined,
                    allowedCreatableRoles: form.allowedCreatableRoles,
                    ...scopeFields,
                });
                load(1);
                toast.success("Đã tạo vai trò mới");
            }
            setSheetOpen(false);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!roleToDelete || !canDelete) return;
        try {
            setDeleting(true);
            await deleteRole(roleToDelete._id);
            toast.success("Đã xóa vai trò");
            setRoleToDelete(null);
            load(roles.length === 1 && page > 1 ? page - 1 : page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    const canEditCurrentRole = editingRole ? canUpdate : canCreate;
    const canEditCurrentPermissions =
        canEditCurrentRole && canManagePermissions;
    let sheetTitle = "Tạo vai trò";
    if (editingRole) {
        sheetTitle = canUpdate ? "Cập nhật vai trò" : "Chi tiết vai trò";
    }

    return (
        <div>
            <PageHeader
                title="Vai trò & phân quyền"
                description="Quản lý vai trò và phân quyền truy cập chức năng."
                action={
                    canCreate && (
                        <Button onClick={openCreateSheet}>Tạo vai trò</Button>
                    )
                }
            />

            <div className="mb-4 flex items-center justify-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && roles.length === 0 && (
                    <EmptyState label="Chưa có vai trò nào" />
                )}
                {!loading && !error && roles.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Phạm vi</TableHead>
                                <TableHead>Số quyền</TableHead>
                                <TableHead>Người dùng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role, index) => (
                                <TableRow
                                    key={role._id}
                                    className="cursor-pointer"
                                    onClick={() => openEditSheet(role)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {role.name}
                                        <div className="text-xs text-text_2">
                                            {role.key}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={role.system ? "blue" : "gray"}>
                                            {role.system ? "Hệ thống" : "Tùy chỉnh"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-text_2">
                                        {ACCESS_SCOPE_TIER_LABEL[role.scopeType]}
                                    </TableCell>
                                    <TableCell>{role.permissions.length}</TableCell>
                                    <TableCell>{role.assignedUserCount}</TableCell>
                                    <TableCell>
                                        <Badge tone={role.active ? "green" : "gray"}>
                                            {role.active ? "Hoạt động" : "Vô hiệu"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {canDelete && !role.system && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="!text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setRoleToDelete(role);
                                                }}
                                            >
                                                Xóa
                                            </Button>
                                        )}
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
                    onPageChange={load}
                    disabled={loading}
                />
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="flex w-full flex-col sm:max-w-3xl lg:max-w-[calc(100vw-320px)]">
                    <SheetHeader>
                        <SheetTitle>{sheetTitle}</SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên vai trò</Label>
                                <Input
                                    value={form.name}
                                    disabled={!!editingRole && !canUpdate}
                                    onChange={e => {
                                        const name = e.target.value;
                                        setForm(prev => ({
                                            ...prev,
                                            name,
                                            // Key duoc sinh tu dong theo ten,
                                            // chi khi tao moi (khong sua key
                                            // cua vai tro da ton tai).
                                            key: editingRole
                                                ? prev.key
                                                : slugifyKey(name),
                                        }));
                                    }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Mô tả</Label>
                                <Textarea
                                    value={form.description}
                                    disabled={!!editingRole && !canUpdate}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={form.active}
                                    disabled={!!editingRole && !canUpdate}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            active: !!checked,
                                        }))
                                    }
                                />
                                <Label>Đang hoạt động</Label>
                            </div>
                        </div>

                        <div className="mt-5 border-t border-divider_01 pt-4">
                            <h3 className="mb-1 text-sm font-semibold">
                                Phạm vi dữ liệu quản lý
                            </h3>
                            <p className="mb-3 text-xs text-text_2">
                                Vai trò này quản lý dữ liệu trong phạm vi nào,
                                và (nếu là phạm vi được gán) quy tắc số người/
                                số phạm vi được active cùng lúc.
                            </p>
                            <div className="space-y-1.5">
                                <Label>Phạm vi</Label>
                                <Select
                                    value={form.scopeType}
                                    disabled={!canEditCurrentRole}
                                    onValueChange={value => {
                                        const scopeType = value as AccessScopeTier;
                                        setForm(prev => ({
                                            ...prev,
                                            scopeType,
                                            // Reset cac truong con - tranh
                                            // gia tri "con sot" tu lua chon
                                            // pham vi truoc do.
                                            maxActivePerScope: null,
                                            maxActiveScopesPerUser: null,
                                            subScopeKinds: [],
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(
                                            Object.keys(
                                                ACCESS_SCOPE_TIER_LABEL,
                                            ) as AccessScopeTier[]
                                        ).map(tier => (
                                            <SelectItem key={tier} value={tier}>
                                                {ACCESS_SCOPE_TIER_LABEL[tier]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {deriveScopeMechanism(form.scopeType) ===
                                "ASSIGNED" && (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>
                                            Số người được active tại 1 phạm vi
                                        </Label>
                                        <Select
                                            value={
                                                form.maxActivePerScope === 1
                                                    ? "ONE"
                                                    : "UNLIMITED"
                                            }
                                            disabled={!canEditCurrentRole}
                                            onValueChange={value =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    maxActivePerScope:
                                                        value === "ONE"
                                                            ? 1
                                                            : null,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ONE">
                                                    Duy nhất 1 người (VD: Bí
                                                    thư, Tổ trưởng)
                                                </SelectItem>
                                                <SelectItem value="UNLIMITED">
                                                    Không giới hạn (VD: PCO,
                                                    Tổ phó)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>
                                            Số phạm vi 1 người được active
                                            cùng lúc
                                        </Label>
                                        <Select
                                            value={
                                                form.maxActiveScopesPerUser ===
                                                1
                                                    ? "ONE"
                                                    : "UNLIMITED"
                                            }
                                            disabled={!canEditCurrentRole}
                                            onValueChange={value =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    maxActiveScopesPerUser:
                                                        value === "ONE"
                                                            ? 1
                                                            : null,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ONE">
                                                    Duy nhất 1 phạm vi (VD: Tổ
                                                    phó)
                                                </SelectItem>
                                                <SelectItem value="UNLIMITED">
                                                    Không giới hạn
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {form.scopeType === "NEIGHBORHOOD" && (
                                <div className="mt-4">
                                    <Label>
                                        Kiểu phạm vi con được phép chọn (Cộng
                                        tác viên)
                                    </Label>
                                    <div className="mt-1.5 grid grid-cols-1 gap-1.5 rounded-lg border border-divider_01 p-3 sm:grid-cols-2">
                                        {Object.entries(
                                            COLLABORATOR_SCOPE_LABEL,
                                        ).map(([value, label]) => (
                                            <div
                                                key={value}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    checked={form.subScopeKinds.includes(
                                                        value as NeighborhoodCollaboratorScope,
                                                    )}
                                                    disabled={
                                                        !canEditCurrentRole
                                                    }
                                                    onCheckedChange={() =>
                                                        toggleSubScopeKind(
                                                            value as NeighborhoodCollaboratorScope,
                                                        )
                                                    }
                                                />
                                                <Label className="text-sm font-normal">
                                                    {label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-text_2">
                                        Bỏ trống nếu vai trò này xem được toàn
                                        Tổ dân phố (VD: Tổ trưởng/Tổ phó) thay
                                        vì chỉ một phạm vi hẹp bên trong Tổ.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 border-t border-divider_01 pt-4">
                            <h3 className="mb-3 text-sm font-semibold">
                                Phân quyền theo chức năng
                            </h3>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {registry.map(group => {
                                    const moduleKeys = group.permissions.map(
                                        p => p.key,
                                    );
                                    const allChecked = moduleKeys.every(k =>
                                        form.permissions.includes(k),
                                    );
                                    return (
                                        <div
                                            key={group.key}
                                            className="h-fit rounded-lg border border-divider_01 p-3"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <Checkbox
                                                    checked={allChecked}
                                                    disabled={
                                                        !canEditCurrentPermissions
                                                    }
                                                    onCheckedChange={() =>
                                                        toggleModule(group)
                                                    }
                                                />
                                                <Label className="font-semibold">
                                                    {group.label}
                                                </Label>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5 pl-6 sm:grid-cols-2">
                                                {group.permissions.map(perm => (
                                                    <div
                                                        key={perm.key}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Checkbox
                                                            checked={form.permissions.includes(
                                                                perm.key,
                                                            )}
                                                            disabled={
                                                                !canEditCurrentPermissions
                                                            }
                                                            onCheckedChange={() =>
                                                                togglePermission(
                                                                    perm.key,
                                                                )
                                                            }
                                                        />
                                                        <Label className="text-sm font-normal">
                                                            {perm.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-5 border-t border-divider_01 pt-4">
                            <h3 className="mb-3 text-sm font-semibold">
                                Phạm vi xem phản ánh / kiến nghị
                            </h3>
                            <div className="mb-2 flex items-center gap-2">
                                <Checkbox
                                    checked={
                                        form.allowedComplaintCategories === null
                                    }
                                    disabled={!canEditCurrentRole}
                                    onCheckedChange={checked =>
                                        toggleComplaintCategoryRestriction(
                                            !checked,
                                        )
                                    }
                                />
                                <Label>
                                    Không giới hạn (xem tất cả các nhóm phản
                                    ánh)
                                </Label>
                            </div>
                            {form.allowedComplaintCategories !== null && (
                                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-divider_01 p-3 pl-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {complaintCategoryOptions.map(category => (
                                        <div
                                            key={category.key}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={(
                                                    form.allowedComplaintCategories ||
                                                    []
                                                ).includes(category.key)}
                                                disabled={!canEditCurrentRole}
                                                onCheckedChange={() =>
                                                    toggleComplaintCategory(
                                                        category.key,
                                                    )
                                                }
                                            />
                                            <Label className="text-sm font-normal">
                                                {category.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-5 border-t border-divider_01 pt-4">
                            <h3 className="mb-3 text-sm font-semibold">
                                Phạm vi gửi yêu cầu công việc
                            </h3>
                            <div className="mb-2 flex items-center gap-2">
                                <Checkbox
                                    checked={form.allowedRequestTypes === null}
                                    disabled={!canEditCurrentRole}
                                    onCheckedChange={checked =>
                                        toggleRequestTypeRestriction(!checked)
                                    }
                                />
                                <Label>
                                    Không giới hạn (gửi được tất cả loại yêu
                                    cầu)
                                </Label>
                            </div>
                            {form.allowedRequestTypes !== null && (
                                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-divider_01 p-3 pl-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {requestTypeOptions.map(type => (
                                        <div
                                            key={type.key}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={(
                                                    form.allowedRequestTypes || []
                                                ).includes(type.key)}
                                                disabled={!canEditCurrentRole}
                                                onCheckedChange={() =>
                                                    toggleRequestType(type.key)
                                                }
                                            />
                                            <Label className="text-sm font-normal">
                                                {type.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-5 border-t border-divider_01 pt-4">
                            <h3 className="mb-1 text-sm font-semibold">
                                Vai trò được phép tạo khi &quot;Tạo tài
                                khoản&quot;
                            </h3>
                            <p className="mb-3 text-xs text-text_2">
                                Người giữ vai trò này sẽ thấy thêm các vai trò
                                dưới đây (ngoài Chủ sở hữu, luôn mở sẵn) khi
                                tạo tài khoản mới trong UserListPage/Zalo Mini
                                App/app cư dân. Mặc định không chọn vai trò nào
                                (an toàn) - phải chốt thủ công từng vai trò.
                            </p>
                            <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-divider_01 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {creatableRoleOptions.map(option => (
                                    <div
                                        key={option.key}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            checked={form.allowedCreatableRoles.includes(
                                                option.key,
                                            )}
                                            disabled={!canEditCurrentRole}
                                            onCheckedChange={() =>
                                                toggleCreatableRole(option.key)
                                            }
                                        />
                                        <Label className="text-sm font-normal">
                                            {option.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(editingRole ? canUpdate : canCreate) && (
                            <Button
                                className="mt-5 w-full"
                                loading={saving}
                                disabled={
                                    !form.name.trim() ||
                                    (!editingRole && !form.key.trim())
                                }
                                onClick={handleSave}
                            >
                                {editingRole ? "Lưu thay đổi" : "Tạo vai trò"}
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!roleToDelete}
                onOpenChange={open => !open && setRoleToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa vai trò</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa vai trò &quot;{roleToDelete?.name}
                            &quot;? Thao tác này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRoleToDelete(null)}
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

export default RoleListPage;
