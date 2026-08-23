import React, { useEffect, useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Checkbox } from "@components/ui/checkbox";
import { Badge } from "@components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { AppError, ComplaintTypeDefinition } from "@dts";
import { usePermission } from "@store/authStore";
import {
    archiveComplaintTypeDefinition,
    ComplaintTypeRoleOption,
    createComplaintTypeDefinition,
    fetchComplaintTypeDefinitions,
    fetchComplaintTypeRoles,
    updateComplaintTypeDefinition,
} from "@service/complaintTypeApi";

type FormState = {
    key: string;
    name: string;
    description: string;
    active: boolean;
    // Thu tu trong mang the hien uu tien dieu huong nguoi nhan - vai tro
    // duoc chon TRUOC se duoc uu tien thu nguoi phu trach truoc (xem
    // resolveComplaintTypeRecipientIds o backend). Toggle chi them vao CUOI
    // mang / bo di dung vi tri, khong sap xep lai - thu tu check chinh la
    // thu tu uu tien.
    allowedReceiverRoles: string[];
};

const EMPTY_FORM: FormState = {
    key: "",
    name: "",
    description: "",
    active: true,
    allowedReceiverRoles: [],
};

const ComplaintTypeListPage: React.FC = () => (
    <AdminGuard permissions={["complaint_types.read"]}>
        <ComplaintTypeListContent />
    </AdminGuard>
);

const ComplaintTypeListContent: React.FC = () => {
    const canManage = usePermission("complaint_types.manage");
    const [items, setItems] = useState<ComplaintTypeDefinition[]>([]);
    const [roles, setRoles] = useState<ComplaintTypeRoleOption[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ComplaintTypeDefinition | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        Promise.all([
            fetchComplaintTypeDefinitions({
                page: targetPage,
                limit: size,
            }),
            fetchComplaintTypeRoles(),
        ])
            .then(([definitions, roleList]) => {
                setItems(definitions.items);
                setPage(definitions.page);
                setTotalPages(definitions.totalPages);
                setRoles(roleList);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => load(1), []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (item: ComplaintTypeDefinition) => {
        setEditing(item);
        setForm({
            key: item.key,
            name: item.name,
            description: item.description || "",
            active: item.active !== false,
            allowedReceiverRoles: item.allowedReceiverRoles || [],
        });
        setOpen(true);
    };

    const toggleRole = (roleKey: string) => {
        setForm(current => ({
            ...current,
            allowedReceiverRoles: current.allowedReceiverRoles.includes(roleKey)
                ? current.allowedReceiverRoles.filter(key => key !== roleKey)
                : [...current.allowedReceiverRoles, roleKey],
        }));
    };

    const handleSave = async () => {
        if (
            !form.name.trim() ||
            (!editing && !form.key.trim()) ||
            form.allowedReceiverRoles.length === 0
        ) {
            toast.error("Vui lòng nhập đủ tên và vai trò nhận phản ánh");
            return;
        }
        const payload = {
            key: form.key.trim(),
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            active: form.active,
            allowedReceiverRoles: form.allowedReceiverRoles,
        };
        try {
            setSaving(true);
            if (editing?._id) {
                const { key: _key, ...update } = payload;
                await updateComplaintTypeDefinition(editing._id, update);
                toast.success("Đã cập nhật loại phản ánh");
            } else {
                await createComplaintTypeDefinition(payload);
                toast.success("Đã tạo loại phản ánh");
            }
            setOpen(false);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (item: ComplaintTypeDefinition) => {
        if (!item._id || !window.confirm(`Ngừng sử dụng “${item.name}”?`)) return;
        try {
            await archiveComplaintTypeDefinition(item._id);
            toast.success("Đã ngừng sử dụng loại phản ánh");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">Loại phản ánh</h1>
                    <p className="mt-1 text-sm text-text_2">
                        Quản lý danh mục nhóm phản ánh và vai trò được ưu tiên tiếp
                        nhận, không cần sửa mã nguồn.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, size);
                        }}
                    />
                    {canManage && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" /> Thêm loại phản ánh
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có loại phản ánh" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên loại phản ánh</TableHead>
                                <TableHead>Vai trò nhận (theo thứ tự ưu tiên)</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                {canManage && <TableHead />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item._id || item.key}>
                                    <TableCell className="text-center text-text_2">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.key}</TableCell>
                                    <TableCell>
                                        <button
                                            className="flex items-center gap-1.5 text-left font-medium text-main hover:underline"
                                            onClick={() => canManage && openEdit(item)}
                                        >
                                            {item.isBuiltIn && (
                                                <Lock
                                                    className="h-3.5 w-3.5 text-text_2"
                                                    aria-label="Loại phản ánh hệ thống"
                                                />
                                            )}
                                            {item.name}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-sm text-text_2">
                                        {(item.allowedReceiverRoles || [])
                                            .map(
                                                key =>
                                                    roles.find(role => role.key === key)
                                                        ?.name || key,
                                            )
                                            .join(" → ")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={item.active === false ? "gray" : "green"}>
                                            {item.active === false ? "Ngừng dùng" : "Hoạt động"}
                                        </Badge>
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-right">
                                            {!item.isBuiltIn && item.active !== false && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Ngừng sử dụng"
                                                    onClick={() => void handleArchive(item)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={load}
                disabled={loading}
            />

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Sửa loại phản ánh" : "Thêm loại phản ánh"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto py-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Mã danh mục</Label>
                                <Input
                                    className="mt-1"
                                    value={form.key}
                                    disabled={!!editing}
                                    placeholder="internet_fpt"
                                    onChange={event =>
                                        setForm(current => ({
                                            ...current,
                                            key: event.target.value.toLowerCase(),
                                        }))
                                    }
                                />
                                {editing?.isBuiltIn && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-text_2">
                                        <Lock className="h-3 w-3" /> Loại phản ánh hệ thống -
                                        không đổi được mã
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Tên loại phản ánh</Label>
                                <Input
                                    className="mt-1"
                                    value={form.name}
                                    onChange={event =>
                                        setForm(current => ({ ...current, name: event.target.value }))
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Mô tả</Label>
                            <Textarea
                                className="mt-1"
                                value={form.description}
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Vai trò được nhận phản ánh</Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Chọn theo thứ tự ưu tiên: vai trò chọn trước sẽ được ưu
                                tiên tìm người phụ trách trước (ví dụ Tổ trưởng trước Tổ
                                phó, hoặc trước Cộng tác viên).
                            </p>
                            <div className="mt-2 space-y-2 rounded-lg border p-3">
                                {roles.map(role => {
                                    const priority = form.allowedReceiverRoles.indexOf(
                                        role.key,
                                    );
                                    return (
                                        <label
                                            key={role.key}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={priority !== -1}
                                                onCheckedChange={() => toggleRole(role.key)}
                                            />
                                            {role.name}
                                            {priority !== -1 && (
                                                <span className="text-xs text-text_2">
                                                    (ưu tiên {priority + 1})
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button className="w-full" loading={saving} onClick={() => void handleSave()}>
                            Lưu cấu hình
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default ComplaintTypeListPage;
