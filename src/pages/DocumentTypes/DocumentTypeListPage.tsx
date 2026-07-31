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
import { AppError, DocumentType } from "@dts";
import {
    createDocumentType,
    deleteDocumentType,
    fetchDocumentTypes,
    updateDocumentType,
} from "@service/documentTypeApi";

const DocumentTypeListPage: React.FC = () => (
    <AdminGuard permissions={["document_types.read"]}>
        <DocumentTypeListContent />
    </AdminGuard>
);

const TRI_ALL = "all";
type TriState = "" | "true" | "false";

type FormState = {
    name: string;
    code: string;
    description: string;
    hasIssueDate: boolean;
    hasExpiryDate: boolean;
    active: boolean;
};

const EMPTY_FORM: FormState = {
    name: "",
    code: "",
    description: "",
    hasIssueDate: false,
    hasExpiryDate: false,
    active: true,
};

const DocumentTypeListContent: React.FC = () => {
    const canCreate = usePermission("document_types.create");
    const canUpdate = usePermission("document_types.update");
    const canDelete = usePermission("document_types.delete");

    const [search, setSearch] = useState("");
    const [active, setActive] = useState<TriState>("");
    const [hasIssueDate, setHasIssueDate] = useState<TriState>("");
    const [hasExpiryDate, setHasExpiryDate] = useState<TriState>("");
    const [items, setItems] = useState<DocumentType[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<DocumentType | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState<DocumentType | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchDocumentTypes({
            page: targetPage,
            search: search || undefined,
            active: active === "" ? undefined : active === "true",
            hasIssueDate:
                hasIssueDate === "" ? undefined : hasIssueDate === "true",
            hasExpiryDate:
                hasExpiryDate === "" ? undefined : hasExpiryDate === "true",
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
    }, [search, active, hasIssueDate, hasExpiryDate]);

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (documentType: DocumentType) => {
        setEditing(documentType);
        setForm({
            name: documentType.name,
            code: documentType.code,
            description: documentType.description || "",
            hasIssueDate: documentType.hasIssueDate,
            hasExpiryDate: documentType.hasExpiryDate,
            active: documentType.active,
        });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editing) {
                await updateDocumentType(editing._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    hasIssueDate: form.hasIssueDate,
                    hasExpiryDate: form.hasExpiryDate,
                    active: form.active,
                });
                toast.success("Đã cập nhật loại giấy tờ");
                load(page);
            } else {
                await createDocumentType({
                    name: form.name.trim(),
                    code: form.code.trim(),
                    description: form.description.trim() || undefined,
                    hasIssueDate: form.hasIssueDate,
                    hasExpiryDate: form.hasExpiryDate,
                    active: form.active,
                });
                toast.success("Đã tạo loại giấy tờ mới");
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
            await deleteDocumentType(toDelete._id);
            toast.success("Đã xóa loại giấy tờ");
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
                <h1 className="text-lg font-semibold">Danh mục giấy tờ</h1>
                {canCreate && (
                    <Button onClick={openCreateSheet}>Thêm loại giấy tờ</Button>
                )}
            </div>

            <Input
                className="mb-3 max-w-sm"
                placeholder="Tìm theo tên loại giấy tờ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="mb-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <Select
                    value={active || TRI_ALL}
                    onValueChange={v =>
                        setActive(v === TRI_ALL ? "" : (v as TriState))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TRI_ALL}>Tất cả trạng thái</SelectItem>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={hasIssueDate || TRI_ALL}
                    onValueChange={v =>
                        setHasIssueDate(v === TRI_ALL ? "" : (v as TriState))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Ngày cấp" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TRI_ALL}>Tất cả (ngày cấp)</SelectItem>
                        <SelectItem value="true">Có ngày cấp</SelectItem>
                        <SelectItem value="false">Không có ngày cấp</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={hasExpiryDate || TRI_ALL}
                    onValueChange={v =>
                        setHasExpiryDate(v === TRI_ALL ? "" : (v as TriState))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Hạn dùng" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TRI_ALL}>Tất cả (hạn dùng)</SelectItem>
                        <SelectItem value="true">Có hạn dùng</SelectItem>
                        <SelectItem value="false">Không có hạn dùng</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có loại giấy tờ nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên loại giấy tờ</TableHead>
                                <TableHead>Mã</TableHead>
                                <TableHead>Ngày cấp / hạn dùng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(dt => (
                                <TableRow
                                    key={dt._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() =>
                                        canUpdate && openEditSheet(dt)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {dt.name}
                                        {dt.description && (
                                            <div className="text-xs text-text_2">
                                                {dt.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{dt.code}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {dt.hasIssueDate && (
                                                <Badge tone="blue">
                                                    Ngày cấp
                                                </Badge>
                                            )}
                                            {dt.hasExpiryDate && (
                                                <Badge tone="yellow">
                                                    Hạn dùng
                                                </Badge>
                                            )}
                                            {!dt.hasIssueDate &&
                                                !dt.hasExpiryDate && (
                                                    <span className="text-text_2">
                                                        —
                                                    </span>
                                                )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={dt.active ? "green" : "gray"}>
                                            {dt.active ? "Hoạt động" : "Vô hiệu"}
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
                                                    setToDelete(dt);
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
                            {editing ? "Cập nhật loại giấy tờ" : "Thêm loại giấy tờ"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên loại giấy tờ</Label>
                                <Input
                                    placeholder="VD: Giấy chứng nhận đăng ký kinh doanh"
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
                                <Label>Mã loại giấy tờ</Label>
                                <Input
                                    placeholder="VD: GCN_DKKD"
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
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.hasIssueDate}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            hasIssueDate: !!checked,
                                        }))
                                    }
                                />
                                Có ngày cấp
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.hasExpiryDate}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            hasExpiryDate: !!checked,
                                        }))
                                    }
                                />
                                Có hạn dùng
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
                            disabled={
                                !form.name.trim() ||
                                (!editing && !form.code.trim())
                            }
                            onClick={handleSave}
                        >
                            {editing ? "Lưu thay đổi" : "Tạo loại giấy tờ"}
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
                        <DialogTitle>Xóa loại giấy tờ</DialogTitle>
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

export default DocumentTypeListPage;
