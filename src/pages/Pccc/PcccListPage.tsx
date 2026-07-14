import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import StatCard from "@components/admin/StatCard";
import { usePermission } from "@store/authStore";
import { AppError, MucNguyCoPccc, PcccCheck } from "@dts";
import {
    MUC_NGUY_CO_PCCC_LABEL,
    MUC_NGUY_CO_PCCC_TONE,
} from "@constants/domain";
import {
    createPcccCheck,
    deletePcccCheck,
    fetchPcccChecks,
    fetchPcccRiskSummary,
    updatePcccCheck,
} from "@service/pcccApi";
import PcccForm, {
    EMPTY_PCCC_FORM,
    PcccFormValues,
    isPcccFormValid,
    toPcccInput,
} from "./PcccForm";

const ALL_RISK_LEVELS = "all";

const householdText = (h: PcccCheck["householdId"]) =>
    typeof h === "string" ? h : `${h.code} — ${h.address}`;

const householdIdOf = (h: PcccCheck["householdId"]) =>
    typeof h === "string" ? h : h._id;

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const checkToForm = (c: PcccCheck): PcccFormValues => ({
    householdId: householdIdOf(c.householdId),
    householdLabel: householdText(c.householdId),
    hasFireExtinguisher: c.hasFireExtinguisher,
    hasEmergencyExit: c.hasEmergencyExit,
    hasIndoorEvCharging: c.hasIndoorEvCharging,
    hasGasStoveOrStorageOrBusiness: c.hasGasStoveOrStorageOrBusiness,
    isCrowdedRental: c.isCrowdedRental,
    riskLevel: c.riskLevel,
    remediationNeeded: c.remediationNeeded || "",
    inspectionDate: c.inspectionDate ? c.inspectionDate.slice(0, 10) : "",
    followUpStatus: c.followUpStatus || "",
});

const PcccListPage: React.FC = () => (
    <AdminGuard permissions={["pccc.read"]}>
        <PcccListContent />
    </AdminGuard>
);

const PcccListContent: React.FC = () => {
    const canCreate = usePermission("pccc.create");
    const canManage = usePermission("pccc.update");

    const [searchParams, setSearchParams] = useSearchParams();
    const [riskLevel, setRiskLevel] = useState<MucNguyCoPccc | "">(
        (searchParams.get("riskLevel") as MucNguyCoPccc | null) || "",
    );

    const [summary, setSummary] = useState<Record<string, number>>({});
    const [items, setItems] = useState<PcccCheck[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PcccFormValues>(EMPTY_PCCC_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadSummary = () => {
        fetchPcccRiskSummary()
            .then(setSummary)
            .catch(() => setSummary({}));
    };

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchPcccChecks({ page: targetPage, riskLevel: riskLevel || undefined })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [riskLevel]);

    const handleRiskLevelChange = (value: string) => {
        const next = (value === ALL_RISK_LEVELS ? "" : value) as
            | MucNguyCoPccc
            | "";
        setRiskLevel(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("riskLevel", next);
            } else {
                params.delete("riskLevel");
            }
            return params;
        });
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_PCCC_FORM);
        setFormVisible(true);
    };

    const openEdit = (c: PcccCheck) => {
        if (!canManage) return;
        setEditingId(c._id);
        setForm(checkToForm(c));
        setFormVisible(true);
    };

    const handleSubmit = async () => {
        if (!isPcccFormValid(form)) {
            toast.error("Vui lòng chọn hộ dân và ngày kiểm tra");
            return;
        }
        try {
            setSubmitting(true);
            if (editingId) {
                await updatePcccCheck(editingId, toPcccInput(form));
                toast.success("Đã cập nhật đợt kiểm tra");
            } else {
                await createPcccCheck(toPcccInput(form));
                toast.success("Đã thêm đợt kiểm tra PCCC");
            }
            setFormVisible(false);
            load(1);
            loadSummary();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            setDeleting(true);
            await deletePcccCheck(confirmDeleteId);
            toast.success("Đã xóa đợt kiểm tra");
            setConfirmDeleteId(null);
            setFormVisible(false);
            load(1);
            loadSummary();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Phòng cháy chữa cháy</h1>
                {canCreate && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm đợt kiểm tra
                    </Button>
                )}
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
                <StatCard label="Xanh" value={summary.xanh ?? 0} tone="success" />
                <StatCard label="Vàng" value={summary.vang ?? 0} tone="warning" />
                <StatCard label="Đỏ" value={summary.do ?? 0} tone="danger" />
            </div>

            <Select
                value={riskLevel || ALL_RISK_LEVELS}
                onValueChange={handleRiskLevelChange}
            >
                <SelectTrigger className="mb-4 max-w-xs">
                    <SelectValue placeholder="Lọc theo mức nguy cơ" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_RISK_LEVELS}>
                        Tất cả mức nguy cơ
                    </SelectItem>
                    {(
                        Object.entries(MUC_NGUY_CO_PCCC_LABEL) as [
                            MucNguyCoPccc,
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
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có đợt kiểm tra PCCC nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hộ dân</TableHead>
                                <TableHead>Ngày kiểm tra</TableHead>
                                <TableHead>Mức nguy cơ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(c => (
                                <TableRow
                                    key={c._id}
                                    className={canManage ? "cursor-pointer" : ""}
                                    onClick={
                                        canManage ? () => openEdit(c) : undefined
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {householdText(c.householdId)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(c.inspectionDate)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={MUC_NGUY_CO_PCCC_TONE[c.riskLevel]}
                                        >
                                            {MUC_NGUY_CO_PCCC_LABEL[c.riskLevel]}
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}

            <Sheet open={formVisible} onOpenChange={setFormVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingId
                                ? "Sửa đợt kiểm tra PCCC"
                                : "Thêm đợt kiểm tra PCCC"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <PcccForm values={form} onChange={setForm} />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            {editingId ? "Lưu thay đổi" : "Thêm đợt kiểm tra"}
                        </Button>
                        {canManage && editingId && (
                            <Button
                                variant="outline"
                                className="w-full text-red-500"
                                onClick={() => setConfirmDeleteId(editingId)}
                            >
                                Xóa đợt kiểm tra
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!confirmDeleteId}
                onOpenChange={open => !open && setConfirmDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa đợt kiểm tra?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa đợt kiểm tra PCCC này? Hành động
                        này không thể hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDeleteId(null)}
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

export default PcccListPage;
