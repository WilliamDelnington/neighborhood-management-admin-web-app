import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import PageHeader from "@components/admin/PageHeader";
import ReportBarChart, {
    ReportBarChartSeries,
} from "@components/admin/ReportBarChart";
import { usePermission } from "@store/authStore";
import {
    fetchPopulationReport,
    fetchComplaintReport,
    fetchPcccReport,
    fetchSecurityReport,
    fetchFinanceReport,
    fetchHouseReport,
    fetchBusinessReport,
    fetchHouseholdReport,
    fetchRequestReport,
    downloadReportExcel,
    downloadReportPdf,
} from "@service/reportApi";

/**
 * Bao cao theo cuoc hop / khao sat can id cu the (fetchMeetingReport, fetchSurveyReport)
 * nen khong dua vao danh sach tab tong quat nay - se duoc truy cap tu man hinh chi tiet
 * cuoc hop/khao sat tuong ung trong tuong lai.
 */
type ReportTabKey =
    | "population"
    | "complaints"
    | "pccc"
    | "security"
    | "finance"
    | "houses"
    | "business"
    | "households"
    | "requests";

type ReportTab = {
    key: ReportTabKey;
    label: string;
    fetch: (fromDate?: string, toDate?: string) => Promise<unknown>;
    excelFileName: string;
};

type RangeMode = "all" | "range" | "month" | "year";

// Nhan tieng Viet cho tung truong trong du lieu bao cao (xem cac kieu
// PopulationReport/ComplaintReport/PcccReport/SecurityReport/FinanceReport
// trong reportService.ts) - de man hinh bao cao khong hien lai ten truong
// tieng Anh/camelCase tho nhu "Total Households Checked".
const KEY_LABEL: Record<string, string> = {
    totalHouseholds: "Tổng số hộ",
    totalCitizens: "Tổng số nhân khẩu",
    byCluster: "Theo cụm dân cư",
    householdCount: "Số hộ",
    citizenCount: "Số nhân khẩu",
    byResidenceType: "Theo loại cư trú",
    residenceType: "Loại cư trú",
    elderlyCount: "Số người cao tuổi",
    childCount: "Số trẻ em",
    disabledOrSupportNeededCount: "Số người khuyết tật/cần hỗ trợ",
    partyMemberCount: "Số đảng viên",
    unionMemberCount: "Số đoàn viên/hội viên",
    byCategory: "Theo nhóm",
    category: "Nhóm",
    byStatus: "Theo trạng thái",
    status: "Trạng thái",
    averageResolutionDays: "Thời gian xử lý trung bình (ngày)",
    resolvedWithDurationCount: "Số phản ánh đã tính thời gian xử lý",
    escalatedToCommitteeCount: "Số phản ánh đã chuyển UBND phường",
    totalHousesChecked: "Tổng số nhà đã kiểm tra",
    byRiskLevel: "Theo mức nguy cơ",
    riskLevel: "Mức nguy cơ",
    housesNeedingRemediation: "Nhà cần khắc phục",
    code: "Mã nhà",
    cluster: "Cụm dân cư",
    address: "Địa chỉ",
    remediationNeeded: "Việc cần khắc phục",
    byLevel: "Theo mức độ",
    level: "Mức độ",
    byMonitoringStatus: "Theo tình trạng theo dõi",
    rentalHouseholdsCount: "Tổng số hộ cho thuê",
    rentalMissingDeclarationCount: "Số hộ cho thuê chưa khai báo tạm trú",
    reportedToPoliceCount: "Số vụ đã báo công an khu vực",
    totalIncome: "Tổng thu",
    totalExpense: "Tổng chi",
    net: "Chênh lệch thu chi",
    byMonth: "Theo tháng",
    year: "Năm",
    month: "Tháng",
    income: "Thu",
    expense: "Chi",
    count: "Số lượng",
    total: "Tổng số",
    totalCompanies: "Tổng số công ty",
    totalMembers: "Tổng số thành viên hộ",
    averageMembers: "Số thành viên trung bình/hộ",
    needsSupportCount: "Số hộ cần hỗ trợ",
    linkedToHouseCount: "Số hộ đã gắn Nhà số",
    withoutHouseCount: "Số hộ chưa gắn Nhà số",
    byOwnershipType: "Theo hình thức sở hữu",
    ownershipType: "Hình thức sở hữu",
    totalRequests: "Tổng số yêu cầu",
    totalRecipientAssignments: "Tổng lượt giao việc",
    resolvedAssignments: "Lượt đã hoàn thành",
    overdueAssignments: "Lượt quá hạn",
    requestsWithoutRecipients: "Yêu cầu chưa có người nhận",
    byType: "Theo loại yêu cầu",
    type: "Loại yêu cầu",
    byPriority: "Theo mức ưu tiên",
    priority: "Mức ưu tiên",
    byUsageType: "Theo mục đích sử dụng",
    usageType: "Mục đích sử dụng",
    byBusinessType: "Theo loại hình kinh doanh",
    businessType: "Loại hình kinh doanh",
};

