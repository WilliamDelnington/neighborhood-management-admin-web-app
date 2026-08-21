import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
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
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    LOAI_GIAO_DICH_TAI_CHINH_LABEL,
    TRANG_THAI_GIAO_DICH_LABEL,
    TRANG_THAI_GIAO_DICH_TONE,
} from "@constants/domain";
import { AppError, FinanceTransaction } from "@dts";
import {
    cancelFinanceTransaction,
    createFinanceTransaction,
    deleteFinanceTransaction,
    fetchFinanceSummary,
    fetchFinanceTransactions,
    FinanceTransactionInput,
    updateFinanceTransaction,
} from "@service/financeApi";

const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount || 0);

const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("vi-VN");
};

const humanizeKey = (key: string) =>
    key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/^./, c => c.toUpperCase());

const TYPE_FILTERS: { key: "" | FinanceTransaction["type"]; label: string }[] = [
    { key: "", label: "Tất cả" },
    { key: "thu", label: LOAI_GIAO_DICH_TAI_CHINH_LABEL.thu },
    { key: "chi", label: LOAI_GIAO_DICH_TAI_CHINH_LABEL.chi },
];

const STATUS_FILTERS: {
    key: "" | FinanceTransaction["status"];
    label: string;
}[] = [
    { key: "", label: "Mọi trạng thái" },
    { key: "nhap", label: TRANG_THAI_GIAO_DICH_LABEL.nhap },
    { key: "da_duyet", label: TRANG_THAI_GIAO_DICH_LABEL.da_duyet },
    { key: "da_huy", label: TRANG_THAI_GIAO_DICH_LABEL.da_huy },
];

type FinanceFormValues = {
    type: FinanceTransaction["type"];
    partyName: string;
    amount: string;
    transactionDate: string;
    content: string;
};

const EMPTY_FORM: FinanceFormValues = {
    type: "thu",
    partyName: "",
    amount: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    content: "",
};

const isFormValid = (values: FinanceFormValues) => {
    const amountNumber = Number(values.amount);
    return !!(
        values.partyName.trim() &&
        values.content.trim() &&
        values.transactionDate &&
        amountNumber > 0
    );
};

const FinanceListPage: React.FC = () => (
    <AdminGuard roles={["admin"]}>
        <FinanceListContent />
    </AdminGuard>
);

