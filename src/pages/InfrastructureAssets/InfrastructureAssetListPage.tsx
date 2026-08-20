import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Paperclip, Plus, Trash2, Upload } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
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
import { usePermission } from "@store/authStore";
import { DEFAULT_PAGE_SIZE, resolveAssetUrl } from "@constants/common";
import {
    INFRASTRUCTURE_ASSET_CONDITION_LABEL,
    INFRASTRUCTURE_ASSET_CONDITION_TONE,
    INFRASTRUCTURE_ASSET_TYPE_LABEL,
} from "@constants/domain";
import {
    AnnouncementAttachment,
    AppError,
    InfrastructureAsset,
    InfrastructureAssetCondition,
    InfrastructureAssetType,
    Neighborhood,
    INFRASTRUCTURE_ASSET_CONDITIONS,
    INFRASTRUCTURE_ASSET_TYPES,
} from "@dts";
import {
    createInfrastructureAsset,
    deleteInfrastructureAsset,
    deleteInfrastructureAssetAttachment,
    fetchInfrastructureAssetAttachments,
    fetchInfrastructureAssets,
    updateInfrastructureAsset,
    uploadInfrastructureAssetAttachment,
} from "@service/infrastructureAssetApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";

const ALL_VALUE = "__all__";

const neighborhoodName = (
    neighborhoodId: InfrastructureAsset["neighborhoodId"],
): string =>
    typeof neighborhoodId === "string" ? "" : neighborhoodId.name;

interface FormState {
    name: string;
    type: InfrastructureAssetType | "";
    neighborhoodId: string;
    location: string;
    condition: InfrastructureAssetCondition;
    note: string;
}

const EMPTY_FORM: FormState = {
    name: "",
    type: "",
    neighborhoodId: "",
    location: "",
    condition: "binh_thuong",
    note: "",
};

const InfrastructureAssetListPage: React.FC = () => (
    <AdminGuard permissions={["infrastructure.read"]}>
        <InfrastructureAssetListContent />
    </AdminGuard>
);