// Mau accent dung chung cho bieu do (da kiem tra an toan cho nguoi mu mau -
// xem dataviz skill/scripts/validate_palette.js): xanh duong cho chuoi so
// lieu duy nhat, xanh duong + cam cho bieu do so sanh 2 chuoi.
const CHART_COLOR_1 = "#2a78d6";
const CHART_COLOR_2 = "#eb6834";

type ChartSpec = {
    dataKey: string;
    title: string;
    labelKey: string;
    series: ReportBarChartSeries[];
    orientation?: "categories-y" | "categories-x";
    // Chuan hoa du lieu tho truoc khi ve (vd ghep year+month thanh 1 nhan
    // hien thi cho bieu do Thu - Chi theo thang).
    transform?: (item: Record<string, unknown>) => Record<string, unknown>;
};

// Chi khai bao bieu do cho cac muc phan loai (theo trang thai/cum/loai hinh...)
// da co san trong du lieu bao cao - khong doi cau truc du lieu backend, chi
// "diem mat" nhung mang phu hop de ve them bieu do ben canh bang so lieu hien
// co (renderValue ben duoi).
const CHART_SPECS: Partial<Record<ReportTabKey, ChartSpec[]>> = {
    households: [
        {
            dataKey: "byStatus",
            title: "Hộ dân theo trạng thái",
            labelKey: "label",
            series: [{ key: "count", name: "Số hộ", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byOwnershipType",
            title: "Hộ dân theo hình thức sở hữu",
            labelKey: "label",
            series: [{ key: "count", name: "Số hộ", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byCluster",
            title: "Hộ dân theo cụm dân cư",
            labelKey: "cluster",
            series: [{ key: "count", name: "Số hộ", color: CHART_COLOR_1 }],
        },
    ],
    requests: [
        {
            dataKey: "byType",
            title: "Yêu cầu theo loại",
            labelKey: "label",
            series: [{ key: "count", name: "Số yêu cầu", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byPriority",
            title: "Yêu cầu theo mức ưu tiên",
            labelKey: "label",
            series: [{ key: "count", name: "Số yêu cầu", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byStatus",
            title: "Lượt giao việc theo trạng thái",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượt", color: CHART_COLOR_1 }],
        },
    ],
    population: [
        {
            dataKey: "byCluster",
            title: "Hộ dân & nhân khẩu theo cụm dân cư",
            labelKey: "cluster",
            series: [
                { key: "householdCount", name: "Số hộ", color: CHART_COLOR_1 },
                { key: "citizenCount", name: "Số nhân khẩu", color: CHART_COLOR_2 },
            ],
        },
        {
            dataKey: "byResidenceType",
            title: "Theo loại cư trú",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
    ],
    complaints: [
        {
            dataKey: "byCategory",
            title: "Theo nhóm phản ánh",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byStatus",
            title: "Theo trạng thái",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
    ],
    pccc: [
        {
            dataKey: "byRiskLevel",
            title: "Theo mức nguy cơ",
            labelKey: "label",
            series: [{ key: "count", name: "Số nhà", color: CHART_COLOR_1 }],
        },
    ],
    security: [
        {
            dataKey: "byLevel",
            title: "Theo mức độ",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byMonitoringStatus",
            title: "Theo tình trạng theo dõi",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
    ],
    houses: [
        {
            dataKey: "byStatus",
            title: "Theo trạng thái",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byUsageType",
            title: "Theo mục đích sử dụng",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byCluster",
            title: "Theo cụm dân cư",
            labelKey: "cluster",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
    ],
    business: [
        {
            dataKey: "byStatus",
            title: "Theo trạng thái",
            labelKey: "label",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byBusinessType",
            title: "Theo loại hình kinh doanh",
            labelKey: "businessType",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
        {
            dataKey: "byCluster",
            title: "Theo cụm dân cư",
            labelKey: "cluster",
            series: [{ key: "count", name: "Số lượng", color: CHART_COLOR_1 }],
        },
    ],
    finance: [
        {
            dataKey: "byMonth",
            title: "Thu - Chi theo tháng",
            labelKey: "monthLabel",
            orientation: "categories-x",
            series: [
                { key: "income", name: "Thu", color: CHART_COLOR_1 },
                { key: "expense", name: "Chi", color: CHART_COLOR_2 },
            ],
            transform: item => ({
                ...item,
                monthLabel: `${item.month}/${item.year}`,
            }),
        },
    ],
};

// Truong ID ky thuat khong can hien thi cho nguoi dung (da co "code" lam ma
// hien thi thay the).
const HIDDEN_KEYS = new Set(["houseId"]);

const humanizeKey = (key: string) =>
    KEY_LABEL[key] ??
    key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/^./, c => c.toUpperCase());

const renderValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
        return <span className="text-xs text-text_2">—</span>;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <span className="text-xs text-text_2">Không có dữ liệu</span>;
        }
        return (
            <div className="border-l border-divider_01 pl-2">
                {value.map(item => (
                    <div
                        key={typeof item === "object" ? JSON.stringify(item) : String(item)}
                        className="mb-2 border-b border-divider_01 pb-2 last:mb-0 last:border-0 last:pb-0"
                    >
                        {renderValue(item)}
                    </div>
                ))}
            </div>
        );
    }

    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;

        // Cac muc phan loai (theo nhom/trang thai/muc nguy co...) deu co dang
        // { <ma>, label, count } - "label" da la ban dich tieng Viet cua ma
        // phan loai, nen chi can hien mot dong gon "Nhan — So luong" thay vi
        // liet ke tung truong (ma tho, label, count) rieng le.
        if ("label" in obj && "count" in obj) {
            return (
                <div className="flex items-center justify-between border-b border-divider_01 py-1 last:border-0">
                    <span className="text-sm">{String(obj.label)}</span>
                    <span className="text-sm font-medium">
                        {String(obj.count)}
                    </span>
                </div>
            );
        }

        return (
            <div className="w-full">
                {Object.entries(obj).map(([k, v]) => {
                    if (HIDDEN_KEYS.has(k)) return null;
                    return (
                        <div
                            key={k}
                            className="flex items-start justify-between gap-2 border-b border-divider_01 py-1 last:border-0"
                        >
                            <span className="shrink-0 text-xs text-text_2">
                                {humanizeKey(k)}
                            </span>
                            <div className="flex-1 text-right">
                                {typeof v === "object" && v !== null ? (
                                    renderValue(v)
                                ) : (
                                    <span className="text-sm">{String(v)}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return <span className="text-sm">{String(value)}</span>;
};

const ReportsPage: React.FC = () => (
    <AdminGuard permissions={["reports.read", "finance.read"]}>
        <ReportsContent />
    </AdminGuard>
);

const ReportsContent: React.FC = () => {
    // Tat ca cac loai bao cao (tru tai chinh) chi duoc gate boi mot quyen
    // chung "reports.read" o backend (xem cac route trong api/reports/**) -
    // truoc day danh sach tab lai loc theo TEN VAI TRO cu the (admin/to
    // truong/canh sat khu vuc), nen mot vai tro khac (vd bi thu) du duoc admin
    // cap them "reports.read" qua man Vai tro van khong thay tab nao. Doi sang
    // loc theo quyen (usePermission) de nhat quan voi cach backend gate.
    const canReadReports = usePermission("reports.read");
    const canReadFinance = usePermission("finance.read");
    const canExport = usePermission("reports.export");

    const tabs: ReportTab[] = [
        ...(canReadReports
            ? [
                  {
                      key: "population" as ReportTabKey,
                      label: "Dân cư",
                      fetch: fetchPopulationReport,
                      excelFileName: "bao-cao-dan-cu.xlsx",
                  },
                  {
                      key: "households" as ReportTabKey,
                      label: "Hộ dân",
                      fetch: fetchHouseholdReport,
                      excelFileName: "bao-cao-ho-dan.xlsx",
                  },
                  {
                      key: "complaints" as ReportTabKey,
                      label: "Phản ánh",
                      fetch: fetchComplaintReport,
                      excelFileName: "bao-cao-phan-anh.xlsx",
                  },
                  {
                      key: "requests" as ReportTabKey,
                      label: "Yêu cầu công việc",
                      fetch: fetchRequestReport,
                      excelFileName: "bao-cao-yeu-cau-cong-viec.xlsx",
                  },
                  {
                      key: "houses" as ReportTabKey,
                      label: "Nhà số",
                      fetch: fetchHouseReport,
                      excelFileName: "bao-cao-nha-so.xlsx",
                  },
                  {
                      key: "business" as ReportTabKey,
                      label: "Hộ kinh doanh",
                      fetch: fetchBusinessReport,
                      excelFileName: "bao-cao-ho-kinh-doanh.xlsx",
                  },
                  {
                      key: "pccc" as ReportTabKey,
                      label: "PCCC",
                      fetch: fetchPcccReport,
                      excelFileName: "bao-cao-pccc.xlsx",
                  },
                  {
                      key: "security" as ReportTabKey,
                      label: "An ninh & Cư trú",
                      fetch: fetchSecurityReport,
                      excelFileName: "bao-cao-an-ninh.xlsx",
                  },
              ]
            : []),
        ...(canReadFinance
            ? [
                  {
                      key: "finance" as ReportTabKey,
                      label: "Tài chính",
                      fetch: fetchFinanceReport,
                      excelFileName: "bao-cao-tai-chinh.xlsx",
                  },
              ]
            : []),
    ];

    const [activeKey, setActiveKey] = useState<ReportTabKey>("population");
    const [data, setData] = useState<unknown>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [exporting, setExporting] = useState(false);

    // "Tao bao cao" theo khoang thoi gian: loc theo ngay TAO/dien ra cua ban
    // ghi (khong phai trang thai tai mot thoi diem trong qua khu - xem ghi
    // chu ReportDateRangeParams trong reportService.ts). Ap dung chung cho
    // moi loai bao cao, khong luu cache theo tab de tranh hien nham du lieu
    // cua mot khoang thoi gian khac khi chuyen tab.
    const [rangeMode, setRangeMode] = useState<RangeMode>("all");
    const [rangeFrom, setRangeFrom] = useState("");
    const [rangeTo, setRangeTo] = useState("");
    const [rangeMonth, setRangeMonth] = useState("");
    const [rangeYear, setRangeYear] = useState(String(new Date().getFullYear()));

    const activeTab = tabs.find(t => t.key === activeKey) || tabs[0];

    const computeRange = (): { fromDate?: string; toDate?: string } => {
        if (rangeMode === "range") {
            return {
                fromDate: rangeFrom
                    ? new Date(`${rangeFrom}T00:00:00`).toISOString()
                    : undefined,
                toDate: rangeTo
                    ? new Date(`${rangeTo}T23:59:59.999`).toISOString()
                    : undefined,
            };
        }
        if (rangeMode === "month" && rangeMonth) {
            const [y, m] = rangeMonth.split("-").map(Number);
            return {
                fromDate: new Date(y, m - 1, 1, 0, 0, 0).toISOString(),
                toDate: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
            };
        }
        if (rangeMode === "year" && rangeYear) {
            const y = Number(rangeYear);
            return {
                fromDate: new Date(y, 0, 1, 0, 0, 0).toISOString(),
                toDate: new Date(y, 11, 31, 23, 59, 59, 999).toISOString(),
            };
        }
        return {};
    };

    const load = (tab: ReportTab) => {
        setLoading(true);
        setError(false);
        const { fromDate, toDate } = computeRange();
        tab.fetch(fromDate, toDate)
            .then(res => setData(res))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (activeTab) load(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeKey]);

    const handleCreateReport = () => {
        if (activeTab) load(activeTab);
    };

    const renderCharts = (tab: ReportTab) => {
        const specs = CHART_SPECS[tab.key];
        if (!specs || !data || typeof data !== "object") return null;
        const obj = data as Record<string, unknown>;

        const charts = specs
            .map(spec => {
                const raw = obj[spec.dataKey];
                if (!Array.isArray(raw) || raw.length === 0) return null;
                const chartData = spec.transform
                    ? raw.map(spec.transform)
                    : raw;
                return (
                    <div
                        key={spec.dataKey}
                        className="rounded-xl border border-divider_01 p-3"
                    >
                        <h3 className="mb-2 text-sm font-medium text-text_2">
                            {spec.title}
                        </h3>
                        <ReportBarChart
                            data={chartData}
                            labelKey={spec.labelKey}
                            series={spec.series}
                            orientation={spec.orientation}
                        />
                    </div>
                );
            })
            .filter(Boolean);

        if (charts.length === 0) return null;

        return (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {charts}
            </div>
        );
    };

    const handleExport = async (format: "excel" | "pdf") => {
        if (!activeTab) return;
        try {
            setExporting(true);
            const { fromDate, toDate } = computeRange();
            if (format === "excel") {
                await downloadReportExcel(activeTab.key, activeTab.excelFileName, {
                    fromDate,
                    toDate,
                });
            } else {
                await downloadReportPdf(
                    activeTab.key,
                    activeTab.excelFileName.replace(/\.xlsx$/i, ".pdf"),
                    { fromDate, toDate },
                );
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Không thể xuất báo cáo",
            );
        } finally {
            setExporting(false);
        }
    };

    if (!activeTab) {
        return (
            <div>
                <PageHeader title="Báo cáo" description="Xem báo cáo tổng hợp số liệu quản lý theo địa bàn." />
                <EmptyState label="Bạn không có quyền xem báo cáo nào" />
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Báo cáo" description="Xem báo cáo tổng hợp số liệu quản lý theo địa bàn." />

            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                <div>
                    <Label>Khoảng thời gian</Label>
                    <Select
                        value={rangeMode}
                        onValueChange={v => setRangeMode(v as RangeMode)}
                    >
                        <SelectTrigger className="mt-1.5 w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toàn bộ</SelectItem>
                            <SelectItem value="range">Từ - Đến</SelectItem>
                            <SelectItem value="month">Theo tháng</SelectItem>
                            <SelectItem value="year">Theo năm</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {rangeMode === "range" && (
                    <>
                        <div>
                            <Label>Từ ngày</Label>
                            <Input
                                className="mt-1.5"
                                type="date"
                                value={rangeFrom}
                                onChange={e => setRangeFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Đến ngày</Label>
                            <Input
                                className="mt-1.5"
                                type="date"
                                value={rangeTo}
                                onChange={e => setRangeTo(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {rangeMode === "month" && (
                    <div>
                        <Label>Tháng</Label>
                        <Input
                            className="mt-1.5"
                            type="month"
                            value={rangeMonth}
                            onChange={e => setRangeMonth(e.target.value)}
                        />
                    </div>
                )}

                {rangeMode === "year" && (
                    <div>
                        <Label>Năm</Label>
                        <Input
                            className="mt-1.5 w-28"
                            type="number"
                            value={rangeYear}
                            onChange={e => setRangeYear(e.target.value)}
                        />
                    </div>
                )}

                <Button loading={loading} onClick={handleCreateReport}>
                    Tạo báo cáo
                </Button>
            </div>

            <Tabs
                value={activeKey}
                onValueChange={value => setActiveKey(value as ReportTabKey)}
            >
                <TabsList className="h-auto flex-wrap">
                    {tabs.map(tab => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map(tab => (
                    <TabsContent key={tab.key} value={tab.key}>
                        <div className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    {tab.label}
                                </h2>
                                {canExport && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            loading={exporting}
                                            onClick={() => void handleExport("excel")}
                                        >
                                            Xuất Excel
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={exporting}
                                            onClick={() => void handleExport("pdf")}
                                        >
                                            Xuất PDF
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {loading && <LoadingState />}
                            {!loading && error && (
                                <ErrorState onRetry={() => load(tab)} />
                            )}
                            {!loading && !error && !data && (
                                <EmptyState label="Chưa có dữ liệu báo cáo" />
                            )}
                            {!loading && !error && data
                                ? renderCharts(tab)
                                : null}
                            {!loading && !error && data
                                ? renderValue(data)
                                : null}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default ReportsPage;
