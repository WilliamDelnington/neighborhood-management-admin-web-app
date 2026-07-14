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
import { AppError, ModulePermissionGroup, RoleRecord } from "@dts";
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
};

const EMPTY_FORM: FormState = {
    key: "",
    name: "",
    description: "",
    active: true,
    sortOrder: 0,
    permissions: [],
};

const RoleListContent: React.FC = () => {
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [registry, setRegistry] = useState<ModulePermissionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        Promise.all([fetchRoles(), fetchRolePermissionRegistry()])
            .then(([roleList, permissionRegistry]) => {
                setRoles(roleList);
                setRegistry(permissionRegistry);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
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
        });
        setSheetOpen(true);
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
                const updated = await updateRole(editingRole._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                    permissions: form.permissions,
                });
                setRoles(prev =>
                    prev.map(r => (r._id === updated._id ? updated : r)),
                );
                toast.success("Đã cập nhật vai trò");
            } else {
                const created = await createRole({
                    key: form.key.trim(),
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                    permissions: form.permissions,
                });
                setRoles(prev => [...prev, created]);
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
            setRoles(prev => prev.filter(r => r._id !== roleToDelete._id));
            toast.success("Đã xóa vai trò");
            setRoleToDelete(null);
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
                {!loading && error && <ErrorState onRetry={load} />}
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
