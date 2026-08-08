import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
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
import {
    AppError,
    ModulePermissionGroup,
    NhomPhanAnh,
    RequestType,
    RoleRecord,
} from "@dts";
import { NHOM_PHAN_ANH_LABEL, REQUEST_TYPE_LABEL } from "@constants/domain";
import {
    createRole,
    deleteRole,
    fetchRolePermissionRegistry,
    fetchRoles,
    updateRole,
} from "@service/roleApi";

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
};

const EMPTY_FORM: FormState = {
    key: "",
    name: "",
    description: "",
    active: true,
    sortOrder: 0,
    permissions: [],
    allowedComplaintCategories: null,
    allowedRequestTypes: null,
};

const ALL_NHOM_PHAN_ANH = Object.keys(
    NHOM_PHAN_ANH_LABEL,
) as NhomPhanAnh[];

const ALL_REQUEST_TYPES = Object.keys(REQUEST_TYPE_LABEL) as RequestType[];

const RoleListContent: React.FC = () => {
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [registry, setRegistry] = useState<ModulePermissionGroup[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        Promise.all([
            fetchRoles({ page: targetPage }),
            fetchRolePermissionRegistry(),
        ])
            .then(([roleList, permissionRegistry]) => {
                setRoles(roleList.items);
                setPage(roleList.page);
                setTotalPages(roleList.totalPages);
                setRegistry(permissionRegistry);
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
        });
        setSheetOpen(true);
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
        try {
            setSaving(true);
            if (editingRole) {
                await updateRole(editingRole._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                    permissions: form.permissions,
                    allowedComplaintCategories: form.allowedComplaintCategories,
                    allowedRequestTypes: form.allowedRequestTypes,
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
        if (!roleToDelete) return;
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

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Vai trò & phân quyền</h1>
                <Button onClick={openCreateSheet}>Tạo vai trò</Button>
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && roles.length === 0 && (
                    <EmptyState label="Chưa có vai trò nào" />
                )}
                {!loading && !error && roles.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Số quyền</TableHead>
                                <TableHead>Người dùng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map(role => (
                                <TableRow
                                    key={role._id}
                                    className="cursor-pointer"
                                    onClick={() => openEditSheet(role)}
                                >
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
                                    <TableCell>{role.permissions.length}</TableCell>
                                    <TableCell>{role.assignedUserCount}</TableCell>
                                    <TableCell>
                                        <Badge tone={role.active ? "green" : "gray"}>
                                            {role.active ? "Hoạt động" : "Vô hiệu"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {!role.system && (
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
                <SheetContent className="flex flex-col sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {editingRole ? "Cập nhật vai trò" : "Tạo vai trò"}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            {!editingRole && (
                                <div className="space-y-1.5">
                                    <Label>Key (không thể đổi sau khi tạo)</Label>
                                    <Input
                                        placeholder="vd: cluster_lead"
                                        value={form.key}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                key: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Tên vai trò</Label>
                                <Input
                                    value={form.name}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Mô tả</Label>
                                <Textarea
                                    value={form.description}
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
                            <h3 className="mb-3 text-sm font-semibold">
                                Phân quyền theo chức năng
                            </h3>
                            <div className="flex flex-col gap-4">
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
                                            className="rounded-lg border border-divider_01 p-3"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <Checkbox
                                                    checked={allChecked}
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
                                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-divider_01 p-3 pl-6 sm:grid-cols-2">
                                    {ALL_NHOM_PHAN_ANH.map(category => (
                                        <div
                                            key={category}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={form.allowedComplaintCategories!.includes(
                                                    category,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleComplaintCategory(
                                                        category,
                                                    )
                                                }
                                            />
                                            <Label className="text-sm font-normal">
                                                {NHOM_PHAN_ANH_LABEL[category]}
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
                                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-divider_01 p-3 pl-6 sm:grid-cols-2">
                                    {ALL_REQUEST_TYPES.map(type => (
                                        <div
                                            key={type}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={form.allowedRequestTypes!.includes(
                                                    type,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleRequestType(type)
                                                }
                                            />
                                            <Label className="text-sm font-normal">
                                                {REQUEST_TYPE_LABEL[type]}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            className="mt-5 w-full"
                            loading={saving}
                            disabled={!form.name.trim() || (!editingRole && !form.key.trim())}
                            onClick={handleSave}
                        >
                            {editingRole ? "Lưu thay đổi" : "Tạo vai trò"}
                        </Button>
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
