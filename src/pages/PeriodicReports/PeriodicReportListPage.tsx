import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
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
import RepresentativeUserPicker from "@components/admin/RepresentativeUserPicker";
import { usePermission, useAuthStore } from "@store/authStore";
import {
    PERIODIC_REPORT_STATUS_LABEL,
    PERIODIC_REPORT_STATUS_TONE,
    PERIODIC_REPORT_TYPE_LABEL,
} from "@constants/domain";
import {
    AppError,
    PERIODIC_REPORT_TYPES,
    PeriodicReport,
    PeriodicReportSections,
    PeriodicReportType,
    User,
} from "@dts";
import {
    createPeriodicReport,
    fetchPeriodicReports,
    requestPeriodicReportRevision,
    submitPeriodicReport,
    updatePeriodicReport,
} from "@service/periodicReportApi";

const displayNameOf = (
    ref: string | { displayName: string } | null | undefined,
): string => (ref && typeof ref !== "string" ? ref.displayName : "—");

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

interface FormState {
    type: PeriodicReportType | "";
    periodStart: string;
    periodEnd: string;
    submittedToUserId: string;
    submittedToLabel: string;
    sections: PeriodicReportSections;
}

const EMPTY_FORM: FormState = {
    type: "",
    periodStart: "",
    periodEnd: "",
    submittedToUserId: "",
    submittedToLabel: "",
    sections: {},
};

const PeriodicReportListPage: React.FC = () => (
    <AdminGuard permissions={["reports.author"]}>
        <PeriodicReportListContent />
    </AdminGuard>
);

