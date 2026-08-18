import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
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
import { AppError, UtilityApp } from "@dts";
import {
    createUtilityApp,
    deleteUtilityApp,
    fetchUtilityApps,
    updateUtilityApp,
    uploadUtilityAppIcon,
} from "@service/utilityAppApi";

const UtilityAppListPage: React.FC = () => (
    <AdminGuard permissions={["utility_apps.manage"]}>
        <UtilityAppListContent />
    </AdminGuard>
);

type FormState = {
    name: string;
    icon: string;
    url: string;
    active: boolean;
    sortOrder: string;
};

const EMPTY_FORM: FormState = {
    name: "",
    icon: "",
    url: "",
    active: true,
    sortOrder: "0",
};

/**
 * "Nhom tien ich" (trong nhom "Quan ly dich vu") - danh sach shortcut icon+ten+
 * duong dan hien thi tren trang chu resident-web-app (xem HomePage.tsx o repo
 * do). icon la URL anh (khong dung icon-key vi 2 frontend dung 2 bo UI khac
 * nhau - URL anh render giong nhau o ca hai noi). Anh duoc tai truc tiep len
 * qua endpoint rieng /api/utility-apps/upload-icon (chi can quyen
 * utility_apps.manage, khong dung /api/files vi endpoint do doi hoi them
 * quyen files.create) - backend tra ve san URL tuyet doi de resident-web-app
 * (origin khac) van render duoc.
 */
const UtilityAppListContent: React.FC = () => {
    const canManage = usePermission("utility_apps.manage");

    const [items, setItems] = useState<UtilityApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<UtilityApp | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);

    const [toDelete, setToDelete] = useState<UtilityApp | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchUtilityApps({ limit: 100 })
            .then(res => setItems(res.items))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (app: UtilityApp) => {
        setEditing(app);
        setForm({
            name: app.name,
            icon: app.icon,
            url: app.url,
            active: app.active,
            sortOrder: String(app.sortOrder),
        });
        setSheetOpen(true);
    };

    const handleIconFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const selected = e.target.files?.[0];
        e.target.value = "";
        if (!selected) return;
        try {
            setUploadingIcon(true);
            const { url } = await uploadUtilityAppIcon(selected);
            setForm(prev => ({ ...prev, icon: url }));
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingIcon(false);
        }
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.icon.trim() || !form.url.trim()) {
            toast.error("Vui lòng nhập đầy đủ Tên, Icon và Đường dẫn");
            return;
        }
        if (uploadingIcon) {
            toast.error("Vui lòng chờ tải ảnh icon xong");
            return;
        }
        try {
            setSaving(true);
            const input = {
                name: form.name.trim(),
                icon: form.icon.trim(),
                url: form.url.trim(),
                active: form.active,
                sortOrder: Number(form.sortOrder) || 0,
            };
            if (editing) {
                await updateUtilityApp(editing._id, input);
                toast.success("Đã cập nhật tiện ích");
            } else {
                await createUtilityApp(input);
                toast.success("Đã thêm tiện ích mới");
            }
            setSheetOpen(false);
            load();
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
            await deleteUtilityApp(toDelete._id);
            toast.success("Đã xóa tiện ích");
            setToDelete(null);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Nhóm tiện ích"
                description="Quản lý nhóm tiện ích/dịch vụ tích hợp cho cư dân."
                action={
                    canManage && (
                        <Button onClick={openCreateSheet}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm tiện ích
                        </Button>
                    )
                }
            />

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có tiện ích nào được thêm" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead className="w-16">Icon</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Đường dẫn</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead aria-label="Thao tác" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((app, index) => (
                                <TableRow
                                    key={app._id}
                                    className={canManage ? "cursor-pointer" : ""}
                                    onClick={
                                        canManage
                                            ? () => openEditSheet(app)
                                            : undefined
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <img
                                            src={app.icon}
                                            alt=""
                                            className="h-8 w-8 rounded object-cover"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {app.name}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-text_2">
                                        {app.url}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={app.active ? "green" : "gray"}>
                                            {app.active ? "Hiển thị" : "Đã ẩn"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="!text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setToDelete(app);
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
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Cập nhật tiện ích" : "Thêm tiện ích mới"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên</Label>
                                <Input
                                    placeholder="VD: Đối soát Sổ đỏ"
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
                                <Label>Icon (ảnh)</Label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingIcon}
                                    onChange={handleIconFileChange}
                                    className="block w-full text-sm text-text_2"
                                />
                                {uploadingIcon && (
                                    <p className="text-xs text-text_2">
                                        Đang tải ảnh lên...
                                    </p>
                                )}
                                {form.icon && !uploadingIcon && (
                                    <img
                                        src={form.icon}
                                        alt=""
                                        className="h-10 w-10 rounded object-cover"
                                    />
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Đường dẫn</Label>
                                <Input
                                    placeholder="https://..."
                                    value={form.url}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            url: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Thứ tự hiển thị</Label>
                                <Input
                                    type="number"
                                    value={form.sortOrder}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            sortOrder: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.active}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            active: checked === true,
                                        }))
                                    }
                                />
                                Hiển thị trên trang chủ
                            </label>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={saving}
                            disabled={uploadingIcon}
                            onClick={handleSave}
                        >
                            {editing ? "Lưu thay đổi" : "Thêm tiện ích"}
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
                        <DialogTitle>Xóa tiện ích</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa &quot;{toDelete?.name}&quot;?
                            Thao tác này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setToDelete(null)}
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

export default UtilityAppListPage;