const FinanceListContent: React.FC = () => {
    const [summary, setSummary] = useState<Record<string, number> | null>(
        null,
    );
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [type, setType] = useState<"" | FinanceTransaction["type"]>("");
    const [status, setStatus] = useState<"" | FinanceTransaction["status"]>(
        "",
    );
    const [items, setItems] = useState<FinanceTransaction[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetVisible, setSheetVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FinanceFormValues>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [confirm, setConfirm] = useState<{
        title: string;
        description: string;
        onConfirm: () => void;
    } | null>(null);

    const loadSummary = () => {
        setSummaryLoading(true);
        fetchFinanceSummary()
            .then(res => setSummary(res || null))
            .catch(() => setSummary(null))
            .finally(() => setSummaryLoading(false));
    };

    const load = (targetPage: number, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchFinanceTransactions({
            page: targetPage,
            limit: size,
            type: type || undefined,
            status: status || undefined,
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
        loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, status]);

    const openCreateSheet = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSheetVisible(true);
    };

    const openEditSheet = (t: FinanceTransaction) => {
        setEditingId(t._id);
        setForm({
            type: t.type,
            partyName: t.partyName,
            amount: String(t.amount),
            transactionDate: (t.transactionDate || "").slice(0, 10),
            content: t.content,
        });
        setSheetVisible(true);
    };

    const handleSave = async () => {
        if (!isFormValid(form)) {
            toast.error(
                "Vui lòng nhập đầy đủ thông tin, số tiền phải lớn hơn 0",
            );
            return;
        }
        const input: FinanceTransactionInput = {
            type: form.type,
            partyName: form.partyName.trim(),
            amount: Number(form.amount),
            transactionDate: new Date(form.transactionDate).toISOString(),
            content: form.content.trim(),
        };
        try {
            setSaving(true);
            if (editingId) {
                await updateFinanceTransaction(editingId, input);
                toast.success("Đã cập nhật giao dịch");
            } else {
                await createFinanceTransaction(input);
                toast.success("Đã ghi nhận giao dịch");
            }
            setSheetVisible(false);
            load(1);
            loadSummary();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelTransaction = () => {
        if (!editingId) return;
        setConfirm({
            title: "Hủy giao dịch",
            description:
                "Giao dịch sẽ được đánh dấu là đã hủy. Bạn có chắc chắn muốn tiếp tục?",
            onConfirm: async () => {
                try {
                    setCancelling(true);
                    await cancelFinanceTransaction(editingId);
                    toast.success("Đã hủy giao dịch");
                    setSheetVisible(false);
                    load(1);
                    loadSummary();
                } catch (err) {
                    toast.error((err as AppError).message);
                } finally {
                    setCancelling(false);
                    setConfirm(null);
                }
            },
        });
    };

    const handleDeleteTransaction = () => {
        if (!editingId) return;
        setConfirm({
            title: "Xóa vĩnh viễn giao dịch",
            description:
                "Thao tác này sẽ xóa vĩnh viễn giao dịch khỏi hệ thống và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?",
            onConfirm: async () => {
                try {
                    setDeleting(true);
                    await deleteFinanceTransaction(editingId);
                    toast.success("Đã xóa giao dịch");
                    setSheetVisible(false);
                    load(1);
                    loadSummary();
                } catch (err) {
                    toast.error((err as AppError).message);
                } finally {
                    setDeleting(false);
                    setConfirm(null);
                }
            },
        });
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">
                    Tài chính tổ dân phố
                </h1>
                <div className="flex items-center gap-3">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, size);
                        }}
                    />
                    <Button onClick={openCreateSheet}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm mới
                    </Button>
                </div>
            </div>

            <div className="mb-4 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                <h2 className="mb-2 text-base font-semibold">
                    Tổng quan thu chi
                </h2>
                {summaryLoading && (
                    <LoadingState label="Đang tải tổng hợp..." />
                )}
                {!summaryLoading && !summary && (
                    <div className="text-xs text-text_2">
                        Chưa có dữ liệu tổng hợp
                    </div>
                )}
                {!summaryLoading && summary && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {Object.entries(summary).map(([key, value]) => (
                            <div key={key} className="rounded-lg bg-ng_10 p-3">
                                <div className="text-xs text-text_2">
                                    {humanizeKey(key)}
                                </div>
                                <div className="mt-1 text-sm font-semibold">
                                    {typeof value === "number"
                                        ? formatVnd(value)
                                        : String(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
                {TYPE_FILTERS.map(f => (
                    <Button
                        key={f.key || "all-type"}
                        size="sm"
                        variant={type === f.key ? "default" : "outline"}
                        onClick={() => setType(f.key)}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
                {STATUS_FILTERS.map(f => (
                    <Button
                        key={f.key || "all-status"}
                        size="sm"
                        variant={status === f.key ? "default" : "outline"}
                        onClick={() => setStatus(f.key)}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có giao dịch nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <div className="divide-y divide-divider_01 px-4">
                        {items.map(t => (
                            <button
                                key={t._id}
                                type="button"
                                className="flex w-full items-center justify-between gap-3 py-3 text-left"
                                onClick={() => openEditSheet(t)}
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                        {t.partyName} — {t.content}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {formatDate(t.transactionDate)}
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span
                                        className={`text-sm font-medium ${
                                            t.type === "thu"
                                                ? "text-green-600"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {t.type === "thu" ? "+" : "-"}
                                        {formatVnd(t.amount)}
                                    </span>
                                    <Badge tone={TRANG_THAI_GIAO_DICH_TONE[t.status]}>
                                        {TRANG_THAI_GIAO_DICH_LABEL[t.status]}
                                    </Badge>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!loading && !error && total > 0 && (
                <div className="mt-2 text-xs text-text_2">
                    Tổng số {total} giao dịch
                </div>
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={load}
                disabled={loading}
            />

            <Sheet open={sheetVisible} onOpenChange={setSheetVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingId ? "Chi tiết giao dịch" : "Thêm giao dịch"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Loại giao dịch</Label>
                                <RadioGroup
                                    className="flex flex-row gap-5"
                                    value={form.type}
                                    onValueChange={v =>
                                        setForm(prev => ({
                                            ...prev,
                                            type: v as FinanceTransaction["type"],
                                        }))
                                    }
                                >
                                    {(
                                        Object.entries(
                                            LOAI_GIAO_DICH_TAI_CHINH_LABEL,
                                        ) as [FinanceTransaction["type"], string][]
                                    ).map(([key, label]) => (
                                        <label
                                            key={key}
                                            htmlFor={`finance-type-${key}`}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <RadioGroupItem
                                                id={`finance-type-${key}`}
                                                value={key}
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Người nộp / người nhận</Label>
                                <Input
                                    placeholder="Họ tên hoặc đơn vị"
                                    value={form.partyName}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            partyName: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Số tiền (VND)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form.amount}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            amount: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Ngày thu / chi</Label>
                                <Input
                                    type="date"
                                    value={form.transactionDate}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            transactionDate: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Nội dung</Label>
                                <Textarea
                                    placeholder="Nội dung khoản thu/chi"
                                    rows={3}
                                    value={form.content}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            content: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <SheetFooter className="sm:flex-col">
                        <Button
                            className="w-full"
                            loading={saving}
                            onClick={handleSave}
                        >
                            Lưu giao dịch
                        </Button>
                        {editingId && (
                            <>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    loading={cancelling}
                                    onClick={handleCancelTransaction}
                                >
                                    Hủy giao dịch
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                    loading={deleting}
                                    onClick={handleDeleteTransaction}
                                >
                                    Xóa vĩnh viễn (Admin)
                                </Button>
                            </>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!confirm}
                onOpenChange={open => !open && setConfirm(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirm?.title}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        {confirm?.description}
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirm(null)}
                        >
                            Đóng
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => confirm?.onConfirm()}
                        >
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinanceListPage;
