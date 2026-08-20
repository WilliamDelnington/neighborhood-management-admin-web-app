import React, { useEffect, useState } from "react";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
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
import { Textarea } from "@components/ui/textarea";
import {
    KpiDataSource,
    KpiDefinition,
    KpiEvaluationItem,
    KpiFormulaType,
    KpiPeriod,
} from "@dts";
import { usePermission } from "@store/authStore";
import {
    archiveKpiDefinition,
    createKpiDefinition,
    downloadKpiExport,
    evaluateKpis,
    fetchKpiDefinitions,
    KpiDefinitionInput,
    updateKpiDefinition,
} from "@service/kpiApi";

const SOURCE_LABEL: Record<KpiDataSource, string> = {
    task_completion: "Nhiệm vụ hoàn thành",
    task_on_time: "Nhiệm vụ đúng hạn",
    feedback_sla: "Phản ánh đạt SLA",
    inspection_completion: "Hoàn thành rà soát",
    house_response: "Nhà số phản hồi",
    notification_read: "Thông báo đã đọc",
};

const PERIOD_LABEL: Record<KpiPeriod, string> = {
    weekly: "Tuần",
    monthly: "Tháng",
    quarterly: "Quý",
    yearly: "Năm",
};

const EMPTY_FORM: KpiDefinitionInput = {
    code: "",
    name: "",
    description: "",
    formulaType: "ratio",
    dataSource: "task_completion",
    targetValue: 90,
    targetDirection: "gte",
    unit: "%",
    period: "monthly",
    active: true,
};

const KpiDashboardPage: React.FC = () => (
    <AdminGuard permissions={["reports.kpi_read"]}>
        <KpiDashboardContent />
    </AdminGuard>
);