const InfrastructureAssetListContent: React.FC = () => {
    const navigate = useNavigate();
    const canManage = usePermission("infrastructure.manage");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<InfrastructureAssetType | "">(
        "",
    );
    const [conditionFilter, setConditionFilter] = useState<
        InfrastructureAssetCondition | ""
    >("");
    const [items, setItems] = useState<InfrastructureAsset[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
        [],
    );
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);
    // Tai san chua duoc tao (chua co id) khong the goi uploadInfrastructureAssetAttachment
    // ngay (can relatedId that su) - file chon o man tao moi duoc giu tam o day,
    // roi tai len ngay sau khi createInfrastructureAsset() thanh cong.
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchInfrastructureAssets({
            page: targetPage,
            search: search || undefined,
            type: typeFilter || undefined,
            condition: conditionFilter || undefined,
            limit: size,
        })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
                setTotal(res.total);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, typeFilter, conditionFilter]);

    useEffect(() => {
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setPendingFiles([]);
        setAttachments([]);
        setSheetOpen(true);
    };

    const openEdit = (asset: InfrastructureAsset) => {
        setEditingId(asset._id);
        setForm({
            name: asset.name,
            type: asset.type,
            neighborhoodId:
                typeof asset.neighborhoodId === "string"
                    ? asset.neighborhoodId
                    : asset.neighborhoodId._id,
            location: asset.location || "",
            condition: asset.condition,
            note: asset.note || "",
        });
        setPendingFiles([]);
        setAttachmentsLoading(true);
        fetchInfrastructureAssetAttachments(asset._id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
        setSheetOpen(true);
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!editingId) {
            setPendingFiles(prev => [...prev, file]);
            return;
        }
        try {
            setUploading(true);
            const asset = await uploadInfrastructureAssetAttachment(
                editingId,
                file,
            );
            setAttachments(prev => [asset, ...prev]);
            toast.success("Đã tải lên file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteAttachment = async (fileId: string) => {
        if (!editingId) return;
        try {
            setDeletingAttachmentId(fileId);
            await deleteInfrastructureAssetAttachment(editingId, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.type || !form.neighborhoodId) {
            toast.error("Vui lòng nhập tên, chọn loại và tổ dân phố");
            return;
        }
        try {
            setSubmitting(true);
            if (editingId) {
                await updateInfrastructureAsset(editingId, {
                    name: form.name.trim(),
                    type: form.type,
                    location: form.location.trim() || undefined,
                    condition: form.condition,
                    note: form.note.trim() || undefined,
                });
                toast.success("Đã cập nhật tài sản hạ tầng");
            } else {
                const created = await createInfrastructureAsset({
                    name: form.name.trim(),
                    type: form.type,
                    neighborhoodId: form.neighborhoodId,
                    location: form.location.trim() || undefined,
                    condition: form.condition,
                    note: form.note.trim() || undefined,
                });
                let uploadFailures = 0;
                for (const file of pendingFiles) {
                    // eslint-disable-next-line no-await-in-loop
                    await uploadInfrastructureAssetAttachment(
                        created._id,
                        file,
                    ).catch(() => {
                        uploadFailures += 1;
                    });
                }
                if (uploadFailures > 0) {
                    toast.error(
                        `Đã thêm tài sản nhưng ${uploadFailures} tệp đính kèm tải lên thất bại`,
                    );
                } else {
                    toast.success("Đã thêm tài sản hạ tầng");
                }
            }
            setSheetOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        try {
            setDeleting(true);
            await deleteInfrastructureAsset(editingId);
            toast.success("Đã xóa tài sản hạ tầng");
            setSheetOpen(false);
            load(1);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Sổ hạ tầng</h1>
                {canManage && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm tài sản
                    </Button>
                )}
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
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
                        placeholder="Tìm theo tên..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={typeFilter || ALL_VALUE}
                    onValueChange={v =>
                        setTypeFilter(
                            v === ALL_VALUE ? "" : (v as InfrastructureAssetType),
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả loại" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>Tất cả loại</SelectItem>
                        {INFRASTRUCTURE_ASSET_TYPES.map(t => (
                            <SelectItem key={t} value={t}>
                                {INFRASTRUCTURE_ASSET_TYPE_LABEL[t]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={conditionFilter || ALL_VALUE}
                    onValueChange={v =>
                        setConditionFilter(
                            v === ALL_VALUE
                                ? ""
                                : (v as InfrastructureAssetCondition),
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>
                            Tất cả tình trạng
                        </SelectItem>
                        {INFRASTRUCTURE_ASSET_CONDITIONS.map(c => (
                            <SelectItem key={c} value={c}>
                                {INFRASTRUCTURE_ASSET_CONDITION_LABEL[c]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">
                    {total} tài sản hạ tầng
                </div>
            )}

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có tài sản hạ tầng nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Tổ dân phố</TableHead>
                                <TableHead>Tình trạng</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((a, index) => (
                                <TableRow
                                    key={a._id}
                                    className="cursor-pointer"
                                    onClick={() => openEdit(a)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {a.name}
                                        {a.location && (
                                            <div className="text-xs text-text_2">
                                                {a.location}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {INFRASTRUCTURE_ASSET_TYPE_LABEL[a.type]}
                                    </TableCell>
                                    <TableCell>
                                        {neighborhoodName(a.neighborhoodId)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                INFRASTRUCTURE_ASSET_CONDITION_TONE[
                                                    a.condition
                                                ]
                                            }
                                        >
                                            {
                                                INFRASTRUCTURE_ASSET_CONDITION_LABEL[
                                                    a.condition
                                                ]
                                            }
                                        </Badge>
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
                            {editingId ? "Cập nhật tài sản hạ tầng" : "Thêm tài sản hạ tầng"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        <div className="space-y-1.5">
                            <Label>Tên</Label>
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
                            <Label>Loại</Label>
                            <Select
                                value={form.type}
                                onValueChange={v =>
                                    setForm(prev => ({
                                        ...prev,
                                        type: v as InfrastructureAssetType,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INFRASTRUCTURE_ASSET_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>
                                            {INFRASTRUCTURE_ASSET_TYPE_LABEL[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tổ dân phố</Label>
                            <Select
                                value={form.neighborhoodId}
                                onValueChange={v =>
                                    setForm(prev => ({
                                        ...prev,
                                        neighborhoodId: v,
                                    }))
                                }
                                disabled={!!editingId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tổ dân phố" />
                                </SelectTrigger>
                                <SelectContent>
                                    {neighborhoods.map(n => (
                                        <SelectItem key={n._id} value={n._id}>
                                            {n.code} — {n.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Vị trí (tùy chọn)</Label>
                            <Input
                                value={form.location}
                                onChange={e =>
                                    setForm(prev => ({
                                        ...prev,
                                        location: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tình trạng</Label>
                            <Select
                                value={form.condition}
                                onValueChange={v =>
                                    setForm(prev => ({
                                        ...prev,
                                        condition:
                                            v as InfrastructureAssetCondition,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {INFRASTRUCTURE_ASSET_CONDITIONS.map(c => (
                                        <SelectItem key={c} value={c}>
                                            {
                                                INFRASTRUCTURE_ASSET_CONDITION_LABEL[
                                                    c
                                                ]
                                            }
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ghi chú</Label>
                            <Textarea
                                value={form.note}
                                onChange={e =>
                                    setForm(prev => ({
                                        ...prev,
                                        note: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="border-t border-divider_01 pt-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Tệp đính kèm (không bắt buộc)
                                </h3>
                                {canManage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        loading={uploading}
                                        onClick={handleUploadClick}
                                    >
                                        <Upload className="mr-1 h-3.5 w-3.5" />
                                        Tải lên
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    onChange={handleFileSelected}
                                />
                            </div>
                            {!editingId && (
                                <p className="mb-2 text-xs text-text_2">
                                    Tệp chọn ở đây sẽ được tải lên ngay sau khi
                                    lưu.
                                </p>
                            )}
                            {editingId && attachmentsLoading && (
                                <LoadingState />
                            )}
                            {editingId &&
                                !attachmentsLoading &&
                                attachments.length === 0 &&
                                pendingFiles.length === 0 && (
                                    <EmptyState label="Chưa có file đính kèm" />
                                )}
                            {!editingId && pendingFiles.length === 0 && (
                                <EmptyState label="Chưa có file đính kèm" />
                            )}
                            {editingId &&
                                !attachmentsLoading &&
                                attachments.map(a => (
                                    <div
                                        key={a._id}
                                        className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                                    >
                                        <a
                                            href={resolveAssetUrl(a.url)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 text-primary hover:underline"
                                        >
                                            <Paperclip className="h-3.5 w-3.5" />
                                            {a.name}
                                        </a>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="!text-red-500"
                                                loading={
                                                    deletingAttachmentId ===
                                                    a._id
                                                }
                                                onClick={() =>
                                                    handleDeleteAttachment(
                                                        a._id,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            {!editingId &&
                                pendingFiles.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Paperclip className="h-3.5 w-3.5" />
                                            {file.name}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="!text-red-500"
                                            onClick={() =>
                                                handleRemovePendingFile(index)
                                            }
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                        </div>

                        {editingId && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    navigate(
                                        `/complaints?relatedAssetId=${editingId}`,
                                    )
                                }
                            >
                                Xem phản ánh liên quan
                            </Button>
                        )}
                    </div>
                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        {editingId && canManage && (
                            <Button
                                variant="destructive"
                                loading={deleting}
                                onClick={handleDelete}
                            >
                                Xóa tài sản
                            </Button>
                        )}
                        {canManage && (
                            <Button loading={submitting} onClick={handleSubmit}>
                                Lưu
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default InfrastructureAssetListPage;
