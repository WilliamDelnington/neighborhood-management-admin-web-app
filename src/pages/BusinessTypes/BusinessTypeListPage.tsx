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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, BusinessType, DocumentType, RoleRecord } from "@dts";
import {
    createBusinessType,
    deleteBusinessType,
    DocumentRuleInput,
    fetchBusinessTypes,
    putBusinessTypeDocumentRules,
    updateBusinessType,
} from "@service/businessTypeApi";
import { fetchDocumentTypes } from "@service/documentTypeApi";
import { fetchRoles } from "@service/roleApi";

const BusinessTypeListPage: React.FC = () => (
    <AdminGuard permissions={["business_types.read"]}>
        <BusinessTypeListContent />
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

const BusinessTypeListContent: React.FC = () => {
    const canCreate = usePermission("business_types.create");
    const canUpdate = usePermission("business_types.update");
    const canDelete = usePermission("business_types.delete");

    const [search, setSearch] = useState("");
    const [active, setActive] = useState<"" | "true" | "false">("");
    const [items, setItems] = useState<BusinessType[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<BusinessType | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [toDelete, setToDelete] = useState<BusinessType | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [rules, setRules] = useState<DocumentRuleInput[]>([]);
    const [rulesSaving, setRulesSaving] = useState(false);

    useEffect(() => {
        fetchDocumentTypes({ active: true, limit: 100 })
            .then(res => setDocumentTypes(res.items))
            .catch(() => setDocumentTypes([]));
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
    }, []);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchBusinessTypes({
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
        setRules([]);
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
        setRules(
            (businessType.requiredDocuments || []).map(rule => ({
                documentTypeId:
                    typeof rule.documentTypeId === "string"
                        ? rule.documentTypeId
                        : rule.documentTypeId._id,
                isRequired: rule.isRequired,
                warningBeforeDays: rule.warningBeforeDays,
                reviewerRoles: rule.reviewerRoles,
            })),
        );
        setSheetOpen(true);
    };

    const addRule = () => {
        setRules(prev => [
            ...prev,
            {
                documentTypeId: "",
                isRequired: true,
                warningBeforeDays: undefined,
                reviewerRoles: [],
            },
        ]);
    };

    const removeRule = (index: number) => {
        setRules(prev => prev.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, patch: Partial<DocumentRuleInput>) => {
        setRules(prev =>
            prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
        );
    };

    const toggleReviewerRole = (index: number, roleKey: string) => {
        setRules(prev =>
            prev.map((r, i) => {
                if (i !== index) return r;
                const has = r.reviewerRoles.includes(roleKey);
                return {
                    ...r,
                    reviewerRoles: has
                        ? r.reviewerRoles.filter(k => k !== roleKey)
                        : [...r.reviewerRoles, roleKey],
                };
            }),
        );
    };

    const documentTypeById = (id: string) =>
        documentTypes.find(dt => dt._id === id);

    const handleSaveRules = async () => {
        if (!editing) return;
        if (rules.some(r => !r.documentTypeId)) {
            toast.error("Vui lòng chọn loại giấy tờ cho tất cả các dòng");
            return;
        }
        try {
            setRulesSaving(true);
            const updated = await putBusinessTypeDocumentRules(
                editing._id,
                rules,
            );
            setEditing(updated);
            setItems(prev =>
                prev.map(bt => (bt._id === updated._id ? updated : bt)),
            );
            toast.success("Đã cập nhật yêu cầu giấy tờ");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRulesSaving(false);
        }
    };

    const handleSave = async () => {
        if (rules.some(r => !r.documentTypeId)) {
            toast.error("Vui lòng chọn loại giấy tờ cho tất cả các dòng");
            return;
        }
        try {
            setSaving(true);
            if (editing) {
                await updateBusinessType(editing._id, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                });
                await putBusinessTypeDocumentRules(editing._id, rules);
                toast.success("Đã cập nhật loại hình kinh doanh");
                load(page);
            } else {
                const created = await createBusinessType({
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    active: form.active,
                    sortOrder: form.sortOrder,
                });
                if (rules.length > 0) {
                    await putBusinessTypeDocumentRules(created._id, rules);
                }
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
                    <EmptyState label="Chưa có loại hình kinh doanh nào" />
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
                            {items.map((bt, index) => (
                                <TableRow
                                    key={bt._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() =>
                                        canUpdate && openEditSheet(bt)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
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
                <SheetContent className="flex flex-col sm:max-w-lg">
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

                        <div className="mt-5 border-t border-divider_01 pt-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Giấy tờ yêu cầu
                                </h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addRule}
                                >
                                    + Thêm giấy tờ
                                </Button>
                            </div>

                            {rules.length === 0 && (
                                <p className="text-sm text-text_2">
                                    Loại hình này chưa yêu cầu giấy tờ nào.
                                </p>
                            )}

                            <div className="flex flex-col gap-3">
                                {rules.map((rule, index) => {
                                    const dt = documentTypeById(
                                        rule.documentTypeId,
                                    );
                                    const usedElsewhere = new Set(
                                        rules
                                            .filter((_, i) => i !== index)
                                            .map(r => r.documentTypeId),
                                    );
                                    return (
                                        <div
                                            key={index}
                                            className="rounded-lg border border-divider_01 p-3"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <Select
                                                    value={
                                                        rule.documentTypeId ||
                                                        undefined
                                                    }
                                                    onValueChange={val =>
                                                        updateRule(index, {
                                                            documentTypeId:
                                                                val,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại giấy tờ" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {documentTypes
                                                            .filter(
                                                                d =>
                                                                    !usedElsewhere.has(
                                                                        d._id,
                                                                    ),
                                                            )
                                                            .map(d => (
                                                                <SelectItem
                                                                    key={
                                                                        d._id
                                                                    }
                                                                    value={
                                                                        d._id
                                                                    }
                                                                >
                                                                    {
                                                                        d.name
                                                                    }
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="!text-red-500"
                                                    onClick={() =>
                                                        removeRule(index)
                                                    }
                                                >
                                                    Xóa
                                                </Button>
                                            </div>

                                            <div className="mb-2 flex items-center gap-2">
                                                <Checkbox
                                                    checked={
                                                        rule.isRequired
                                                    }
                                                    onCheckedChange={checked =>
                                                        updateRule(index, {
                                                            isRequired:
                                                                !!checked,
                                                        })
                                                    }
                                                />
                                                <Label className="text-sm font-normal">
                                                    Bắt buộc
                                                </Label>
                                            </div>

                                            {dt?.hasExpiryDate && (
                                                <div className="mb-2 space-y-1.5">
                                                    <Label className="text-xs">
                                                        Cảnh báo trước hết
                                                        hạn (ngày)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={
                                                            rule.warningBeforeDays ??
                                                            ""
                                                        }
                                                        onChange={e =>
                                                            updateRule(
                                                                index,
                                                                {
                                                                    warningBeforeDays:
                                                                        e
                                                                            .target
                                                                            .value
                                                                            ? Number(
                                                                                  e
                                                                                      .target
                                                                                      .value,
                                                                              )
                                                                            : undefined,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <Label className="text-xs">
                                                    Vai trò được duyệt
                                                    (để trống = dùng quyền
                                                    &quot;Duyệt / từ chối hộ
                                                    kinh doanh&quot; mặc
                                                    định)
                                                </Label>
                                                <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                    {roles.map(role => (
                                                        <div
                                                            key={role.key}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Checkbox
                                                                checked={rule.reviewerRoles.includes(
                                                                    role.key,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleReviewerRole(
                                                                        index,
                                                                        role.key,
                                                                    )
                                                                }
                                                            />
                                                            <Label className="text-sm font-normal">
                                                                {role.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {editing && (
                                <Button
                                    className="mt-3 w-full"
                                    variant="outline"
                                    loading={rulesSaving}
                                    onClick={handleSaveRules}
                                >
                                    Lưu yêu cầu giấy tờ
                                </Button>
                            )}
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
