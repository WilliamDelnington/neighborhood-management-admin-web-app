import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
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
    SheetFooter,
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
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, CorrespondenceType, Role, RoleRecord } from "@dts";
import {
    createCorrespondenceType,
    deleteCorrespondenceType,
    fetchCorrespondenceTypes,
    updateCorrespondenceType,
} from "@service/correspondenceTypeApi";
import { fetchRoles } from "@service/roleApi";

const CorrespondenceTypeListPage: React.FC = () => (
    <AdminGuard permissions={["correspondence_types.read"]}>
        <CorrespondenceTypeListContent />
    </AdminGuard>
);

type FormState = {
    name: string;
    code: string;
    description: string;
    allowedSenderRoles: Role[];
    allowedReceiverRoles: Role[];
    requireDocumentNumber: boolean;
    active: boolean;
};

const EMPTY_FORM: FormState = {
    name: "",
    code: "",
    description: "",
    allowedSenderRoles: [],
    allowedReceiverRoles: [],
    requireDocumentNumber: false,
    active: true,
};

const CorrespondenceTypeListContent: React.FC = () => {
    const canCreate = usePermission("correspondence_types.create");
    const canUpdate = usePermission("correspondence_types.update");
    const canDelete = usePermission("correspondence_types.delete");

    const [search, setSearch] = useState("");
    const [items, setItems] = useState<CorrespondenceType[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<CorrespondenceType | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState<CorrespondenceType | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchCorrespondenceTypes({ page: targetPage, search: search || undefined })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
    }, []);

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (type: CorrespondenceType) => {
        setEditing(type);
        setForm({
            name: type.name,
            code: type.code,
            description: type.description || "",
            allowedSenderRoles: type.allowedSenderRoles,
            allowedReceiverRoles: type.allowedReceiverRoles,
            requireDocumentNumber: type.requireDocumentNumber,
            active: type.active,
        });
        setSheetOpen(true);
    };

    const toggleRole = (
        key: "allowedSenderRoles" | "allowedReceiverRoles",
        role: Role,
    ) => {
        setForm(prev => ({
            ...prev,
            [key]: prev[key].includes(role)
                ? prev[key].filter(r => r !== role)
                : [...prev[key], role],
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editing) {
                await updateCorrespondenceType(editing._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    allowedSenderRoles: form.allowedSenderRoles,
                    allowedReceiverRoles: form.allowedReceiverRoles,
                    requireDocumentNumber: form.requireDocumentNumber,
                    active: form.active,
                });
                toast.success("Đã cập nhật loại văn bản");
                load(page);
            } else {
                await createCorrespondenceType({
                    name: form.name.trim(),
                    code: form.code.trim(),
                    description: form.description.trim() || undefined,
                    allowedSenderRoles: form.allowedSenderRoles,
                    allowedReceiverRoles: form.allowedReceiverRoles,
                    requireDocumentNumber: form.requireDocumentNumber,
                    active: form.active,
                });
                toast.success("Đã tạo loại văn bản mới");
                load(1);
            }
            setSheetOpen(false);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await deleteCorrespondenceType(toDelete._id);
            toast.success("Đã xóa loại văn bản");
            setToDelete(null);
            load(items.length === 1 && page > 1 ? page - 1 : page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    const roleLabel = (key: Role) =>
        roles.find(r => r.key === key)?.name || key;

    const isFormValid =
        form.name.trim() &&
        (editing || form.code.trim()) &&
        form.allowedSenderRoles.length > 0 &&
        form.allowedReceiverRoles.length > 0;

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Loại văn bản</h1>
                {canCreate && (
                    <Button onClick={openCreateSheet}>Thêm loại văn bản</Button>
                )}
            </div>

            <Input
                className="mb-3 max-w-sm"
                placeholder="Tìm theo tên loại văn bản..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có loại văn bản nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên loại văn bản</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead>Người nhận</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((ct, index) => (
                                <TableRow
                                    key={ct._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() => canUpdate && openEditSheet(ct)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {ct.name}
                                        {ct.description && (
                                            <div className="text-xs text-text_2">
                                                {ct.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {ct.allowedSenderRoles.map(r => (
                                                <Badge key={r} tone="blue">
                                                    {roleLabel(r)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {ct.allowedReceiverRoles.map(r => (
                                                <Badge key={r} tone="yellow">
                                                    {roleLabel(r)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={ct.active ? "green" : "gray"}>
                                            {ct.active ? "Hoạt động" : "Vô hiệu"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {canDelete && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="!text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setToDelete(ct);
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
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Cập nhật loại văn bản" : "Thêm loại văn bản"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên loại văn bản</Label>
                                <Input
                                    placeholder="VD: Công văn, Báo cáo, Đề xuất..."
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
                                <Label>Mã loại văn bản</Label>
                                <Input
                                    placeholder="VD: CONG_VAN"
                                    value={form.code}
                                    disabled={!!editing}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            code: e.target.value,
                                        }))
                                    }
                                />
                                {editing && (
                                    <p className="text-xs text-text_2">
                                        Không thể đổi mã sau khi tạo.
                                    </p>
                                )}
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
                            <div>
                                <Label>Vai trò được phép gửi</Label>
                                <div className="mt-1.5 grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border border-divider_01 p-2">
                                    {roles.map(r => (
                                        <label
                                            key={r.key}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={form.allowedSenderRoles.includes(
                                                    r.key,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleRole(
                                                        "allowedSenderRoles",
                                                        r.key,
                                                    )
                                                }
                                            />
                                            {r.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Vai trò được phép nhận</Label>
                                <div className="mt-1.5 grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border border-divider_01 p-2">
                                    {roles.map(r => (
                                        <label
                                            key={r.key}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={form.allowedReceiverRoles.includes(
                                                    r.key,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleRole(
                                                        "allowedReceiverRoles",
                                                        r.key,
                                                    )
                                                }
                                            />
                                            {r.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.requireDocumentNumber}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            requireDocumentNumber: !!checked,
                                        }))
                                    }
                                />
                                Bắt buộc nhập số/ký hiệu văn bản
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.active}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            active: !!checked,
                                        }))
                                    }
                                />
                                Đang hoạt động
                            </label>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={saving}
                            disabled={!isFormValid}
                            onClick={handleSave}
                        >
                            {editing ? "Lưu thay đổi" : "Tạo loại văn bản"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!toDelete}
                onOpenChange={open => !open && setToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa loại văn bản</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa &quot;{toDelete?.name}&quot;?
                            Thao tác này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToDelete(null)}>
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

export default CorrespondenceTypeListPage;
