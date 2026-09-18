import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
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
import PageHeader from "@components/admin/PageHeader";
import FilterBar from "@components/admin/FilterBar";
import { usePermission } from "@store/authStore";
import { POI_CATEGORY_LIST } from "@constants/poi";
import { AppError, PoiCategory } from "@dts";
import {
    Poi,
    createPoi,
    deletePoi,
    fetchPois,
    scanPois,
    updatePoi,
} from "@service/poiApi";

const ALL_VALUE = "__all__";

interface FormState {
    name: string;
    category: PoiCategory | "";
    lat: string;
    lng: string;
    address: string;
    verified: boolean;
}

const EMPTY_FORM: FormState = {
    name: "",
    category: "",
    lat: "",
    lng: "",
    address: "",
    verified: true,
};

const categoryLabel = (category: PoiCategory) =>
    POI_CATEGORY_LIST.find(c => c.key === category)?.label || category;

const PoiListPage: React.FC = () => (
    <AdminGuard permissions={["pois.read"]}>
        <PoiListContent />
    </AdminGuard>
);

const PoiListContent: React.FC = () => {
    const canManage = usePermission("pois.manage");

    const [categoryFilter, setCategoryFilter] = useState<PoiCategory | "">("");
    const [verifiedFilter, setVerifiedFilter] = useState<"" | "true" | "false">("");
    const [items, setItems] = useState<Poi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [scanning, setScanning] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchPois({
            category: categoryFilter || undefined,
            verified: verifiedFilter === "" ? undefined : verifiedFilter === "true",
        })
            .then(setItems)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, [categoryFilter, verifiedFilter]);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEdit = (poi: Poi) => {
        setEditingId(poi._id);
        setForm({
            name: poi.name,
            category: poi.category,
            lat: String(poi.lat),
            lng: String(poi.lng),
            address: poi.address || "",
            verified: poi.verified,
        });
        setSheetOpen(true);
    };

    const handleScan = async () => {
        try {
            setScanning(true);
            const results = await scanPois();
            const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
            toast.success(
                totalCreated > 0
                    ? `Đã quét xong - thêm ${totalCreated} điểm mới (chưa duyệt), vào từng dòng để kiểm tra lại`
                    : "Đã quét xong - không có điểm mới nào (có thể trùng điểm đã có)",
            );
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setScanning(false);
        }
    };

    const handleSubmit = async () => {
        const lat = Number(form.lat);
        const lng = Number(form.lng);
        if (!form.name.trim() || !form.category || Number.isNaN(lat) || Number.isNaN(lng)) {
            toast.error("Vui lòng nhập tên, chọn danh mục và nhập đúng lat/lng");
            return;
        }
        try {
            setSubmitting(true);
            const payload = {
                name: form.name.trim(),
                category: form.category,
                lat,
                lng,
                address: form.address.trim() || undefined,
                verified: form.verified,
            };
            if (editingId) {
                await updatePoi(editingId, payload);
                toast.success("Đã cập nhật điểm tiện ích");
            } else {
                await createPoi(payload);
                toast.success("Đã thêm điểm tiện ích");
            }
            setSheetOpen(false);
            load();
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
            await deletePoi(editingId);
            toast.success("Đã xoá điểm tiện ích");
            setSheetOpen(false);
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
                title="Điểm tiện ích"
                description="UBND/Công an/Trường học/Chợ... hiển thị trên Bản đồ tiện ích ở Dashboard."
                action={
                    canManage && (
                        <div className="flex gap-2">
                            <Button variant="outline" loading={scanning} onClick={handleScan}>
                                <RefreshCw className="mr-1 h-4 w-4" />
                                Quét lại
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="mr-1 h-4 w-4" />
                                Thêm điểm
                            </Button>
                        </div>
                    )
                }
            />

            <div className="mb-3 rounded-lg border border-dashed border-divider_01 bg-ng_10 px-3 py-2 text-xs text-text_2">
                Kết quả &quot;Quét lại&quot; được lấy xấp xỉ qua Goong Autocomplete
                (không phải tìm theo danh mục thật) nên có thể sai/thiếu - luôn ở
                trạng thái <strong>Chưa duyệt</strong>. Hãy kiểm tra từng điểm rồi
                đánh dấu &quot;Đã duyệt&quot; (hoặc xoá nếu sai) trước khi tin
                dùng - chỉ điểm đã duyệt mới hiện trên Bản đồ tiện ích.
            </div>

            <FilterBar>
                <Select
                    value={categoryFilter || ALL_VALUE}
                    onValueChange={v =>
                        setCategoryFilter(v === ALL_VALUE ? "" : (v as PoiCategory))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>Tất cả danh mục</SelectItem>
                        {POI_CATEGORY_LIST.map(c => (
                            <SelectItem key={c.key} value={c.key}>
                                {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={verifiedFilter || ALL_VALUE}
                    onValueChange={v =>
                        setVerifiedFilter(v === ALL_VALUE ? "" : (v as "true" | "false"))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
                        <SelectItem value="true">Đã duyệt</SelectItem>
                        <SelectItem value="false">Chưa duyệt</SelectItem>
                    </SelectContent>
                </Select>
            </FilterBar>

            {items.length > 0 && (
                <div className="mb-2 text-xs text-text_2">{items.length} điểm tiện ích</div>
            )}

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có điểm tiện ích nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên</TableHead>
                                <TableHead>Danh mục</TableHead>
                                <TableHead>Toạ độ</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Nguồn</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(poi => (
                                <TableRow
                                    key={poi._id}
                                    className="cursor-pointer"
                                    onClick={() => openEdit(poi)}
                                >
                                    <TableCell className="font-medium">
                                        {poi.name}
                                        {poi.address && (
                                            <div className="text-xs text-text_2">
                                                {poi.address}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{categoryLabel(poi.category)}</TableCell>
                                    <TableCell className="text-xs text-text_2">
                                        {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={poi.verified ? "green" : "yellow"}>
                                            {poi.verified ? "Đã duyệt" : "Chưa duyệt"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-text_2">
                                        {poi.source === "scan" ? "Quét tự động" : "Nhập tay"}
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEdit(poi)}
                                        >
                                            Chi tiết
                                        </Button>
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
                            {editingId ? "Cập nhật điểm tiện ích" : "Thêm điểm tiện ích"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        <div className="space-y-1.5">
                            <Label>Tên</Label>
                            <Input
                                value={form.name}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, name: e.target.value }))
                                }
                                disabled={!canManage}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Danh mục</Label>
                            <Select
                                value={form.category}
                                onValueChange={v =>
                                    setForm(prev => ({ ...prev, category: v as PoiCategory }))
                                }
                                disabled={!canManage}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {POI_CATEGORY_LIST.map(c => (
                                        <SelectItem key={c.key} value={c.key}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Vĩ độ (lat)</Label>
                                <Input
                                    value={form.lat}
                                    placeholder="VD: 20.980000"
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, lat: e.target.value }))
                                    }
                                    disabled={!canManage}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Kinh độ (lng)</Label>
                                <Input
                                    value={form.lng}
                                    placeholder="VD: 105.745000"
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, lng: e.target.value }))
                                    }
                                    disabled={!canManage}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Địa chỉ (tuỳ chọn)</Label>
                            <Input
                                value={form.address}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, address: e.target.value }))
                                }
                                disabled={!canManage}
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.verified}
                                onCheckedChange={checked =>
                                    setForm(prev => ({ ...prev, verified: checked === true }))
                                }
                                disabled={!canManage}
                            />
                            Đã duyệt (hiện trên Bản đồ tiện ích)
                        </label>
                    </div>
                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        {editingId && canManage && (
                            <Button
                                variant="destructive"
                                loading={deleting}
                                onClick={handleDelete}
                            >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Xoá điểm này
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

export default PoiListPage;