const KpiDashboardContent: React.FC = () => {
    const canManage = usePermission("reports.kpi_manage");
    const canExport = usePermission("reports.export");
    const [definitions, setDefinitions] = useState<KpiDefinition[]>([]);
    const [evaluations, setEvaluations] = useState<KpiEvaluationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<KpiDefinition | null>(null);
    const [form, setForm] = useState<KpiDefinitionInput>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);

    const params = () => ({
        fromDate: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
        toDate: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
    });

    const load = () => {
        setLoading(true);
        setError(false);
        Promise.all([fetchKpiDefinitions(), evaluateKpis(params())])
            .then(([definitionResult, evaluationResult]) => {
                setDefinitions(definitionResult.items);
                setEvaluations(evaluationResult.items);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (definition: KpiDefinition) => {
        setEditing(definition);
        setForm({
            code: definition.code,
            name: definition.name,
            description: definition.description || "",
            formulaType: definition.formulaType,
            dataSource: definition.dataSource,
            targetValue: definition.targetValue,
            targetDirection: definition.targetDirection,
            unit: definition.unit,
            period: definition.period,
            active: definition.active,
        });
        setOpen(true);
    };

    const save = async () => {
        if (!form.code.trim() || !form.name.trim()) {
            toast.error("Vui lòng nhập mã và tên KPI");
            return;
        }
        try {
            setSaving(true);
            if (editing) {
                const { code: _code, ...patch } = form;
                await updateKpiDefinition(editing._id, patch);
            } else {
                await createKpiDefinition(form);
            }
            toast.success("Đã lưu định nghĩa KPI");
            setOpen(false);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không thể lưu KPI");
        } finally {
            setSaving(false);
        }
    };

    const archive = async (definition: KpiDefinition) => {
        if (!window.confirm(`Ngừng sử dụng KPI “${definition.name}”?`)) return;
        try {
            await archiveKpiDefinition(definition._id);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không thể ngừng KPI");
        }
    };

    const exportData = async (format: "excel" | "pdf") => {
        try {
            setExporting(true);
            await downloadKpiExport(format, params());
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không thể xuất KPI");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">KPI Phường</h1>
                    <p className="mt-1 text-sm text-text_2">
                        Định nghĩa nằm trong dữ liệu; nguồn tính được backend kiểm soát và giới hạn theo địa bàn.
                    </p>
                </div>
                <div className="flex gap-2">
                    {canExport && (
                        <>
                            <Button variant="outline" loading={exporting} onClick={() => void exportData("excel")}>
                                <Download className="mr-1 h-4 w-4" /> Excel
                            </Button>
                            <Button variant="outline" loading={exporting} onClick={() => void exportData("pdf")}>
                                <Download className="mr-1 h-4 w-4" /> PDF
                            </Button>
                        </>
                    )}
                    {canManage && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" /> Thêm KPI
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow-sm">
                <div><Label>Từ ngày</Label><Input className="mt-1" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} /></div>
                <div><Label>Đến ngày</Label><Input className="mt-1" type="date" value={toDate} onChange={event => setToDate(event.target.value)} /></div>
                <Button variant="secondary" loading={loading} onClick={load}>
                    <RefreshCw className="mr-1 h-4 w-4" /> Tính lại
                </Button>
                <p className="text-xs text-text_2">
                    Để trống ngày: mỗi KPI dùng kỳ hiện tại theo cấu hình tuần/tháng/quý/năm.
                </p>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}
            {!loading && !error && evaluations.length === 0 && <EmptyState label="Chưa có KPI hoạt động" />}
            {!loading && !error && evaluations.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {evaluations.map(item => (
                        <div key={item.definition._id} className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium">{item.definition.name}</p>
                                    <p className="text-xs text-text_2">{item.detail}</p>
                                </div>
                                <Badge tone={item.targetMet === null ? "gray" : item.targetMet ? "green" : "red"}>
                                    {item.targetMet === null ? "Chưa có dữ liệu" : item.targetMet ? "Đạt" : "Chưa đạt"}
                                </Badge>
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-main">
                                {item.value === null ? "—" : item.value.toLocaleString("vi-VN")} {item.definition.unit}
                            </p>
                            <p className="mt-1 text-xs text-text_2">
                                Mục tiêu {item.definition.targetDirection === "gte" ? "≥" : "≤"} {item.definition.targetValue} {item.definition.unit}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-lg border bg-white shadow-sm">
                <Table>
                    <TableHeader><TableRow><TableHead className="w-12 text-center">STT</TableHead><TableHead>Mã</TableHead><TableHead>Tên KPI</TableHead><TableHead>Nguồn</TableHead><TableHead>Kỳ</TableHead><TableHead>Mục tiêu</TableHead><TableHead /></TableRow></TableHeader>
                    <TableBody>
                        {definitions.map((definition, index) => (
                            <TableRow key={definition._id}>
                                <TableCell className="text-center text-text_2">{index + 1}</TableCell>
                                <TableCell className="font-mono text-xs">{definition.code}</TableCell>
                                <TableCell><button className="font-medium text-main hover:underline" onClick={() => canManage && openEdit(definition)}>{definition.name}</button></TableCell>
                                <TableCell>{SOURCE_LABEL[definition.dataSource]}</TableCell>
                                <TableCell>{PERIOD_LABEL[definition.period]}</TableCell>
                                <TableCell>{definition.targetDirection === "gte" ? "≥" : "≤"} {definition.targetValue} {definition.unit}</TableCell>
                                <TableCell className="text-right">{canManage && definition.active && <Button size="icon" variant="ghost" onClick={() => void archive(definition)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent>
                    <SheetHeader><SheetTitle>{editing ? "Sửa KPI" : "Thêm KPI"}</SheetTitle></SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        <div><Label>Mã KPI</Label><Input className="mt-1" disabled={!!editing} value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value.toLowerCase() }))} /></div>
                        <div><Label>Tên KPI</Label><Input className="mt-1" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></div>
                        <div><Label>Mô tả</Label><Textarea className="mt-1" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></div>
                        <div><Label>Nguồn dữ liệu</Label><Select value={form.dataSource} onValueChange={value => setForm(current => ({ ...current, dataSource: value as KpiDataSource }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SOURCE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Công thức</Label><Select value={form.formulaType} onValueChange={value => setForm(current => ({ ...current, formulaType: value as KpiFormulaType }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ratio">Tỷ lệ (%)</SelectItem><SelectItem value="count">Số lượng đạt điều kiện</SelectItem><SelectItem value="average">Trung bình thời gian xử lý nhiệm vụ</SelectItem></SelectContent></Select></div>
                        <div className="grid grid-cols-2 gap-3"><div><Label>Điều kiện</Label><Select value={form.targetDirection} onValueChange={value => setForm(current => ({ ...current, targetDirection: value as "gte" | "lte" }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gte">Lớn hơn hoặc bằng</SelectItem><SelectItem value="lte">Nhỏ hơn hoặc bằng</SelectItem></SelectContent></Select></div><div><Label>Mục tiêu</Label><Input className="mt-1" type="number" value={form.targetValue} onChange={event => setForm(current => ({ ...current, targetValue: Number(event.target.value) }))} /></div></div>
                        <div className="grid grid-cols-2 gap-3"><div><Label>Đơn vị</Label><Input className="mt-1" value={form.unit} onChange={event => setForm(current => ({ ...current, unit: event.target.value }))} /></div><div><Label>Kỳ mặc định</Label><Select value={form.period} onValueChange={value => setForm(current => ({ ...current, period: value as KpiPeriod }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PERIOD_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div>
                    </div>
                    <SheetFooter><Button className="w-full" loading={saving} onClick={() => void save()}>Lưu KPI</Button></SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default KpiDashboardPage;