const PeriodicReportListContent: React.FC = () => {
    const currentUserId = useAuthStore(state => state.user?.id);
    const canAuthor = usePermission("reports.author");

    const [view, setView] = useState<"mine" | "received">("mine");
    const [items, setItems] = useState<PeriodicReport[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [selected, setSelected] = useState<PeriodicReport | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [revisionNote, setRevisionNote] = useState("");
    const [requestingRevision, setRequestingRevision] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchPeriodicReports({ page: targetPage, view })
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
    }, [view]);

    const isAuthor =
        selected &&
        (typeof selected.authorUserId === "string"
            ? selected.authorUserId
            : selected.authorUserId._id) === currentUserId;
    const isReceiver =
        selected &&
        selected.submittedToUserId &&
        (typeof selected.submittedToUserId === "string"
            ? selected.submittedToUserId
            : selected.submittedToUserId._id) === currentUserId;
    const canEdit =
        !!isAuthor &&
        (selected!.status === "draft" ||
            selected!.status === "revision_requested");

    const openCreate = () => {
        setSelected(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openDetail = (report: PeriodicReport) => {
        setSelected(report);
        setForm({
            type: report.type,
            periodStart: toDateInput(report.periodStart),
            periodEnd: toDateInput(report.periodEnd),
            submittedToUserId:
                report.submittedToUserId && typeof report.submittedToUserId !== "string"
                    ? report.submittedToUserId._id
                    : "",
            submittedToLabel:
                report.submittedToUserId && typeof report.submittedToUserId !== "string"
                    ? report.submittedToUserId.displayName
                    : "",
            sections: report.sections || {},
        });
        setRevisionNote("");
        setSheetOpen(true);
    };

    const handleSaveOrCreate = async () => {
        if (!form.type || !form.periodStart || !form.periodEnd) {
            toast.error("Vui lòng chọn loại báo cáo và khoảng thời gian");
            return;
        }
        try {
            setSubmitting(true);
            const payload = {
                type: form.type,
                periodStart: new Date(form.periodStart).toISOString(),
                periodEnd: new Date(form.periodEnd).toISOString(),
                submittedToUserId: form.submittedToUserId || undefined,
                sections: form.sections,
            };
            if (selected) {
                await updatePeriodicReport(selected._id, payload);
                toast.success("Đã lưu báo cáo");
            } else {
                await createPeriodicReport(payload);
                toast.success("Đã tạo báo cáo (bản nháp)");
            }
            setSheetOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!selected) return;
        try {
            setSubmitting(true);
            await submitPeriodicReport(selected._id);
            toast.success("Đã nộp báo cáo");
            setSheetOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestRevision = async () => {
        if (!selected || !revisionNote.trim()) {
            toast.error("Vui lòng nhập lý do yêu cầu bổ sung");
            return;
        }
        try {
            setRequestingRevision(true);
            await requestPeriodicReportRevision(selected._id, revisionNote.trim());
            toast.success("Đã gửi yêu cầu bổ sung");
            setSheetOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setRequestingRevision(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Báo cáo định kỳ</h1>
                {canAuthor && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Soạn báo cáo
                    </Button>
                )}
            </div>

            <Tabs
                className="mb-4"
                value={view}
                onValueChange={v => setView(v as "mine" | "received")}
            >
                <TabsList>
                    <TabsTrigger value="mine">Của tôi</TabsTrigger>
                    <TabsTrigger value="received">Gửi cho tôi</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có báo cáo nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Loại</TableHead>
                                <TableHead>Kỳ báo cáo</TableHead>
                                <TableHead>
                                    {view === "mine" ? "Gửi đến" : "Tác giả"}
                                </TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(r => (
                                <TableRow
                                    key={r._id}
                                    className="cursor-pointer"
                                    onClick={() => openDetail(r)}
                                >
                                    <TableCell className="font-medium">
                                        {PERIODIC_REPORT_TYPE_LABEL[r.type]}
                                    </TableCell>
                                    <TableCell>
                                        {toDateInput(r.periodStart)} →{" "}
                                        {toDateInput(r.periodEnd)}
                                    </TableCell>
                                    <TableCell>
                                        {view === "mine"
                                            ? displayNameOf(r.submittedToUserId)
                                            : displayNameOf(r.authorUserId)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={PERIODIC_REPORT_STATUS_TONE[r.status]}>
                                            {PERIODIC_REPORT_STATUS_LABEL[r.status]}
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
                            {selected ? "Chi tiết báo cáo" : "Soạn báo cáo mới"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        {selected && (
                            <Badge tone={PERIODIC_REPORT_STATUS_TONE[selected.status]}>
                                {PERIODIC_REPORT_STATUS_LABEL[selected.status]}
                            </Badge>
                        )}
                        {selected?.revisionNote && (
                            <p className="text-sm text-red-500">
                                Lý do yêu cầu bổ sung: {selected.revisionNote}
                            </p>
                        )}

                        <div className="space-y-1.5">
                            <Label>Loại báo cáo</Label>
                            <Select
                                value={form.type}
                                onValueChange={v =>
                                    setForm(prev => ({
                                        ...prev,
                                        type: v as PeriodicReportType,
                                    }))
                                }
                                disabled={!!selected && !canEdit}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIODIC_REPORT_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>
                                            {PERIODIC_REPORT_TYPE_LABEL[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Từ ngày</Label>
                                <Input
                                    type="date"
                                    value={form.periodStart}
                                    disabled={!!selected && !canEdit}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            periodStart: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Đến ngày</Label>
                                <Input
                                    type="date"
                                    value={form.periodEnd}
                                    disabled={!!selected && !canEdit}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            periodEnd: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        {(!selected || canEdit) && (
                            <RepresentativeUserPicker
                                label="Gửi đến"
                                value={form.submittedToUserId}
                                valueLabel={form.submittedToLabel}
                                onChange={(userId, user: User | undefined) =>
                                    setForm(prev => ({
                                        ...prev,
                                        submittedToUserId: userId || "",
                                        submittedToLabel: user?.displayName || "",
                                    }))
                                }
                            />
                        )}
                        {(
                            [
                                ["generalSituation", "Tình hình chung"],
                                ["highlights", "Vấn đề nổi bật"],
                                ["recommendations", "Kiến nghị"],
                                ["proposals", "Đề xuất"],
                            ] as [keyof PeriodicReportSections, string][]
                        ).map(([key, label]) => (
                            <div className="space-y-1.5" key={key}>
                                <Label>{label}</Label>
                                <Textarea
                                    value={form.sections[key] || ""}
                                    disabled={!!selected && !canEdit}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            sections: {
                                                ...prev.sections,
                                                [key]: e.target.value,
                                            },
                                        }))
                                    }
                                />
                            </div>
                        ))}

                        {isReceiver &&
                            (selected!.status === "submitted" ||
                                selected!.status === "resubmitted") && (
                                <div className="space-y-1.5 rounded-lg border border-divider_01 p-3">
                                    <Label>Yêu cầu bổ sung (nếu cần)</Label>
                                    <Textarea
                                        value={revisionNote}
                                        onChange={e =>
                                            setRevisionNote(e.target.value)
                                        }
                                        placeholder="Nêu rõ phần cần bổ sung..."
                                    />
                                    <Button
                                        variant="outline"
                                        loading={requestingRevision}
                                        onClick={handleRequestRevision}
                                    >
                                        Gửi yêu cầu bổ sung
                                    </Button>
                                </div>
                            )}
                    </div>
                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        {(!selected || canEdit) && (
                            <Button
                                loading={submitting}
                                onClick={handleSaveOrCreate}
                            >
                                {selected ? "Lưu" : "Tạo bản nháp"}
                            </Button>
                        )}
                        {canEdit && (
                            <Button
                                variant="outline"
                                loading={submitting}
                                onClick={handleSubmitReport}
                            >
                                {selected!.status === "draft"
                                    ? "Nộp báo cáo"
                                    : "Nộp lại"}
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default PeriodicReportListPage;
