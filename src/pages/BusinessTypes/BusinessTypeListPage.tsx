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
import { AppError, BusinessType } from "@dts";
import {
    createBusinessType,
    deleteBusinessType,
    fetchBusinessTypes,
    updateBusinessType,
} from "@service/businessTypeApi";

const BusinessTypeListPage: React.FC = () => (
    <AdminGuard permissions={["business_types.read"]}>
        <BusinessTypeListContent />
    </AdminGuard>
);

type FormState = {
    name: string;
    description: string;
    active: boolean;
    sortOrder: number;
};

const EMPTY_FORM: FormState = {
    name: "",
    description: "",
    active: true,
    sortOrder: 0,
};

const BusinessTypeListContent: React.FC = () => {
    const canCreate = usePermission("business_types.create");
    const canUpdate = usePermission("business_types.update");
    const canDelete = usePermission("business_types.delete");

    const [items, setItems] = useState<BusinessType[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<BusinessType | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState<BusinessType | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchBusinessTypes({ page: targetPage })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
    }, []);

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (businessType: BusinessType) => {
        setEditing(businessType);
        setForm({
            name: businessType.name,
            description: businessType.description || "",
            active: businessType.active,
            sortOrder: businessType.sortOrder,
        });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editing) {
                await updateBusinessType(editing._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                });
                toast.success("Đã cập nhật loại hình kinh doanh");
                load(page);
            } else {
                await createBusinessType({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                });
                toast.success("Đã tạo loại hình kinh doanh mới");
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
            await deleteBusinessType(toDelete._id);
            toast.success("Đã xóa loại hình kinh doanh");
            setToDelete(null);
            load(items.length === 1 && page > 1 ? page - 1 : page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Loại hình kinh doanh</h1>
                {canCreate && (
                    <Button onClick={openCreateSheet}>Thêm loại hình</Button>
                )}
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có loại hình kinh doanh nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên loại hình</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(bt => (
                                <TableRow
                                    key={bt._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() =>
                                        canUpdate && openEditSheet(bt)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {bt.name}
                                    </TableCell>
                                    <TableCell>{bt.description || "—"}</TableCell>
                                    <TableCell>
                                        <Badge tone={bt.active ? "green" : "gray"}>
                                            {bt.active ? "Hoạt động" : "Vô hiệu"}
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
                                                    setToDelete(bt);
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
                            {editing
                                ? "Cập nhật loại hình kinh doanh"
                                : "Thêm loại hình kinh doanh"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên loại hình</Label>
                                <Input
                                    placeholder="VD: Kinh doanh tạp hóa"
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
                            <label
                                htmlFor="businessTypeActive"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="businessTypeActive"
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
                            disabled={!form.name.trim()}
                            onClick={handleSave}
                        >
                            {editing ? "Lưu thay đổi" : "Tạo loại hình"}
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
                        <DialogTitle>Xóa loại hình kinh doanh</DialogTitle>
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

export default BusinessTypeListPage;
