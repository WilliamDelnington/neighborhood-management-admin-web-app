import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Plus } from "lucide-react";
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
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, FileAsset, FileAssetCategory, RoleRecord } from "@dts";
import {
    FILE_ASSET_CATEGORY_LABEL,
    FILE_ASSET_CATEGORY_TONE,
} from "@constants/domain";
import {
    createFileAsset,
    deleteFileAsset,
    fetchFileAssets,
    updateFileAsset,
} from "@service/fileApi";
import { fetchRoles } from "@service/roleApi";

const ALL_CATEGORIES = "all";

const uploaderText = (uploadedBy: FileAsset["uploadedBy"]) =>
    typeof uploadedBy === "string" ? uploadedBy : uploadedBy.displayName;

const FileListPage: React.FC = () => (
    <AdminGuard permissions={["files.read"]}>
        <FileListContent />
    </AdminGuard>
);

type FormState = {
    name: string;
    url: string;
    description: string;
    category: FileAssetCategory;
    isPublic: boolean;
    audienceAll: boolean;
    targetRoles: string[];
};

const EMPTY_FORM: FormState = {
    name: "",
    url: "",
    description: "",
    category: "form",
    isPublic: true,
    audienceAll: true,
    targetRoles: [],
};

const FileListContent: React.FC = () => {
    const canCreate = usePermission("files.create");
    const canUpdate = usePermission("files.update");
    const canDelete = usePermission("files.delete");

    const [searchParams, setSearchParams] = useSearchParams();
    const [category, setCategory] = useState<FileAssetCategory | "">(
        (searchParams.get("category") as FileAssetCategory | null) || "",
    );

    const [items, setItems] = useState<FileAsset[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const roleNameByKey = React.useMemo(
        () => Object.fromEntries(roles.map(r => [r.key, r.name])),
        [roles],
    );

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<FileAsset | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState<FileAsset | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchFileAssets({ page: targetPage, category: category || undefined })
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    useEffect(() => {
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
    }, []);

    const handleCategoryChange = (value: string) => {
        const next = (value === ALL_CATEGORIES ? "" : value) as
            | FileAssetCategory
            | "";
        setCategory(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("category", next);
            } else {
                params.delete("category");
            }
            return params;
        });
    };

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (file: FileAsset) => {
        setEditing(file);
        setForm({
            name: file.name,
            url: file.url,
            description: file.description || "",
            category: file.category,
            isPublic: file.isPublic,
            audienceAll: file.audienceAll,
            targetRoles: file.targetRoles || [],
        });
        setSheetOpen(true);
    };

    const toggleTargetRole = (key: string, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            targetRoles: checked
                ? [...prev.targetRoles, key]
                : prev.targetRoles.filter(r => r !== key),
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editing) {
                await updateFileAsset(editing._id, {
                    name: form.name.trim(),
                    url: form.url.trim(),
                    description: form.description.trim() || undefined,
                    category: form.category,
                    isPublic: form.isPublic,
                    audienceAll: form.audienceAll,
                    targetRoles: form.audienceAll ? [] : form.targetRoles,
                });
                toast.success("Đã cập nhật tệp");
                load(page);
            } else {
                await createFileAsset({
                    name: form.name.trim(),
                    url: form.url.trim(),
                    description: form.description.trim() || undefined,
                    category: form.category,
                    isPublic: form.isPublic,
                    audienceAll: form.audienceAll,
                    targetRoles: form.audienceAll ? [] : form.targetRoles,
                });
                toast.success("Đã thêm tệp mới");
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
            await deleteFileAsset(toDelete._id);
            toast.success("Đã xóa tệp");
            setToDelete(null);
            load(items.length === 1 && page > 1 ? page - 1 : page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    const isFormValid =
        form.name.trim() &&
        form.url.trim() &&
        (form.audienceAll || form.targetRoles.length > 0);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Biểu mẫu &amp; tệp tin</h1>
                {canCreate && (
                    <Button onClick={openCreateSheet}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm tệp
                    </Button>
                )}
            </div>

            <Select
                value={category || ALL_CATEGORIES}
                onValueChange={handleCategoryChange}
            >
                <SelectTrigger className="mb-4 max-w-xs">
                    <SelectValue placeholder="Lọc theo loại tệp" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_CATEGORIES}>Tất cả loại tệp</SelectItem>
                    {(
                        Object.entries(FILE_ASSET_CATEGORY_LABEL) as [
                            FileAssetCategory,
                            string,
                        ][]
                    ).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có tệp nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên tệp</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Người tải lên</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Đối tượng xem</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((file, index) => (
                                <TableRow
                                    key={file._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() =>
                                        canUpdate && openEditSheet(file)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-1.5">
                                            {file.name}
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="text-secondary hover:text-main"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                FILE_ASSET_CATEGORY_TONE[
                                                    file.category
                                                ]
                                            }
                                        >
                                            {FILE_ASSET_CATEGORY_LABEL[
                                                file.category
                                            ]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {uploaderText(file.uploadedBy)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={file.isPublic ? "green" : "gray"}
                                        >
                                            {file.isPublic
                                                ? "Công khai"
                                                : "Nội bộ"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {file.audienceAll ? (
                                            <span className="text-text_2">
                                                Tất cả vai trò
                                            </span>
                                        ) : (
                                            (file.targetRoles || [])
                                                .map(
                                                    key =>
                                                        roleNameByKey[key] ??
                                                        key,
                                                )
                                                .join(", ") || (
                                                <span className="text-text_2">
                                                    Chưa chọn
                                                </span>
                                            )
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {canDelete && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="!text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setToDelete(file);
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
                            {editing ? "Cập nhật tệp" : "Thêm tệp mới"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên tệp</Label>
                                <Input
                                    placeholder="VD: Đơn đăng ký tạm trú"
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
                                <Label>Đường dẫn (URL)</Label>
                                <Input
                                    placeholder="https://drive.google.com/..."
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
                                <Label>Loại tệp</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={value =>
                                        setForm(prev => ({
                                            ...prev,
                                            category: value as FileAssetCategory,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(
                                            Object.entries(
                                                FILE_ASSET_CATEGORY_LABEL,
                                            ) as [FileAssetCategory, string][]
                                        ).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                htmlFor="fileIsPublic"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="fileIsPublic"
                                    checked={form.isPublic}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            isPublic: !!checked,
                                        }))
                                    }
                                />
                                Công khai (hiển thị trên Mini App)
                            </label>
                            <label
                                htmlFor="fileAudienceAll"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="fileAudienceAll"
                                    checked={form.audienceAll}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            audienceAll: !!checked,
                                        }))
                                    }
                                />
                                Mọi vai trò đều xem được
                            </label>
                            {!form.audienceAll && (
                                <div className="space-y-1.5">
                                    <Label>Chỉ hiển thị cho vai trò</Label>
                                    <div className="flex flex-col gap-2 rounded-lg border border-divider_01 p-3">
                                        {roles.length === 0 && (
                                            <span className="text-sm text-text_2">
                                                Không có vai trò nào
                                            </span>
                                        )}
                                        {roles.map(r => (
                                            <label
                                                key={r.key}
                                                htmlFor={`fileTargetRole-${r.key}`}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <Checkbox
                                                    id={`fileTargetRole-${r.key}`}
                                                    checked={form.targetRoles.includes(
                                                        r.key,
                                                    )}
                                                    onCheckedChange={checked =>
                                                        toggleTargetRole(
                                                            r.key,
                                                            !!checked,
                                                        )
                                                    }
                                                />
                                                {r.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={saving}
                            disabled={!isFormValid}
                            onClick={handleSave}
                        >
                            {editing ? "Lưu thay đổi" : "Thêm tệp"}
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
                        <DialogTitle>Xóa tệp</DialogTitle>
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

export default FileListPage;
