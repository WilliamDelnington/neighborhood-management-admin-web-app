import React, { useEffect, useState } from "react";
import { Download, Paperclip, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { EmptyState, ErrorState, LoadingState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
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
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Textarea } from "@components/ui/textarea";
import { DEFAULT_PAGE_SIZE, resolveAssetUrl } from "@constants/common";
import {
    PERIODIC_REPORT_STATUS_LABEL,
    PERIODIC_REPORT_STATUS_TONE,
    PERIODIC_REPORT_TYPE_LABEL,
} from "@constants/domain";
import {
    AppError,
    PERIODIC_REPORT_TYPES,
    PeriodicReport,
    PeriodicReportAutoSummary,
    PeriodicReportSections,
    PeriodicReportType,
} from "@dts";
import { useAuthStore, usePermission } from "@store/authStore";
import {
    acceptPeriodicReport,
    createPeriodicReport,
    deletePeriodicReportAttachment,
    downloadPeriodicReportPdf,
    fetchPeriodicReportById,
    fetchPeriodicReportContext,
    fetchPeriodicReports,
    PeriodicReportContext,
    receivePeriodicReport,
    recallPeriodicReport,
    refreshPeriodicReportSummary,
    requestPeriodicReportRevision,
    submitPeriodicReport,
    updatePeriodicReport,
    uploadPeriodicReportAttachment,
} from "@service/periodicReportApi";

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");
const refId = (value: string | { _id: string } | null | undefined) =>
    value && typeof value !== "string" ? value._id : value || "";
const refName = (
    value: string | { displayName?: string; name?: string; code?: string } | null | undefined,
) =>
    value && typeof value !== "string"
        ? value.displayName || value.name || value.code || "—"
        : "—";

type FormState = {
    type: PeriodicReportType | "";
    periodStart: string;
    periodEnd: string;
    neighborhoodId: string;
    submittedToUserId: string;
    sections: PeriodicReportSections;
};

const EMPTY_FORM: FormState = {
    type: "",
    periodStart: "",
    periodEnd: "",
    neighborhoodId: "",
    submittedToUserId: "",
    sections: {},
};

const EDITABLE = ["draft", "revision_required", "revision_requested", "recalled"];

const SUMMARY_GROUPS: Array<{
    key: keyof Omit<PeriodicReportAutoSummary, "generatedAt">;
    title: string;
    labels: Record<string, string>;
}> = [
    { key: "tasks", title: "Nhiệm vụ", labels: { received: "Tiếp nhận", completed: "Hoàn thành", overdue: "Quá hạn" } },
    { key: "feedback", title: "Phản ánh", labels: { received: "Tiếp nhận", verified: "Đã xử lý/xác minh", forwarded: "Chuyển Phường", pending: "Đang chờ" } },
    { key: "inspections", title: "Rà soát", labels: { total: "Tổng Nhà", completed: "Đã xác minh", passed: "Đạt", failed: "Chưa đạt", pending: "Chờ xử lý", revisionRequired: "Cần bổ sung", fieldCheckRequired: "Cần kiểm tra thực địa" } },
    { key: "cases", title: "Vụ việc an ninh", labels: { total: "Tổng vụ", open: "Đang xử lý", resolved: "Đã kết thúc" } },
];

const PeriodicReportListPage: React.FC = () => (
    <AdminGuard permissions={["reports.author", "reports.receive", "reports.review"]}>
        <PeriodicReportListContent />
    </AdminGuard>
);

const PeriodicReportListContent: React.FC = () => {
    const currentUserId = useAuthStore(state => state.user?.id);
    const canAuthor = usePermission("reports.author");
    const canReceive = usePermission("reports.receive");
    const canReview = usePermission("reports.review");
    const canExport = usePermission("reports.export");
    const [view, setView] = useState<"mine" | "received">("mine");
    const [items, setItems] = useState<PeriodicReport[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<PeriodicReport | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [context, setContext] = useState<PeriodicReportContext>({ neighborhoods: [], recipients: [] });
    const [saving, setSaving] = useState(false);
    const [revisionNote, setRevisionNote] = useState("");
    const [uploading, setUploading] = useState(false);
    // Bao cao chua duoc tao (chua co id) khong the goi uploadPeriodicReportAttachment
    // ngay - file chon o man soan moi duoc giu tam o day, tai len ngay sau khi
    // createPeriodicReport() thanh cong. Bat buoc phai co it nhat 1 file (khac
    // Correspondence/InfrastructureAsset - tuy chon o hai noi do).
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchPeriodicReports({ page: targetPage, view, limit: size })
            .then(result => {
                setItems(result.items);
                setPage(result.page);
                setTotalPages(result.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => load(1), [view]);

    const loadContext = (neighborhoodId?: string) =>
        fetchPeriodicReportContext(neighborhoodId).then(setContext);

    const openCreate = async () => {
        setSelected(null);
        setForm(EMPTY_FORM);
        setRevisionNote("");
        setPendingFiles([]);
        setOpen(true);
        try {
            const nextContext = await fetchPeriodicReportContext();
            setContext(nextContext);
            if (nextContext.neighborhoods.length === 1) {
                const neighborhoodId = nextContext.neighborhoods[0]._id;
                setForm(current => ({ ...current, neighborhoodId }));
                await loadContext(neighborhoodId);
            }
        } catch {
            toast.error("Không tải được địa bàn lập báo cáo");
        }
    };

    const openDetail = async (row: PeriodicReport) => {
        setOpen(true);
        setSaving(true);
        try {
            const report = await fetchPeriodicReportById(row._id);
            setSelected(report);
            setRevisionNote("");
            setForm({
                type: report.type,
                periodStart: toDateInput(report.periodStart),
                periodEnd: toDateInput(report.periodEnd),
                neighborhoodId: refId(report.neighborhoodId),
                submittedToUserId: refId(report.submittedToUserId),
                sections: report.sections || {},
            });
            if (canAuthor) await loadContext(refId(report.neighborhoodId));
        } catch (err) {
            toast.error((err as AppError).message);
            setOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const isAuthor = selected && refId(selected.authorUserId) === currentUserId;
    const isReceiver = selected && refId(selected.submittedToUserId) === currentUserId;
    const canEdit = Boolean(isAuthor && selected && EDITABLE.includes(selected.status));

    const reloadSelected = async () => {
        if (!selected) return;
        const report = await fetchPeriodicReportById(selected._id);
        setSelected(report);
        load(page);
    };

    const save = async () => {
        if (!form.type || !form.periodStart || !form.periodEnd || !form.neighborhoodId || !form.submittedToUserId) {
            toast.error("Vui lòng nhập kỳ, Tổ dân phố và nơi nhận cấp Phường");
            return;
        }
        if (!selected && pendingFiles.length === 0) {
            toast.error("Vui lòng đính kèm ít nhất một tệp báo cáo");
            return;
        }
        const payload = {
            type: form.type,
            periodStart: new Date(`${form.periodStart}T00:00:00`).toISOString(),
            periodEnd: new Date(`${form.periodEnd}T23:59:59`).toISOString(),
            neighborhoodId: form.neighborhoodId,
            submittedToUserId: form.submittedToUserId,
            sections: form.sections,
        };
        try {
            setSaving(true);
            if (selected) {
                await updatePeriodicReport(selected._id, payload);
            } else {
                const created = await createPeriodicReport(payload);
                let uploadFailures = 0;
                for (const file of pendingFiles) {
                    // eslint-disable-next-line no-await-in-loop
                    await uploadPeriodicReportAttachment(
                        created._id,
                        file,
                    ).catch(() => {
                        uploadFailures += 1;
                    });
                }
                if (uploadFailures > 0) {
                    toast.error(
                        `Đã tạo bản nháp nhưng ${uploadFailures} tệp đính kèm tải lên thất bại - vui lòng thử lại`,
                    );
                    setOpen(false);
                    load(page);
                    return;
                }
            }
            toast.success("Đã lưu bản nháp và tổng hợp số liệu tự động");
            setOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const action = async (operation: () => Promise<unknown>, success: string) => {
        try {
            setSaving(true);
            await operation();
            toast.success(success);
            await reloadSelected();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const upload = async (file?: File) => {
        if (!selected || !file) return;
        try {
            setUploading(true);
            await uploadPeriodicReportAttachment(selected._id, file);
            await reloadSelected();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div><h1 className="text-lg font-semibold">Báo cáo Tổ dân phố</h1><p className="text-sm text-text_2">Số liệu nghiệp vụ được tổng hợp tự động; mỗi lần nộp tạo một phiên bản bất biến.</p></div>
                {canAuthor && <Button onClick={() => void openCreate()}><Plus className="mr-1 h-4 w-4" /> Soạn báo cáo</Button>}
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Tabs value={view} onValueChange={value => setView(value as "mine" | "received")}>
                    <TabsList><TabsTrigger value="mine">Của tôi</TabsTrigger><TabsTrigger value="received">Phường nhận</TabsTrigger></TabsList>
                </Tabs>
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>
            <div className="rounded-lg border bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && <EmptyState label="Chưa có báo cáo" />}
                {!loading && !error && items.length > 0 && (
                    <Table><TableHeader><TableRow><TableHead className="w-12 text-center">STT</TableHead><TableHead>Loại</TableHead><TableHead>Tổ dân phố</TableHead><TableHead>Kỳ</TableHead><TableHead>{view === "mine" ? "Nơi nhận" : "Tác giả"}</TableHead><TableHead>Phiên bản</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
                        <TableBody>{items.map((report, index) => <TableRow key={report._id} className="cursor-pointer" onClick={() => void openDetail(report)}><TableCell className="text-center text-text_2">{(page - 1) * pageSize + index + 1}</TableCell><TableCell className="font-medium">{PERIODIC_REPORT_TYPE_LABEL[report.type]}</TableCell><TableCell>{refName(report.neighborhoodId)}</TableCell><TableCell>{toDateInput(report.periodStart)} → {toDateInput(report.periodEnd)}</TableCell><TableCell>{view === "mine" ? refName(report.submittedToUserId) : refName(report.authorUserId)}</TableCell><TableCell>v{report.currentVersion || 0}</TableCell><TableCell><Badge tone={PERIODIC_REPORT_STATUS_TONE[report.status]}>{PERIODIC_REPORT_STATUS_LABEL[report.status]}</Badge></TableCell><TableCell className="text-right" onClick={e => e.stopPropagation()}><Button size="sm" variant="outline" onClick={() => void openDetail(report)}>Chi tiết</Button></TableCell></TableRow>)}</TableBody>
                    </Table>
                )}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={load} disabled={loading} />

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-3xl">
                    <SheetHeader><SheetTitle>{selected ? `Chi tiết báo cáo v${selected.currentVersion || 0}` : "Soạn báo cáo mới"}</SheetTitle></SheetHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto py-4">
                        {selected && <div className="flex flex-wrap items-center gap-2"><Badge tone={PERIODIC_REPORT_STATUS_TONE[selected.status]}>{PERIODIC_REPORT_STATUS_LABEL[selected.status]}</Badge>{selected.revisionNote && <span className="text-sm text-red-500">Yêu cầu: {selected.revisionNote}</span>}</div>}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div><Label>Loại báo cáo</Label><Select disabled={!!selected && !canEdit} value={form.type} onValueChange={value => setForm(current => ({ ...current, type: value as PeriodicReportType }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Chọn loại" /></SelectTrigger><SelectContent>{PERIODIC_REPORT_TYPES.map(type => <SelectItem key={type} value={type}>{PERIODIC_REPORT_TYPE_LABEL[type]}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Tổ dân phố lập báo cáo</Label><Select disabled={!!selected && !canEdit} value={form.neighborhoodId} onValueChange={value => { setForm(current => ({ ...current, neighborhoodId: value, submittedToUserId: "" })); void loadContext(value); }}><SelectTrigger className="mt-1"><SelectValue placeholder="Chọn Tổ" /></SelectTrigger><SelectContent>{context.neighborhoods.map(item => <SelectItem key={item._id} value={item._id}>{item.code} - {item.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Từ ngày</Label><Input className="mt-1" type="date" disabled={!!selected && !canEdit} value={form.periodStart} onChange={event => setForm(current => ({ ...current, periodStart: event.target.value }))} /></div>
                            <div><Label>Đến ngày</Label><Input className="mt-1" type="date" disabled={!!selected && !canEdit} value={form.periodEnd} onChange={event => setForm(current => ({ ...current, periodEnd: event.target.value }))} /></div>
                        </div>
                        <div><Label>Nơi nhận cấp Phường</Label><Select disabled={!!selected && !canEdit} value={form.submittedToUserId} onValueChange={value => setForm(current => ({ ...current, submittedToUserId: value }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Chọn cán bộ Phường có quyền nhận báo cáo" /></SelectTrigger><SelectContent>{context.recipients.map(item => <SelectItem key={item.id} value={item.id}>{item.displayName}{item.wardName ? ` - ${item.wardName}` : ""}</SelectItem>)}</SelectContent></Select></div>

                        {selected?.autoSummary && <section><div className="mb-2 flex items-center justify-between"><div><h3 className="font-semibold">Số liệu tự tổng hợp</h3><p className="text-xs text-text_2">Được chốt lại khi nộp phiên bản mới.</p></div>{canEdit && <Button size="sm" variant="outline" loading={saving} onClick={() => void action(() => refreshPeriodicReportSummary(selected._id), "Đã cập nhật số liệu")}><RefreshCw className="mr-1 h-4 w-4" /> Làm mới</Button>}</div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{SUMMARY_GROUPS.map(group => { const values = selected.autoSummary[group.key] as Record<string, number>; return <div key={group.key} className="rounded-lg border p-3"><p className="mb-2 font-medium">{group.title}</p><div className="grid grid-cols-2 gap-2">{Object.entries(group.labels).map(([key, label]) => <div key={key}><p className="text-xs text-text_2">{label}</p><p className="text-lg font-semibold text-main">{values[key] || 0}</p></div>)}</div></div>; })}</div></section>}

                        {([['generalSituation', 'Tình hình chung'], ['highlights', 'Vấn đề nổi bật'], ['recommendations', 'Kiến nghị'], ['proposals', 'Đề xuất']] as [keyof PeriodicReportSections, string][]).map(([key, label]) => <div key={key}><Label>{label}</Label><Textarea className="mt-1" disabled={!!selected && !canEdit} value={form.sections[key] || ""} onChange={event => setForm(current => ({ ...current, sections: { ...current.sections, [key]: event.target.value } }))} /></div>)}

                        {selected ? (
                            <section className="rounded-lg border p-3"><div className="mb-2 flex items-center justify-between"><h3 className="font-medium">Tệp đính kèm</h3>{canEdit && <label className="cursor-pointer"><input type="file" className="hidden" disabled={uploading} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /><span className="inline-flex items-center text-sm text-main"><Upload className="mr-1 h-4 w-4" /> {uploading ? "Đang tải..." : "Tải lên"}</span></label>}</div>{!selected.attachments?.length ? <p className="text-sm text-text_2">Chưa có tệp</p> : selected.attachments.map(file => <div key={file._id} className="flex items-center justify-between border-t py-2 text-sm"><a className="flex items-center gap-2 text-main hover:underline" href={resolveAssetUrl(file.url)} target="_blank" rel="noreferrer"><Paperclip className="h-4 w-4" />{file.name}</a>{canEdit && <Button size="icon" variant="ghost" onClick={() => void action(() => deletePeriodicReportAttachment(selected._id, file._id), "Đã xóa tệp")}><Trash2 className="h-4 w-4" /></Button>}</div>)}</section>
                        ) : (
                            <section className="rounded-lg border p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="font-medium">Tệp đính kèm (bắt buộc)</h3>
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={event => {
                                                const file = event.target.files?.[0];
                                                if (file) setPendingFiles(prev => [...prev, file]);
                                                event.target.value = "";
                                            }}
                                        />
                                        <span className="inline-flex items-center text-sm text-main">
                                            <Upload className="mr-1 h-4 w-4" /> Tải lên
                                        </span>
                                    </label>
                                </div>
                                <p className="mb-2 text-xs text-text_2">Tệp chọn ở đây sẽ được tải lên ngay sau khi lưu bản nháp.</p>
                                {pendingFiles.length === 0 ? (
                                    <p className="text-sm text-text_2">Chưa có tệp</p>
                                ) : (
                                    pendingFiles.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between border-t py-2 text-sm">
                                            <span className="flex items-center gap-2"><Paperclip className="h-4 w-4" />{file.name}</span>
                                            <Button size="icon" variant="ghost" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </section>
                        )}

                        {selected?.versions && selected.versions.length > 0 && <section><h3 className="mb-2 font-medium">Lịch sử phiên bản đã nộp</h3>{selected.versions.map(version => <div key={version._id} className="flex items-center justify-between border-b py-2 text-sm"><span>v{version.version} - {new Date(version.submittedAt).toLocaleString("vi-VN")}</span>{canExport && <Button size="sm" variant="outline" onClick={() => void downloadPeriodicReportPdf(selected._id, version.version)}><Download className="mr-1 h-4 w-4" /> PDF</Button>}</div>)}</section>}

                        {isReceiver && canReview && selected && ["submitted", "resubmitted", "received"].includes(selected.status) && <div className="rounded-lg border border-red-200 p-3"><Label>Yêu cầu bổ sung</Label><Textarea className="mt-1" value={revisionNote} onChange={event => setRevisionNote(event.target.value)} placeholder="Nêu rõ nội dung cần bổ sung" /><Button className="mt-2" variant="outline" disabled={!revisionNote.trim()} onClick={() => void action(() => requestPeriodicReportRevision(selected._id, revisionNote.trim()), "Đã yêu cầu bổ sung")}>Gửi yêu cầu bổ sung</Button></div>}
                    </div>
                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        {(!selected || canEdit) && <Button loading={saving} onClick={() => void save()}>{selected ? "Lưu thay đổi" : "Tạo bản nháp"}</Button>}
                        {selected && canEdit && <Button variant="outline" loading={saving} onClick={() => void action(() => submitPeriodicReport(selected._id), "Đã nộp và tạo phiên bản mới")}>Nộp báo cáo lên Phường</Button>}
                        {selected && isAuthor && ["submitted", "resubmitted"].includes(selected.status) && <Button variant="outline" loading={saving} onClick={() => void action(() => recallPeriodicReport(selected._id), "Đã thu hồi báo cáo")}>Thu hồi trước khi Phường tiếp nhận</Button>}
                        {selected && isReceiver && canReceive && ["submitted", "resubmitted"].includes(selected.status) && <Button loading={saving} onClick={() => void action(() => receivePeriodicReport(selected._id), "Đã tiếp nhận báo cáo")}>Xác nhận tiếp nhận</Button>}
                        {selected && isReceiver && canReview && selected.status === "received" && <Button loading={saving} onClick={() => void action(() => acceptPeriodicReport(selected._id), "Đã chấp nhận báo cáo")}>Chấp nhận báo cáo</Button>}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default PeriodicReportListPage;
