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
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, CompanyType } from "@dts";
import {
    createCompanyType,
    deleteCompanyType,
    fetchCompanyTypes,
    updateCompanyType,
} from "@service/companyTypeApi";

const CompanyTypeListPage: React.FC = () => (
    <AdminGuard permissions={["company_types.read"]}>
        <CompanyTypeListContent />
    </AdminGuard>
);

const ACTIVE_ALL = "all";

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

const CompanyTypeListContent: React.FC = () => {
    const canCreate = usePermission("company_types.create");
    const canUpdate = usePermission("company_types.update");
    const canDelete = usePermission("company_types.delete");

    const [search, setSearch] = useState("");
    const [active, setActive] = useState<"" | "true" | "false">("");
    const [items, setItems] = useState<CompanyType[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<CompanyType | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState<CompanyType | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchCompanyTypes({
            page: targetPage,
            limit: size,
            search: search || undefined,
            active: active === "" ? undefined : active === "true",
        })
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
    }, [search, active]);

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (companyType: CompanyType) => {
        setEditing(companyType);
        setForm({
            name: companyType.name,
            description: companyType.description || "",
            active: companyType.active,
            sortOrder: companyType.sortOrder,
        });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editing) {
                await updateCompanyType(editing._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                });
                toast.success("Đã cập nhật loại hình doanh nghiệp");
                load(page);
            } else {
                await createCompanyType({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                });
                toast.success("Đã tạo loại hình doanh nghiệp mới");
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
            await deleteCompanyType(toDelete._id);
            toast.success("Đã xóa loại hình doanh nghiệp");
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
            <PageHeader
                title="Loại hình doanh nghiệp"
                description="Quản lý danh mục loại hình doanh nghiệp áp dụng cho công ty."
                action={
                    canCreate && (
                        <Button onClick={openCreateSheet}>Thêm loại hình</Button>
                    )
                }
            />

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, size);
                        }}
                    />
                    <Input
                        className="flex-1"
                        placeholder="Tìm theo tên loại hình..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={active || ACTIVE_ALL}
                    onValueChange={v =>
                        setActive(v === ACTIVE_ALL ? "" : (v as "true" | "false"))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ACTIVE_ALL}>
                            Tất cả trạng thái
                        </SelectItem>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có loại hình doanh nghiệp nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên loại hình</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((ct, index) => (
                                <TableRow
                                    key={ct._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() =>
                                        canUpdate && openEditSheet(ct)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {ct.name}
                                    </TableCell>
                                    <TableCell>{ct.description || "—"}</TableCell>
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
                <SheetContent className="flex flex-col sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {editing
                                ? "Cập nhật loại hình doanh nghiệp"
                                : "Thêm loại hình doanh nghiệp"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên loại hình</Label>
                                <Input
                                    placeholder="VD: Công ty TNHH một thành viên"
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
                                htmlFor="companyTypeActive"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="companyTypeActive"
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
                        <DialogTitle>Xóa loại hình doanh nghiệp</DialogTitle>
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

export default CompanyTypeListPage;
