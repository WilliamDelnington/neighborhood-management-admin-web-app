import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Clock3,
    Flame,
    Heart,
    Home,
    ListChecks,
    MapPin,
    MessageSquare,
    MessagesSquare,
    RefreshCw,
    ShieldAlert,
    Users,
    Wallet,
    Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@lib/utils";
import AdminGuard from "@components/auth/AdminGuard";
import StatCard from "@components/admin/StatCard";
import GisOverviewMap from "@components/admin/GisOverviewMap";
import ReportBarChart, {
    ReportBarChartSeries,
} from "@components/admin/ReportBarChart";
import ReportDonutChart from "@components/admin/ReportDonutChart";
import ReportLineChart from "@components/admin/ReportLineChart";
import { Badge } from "@components/ui/badge";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { useAuthStore } from "@store/authStore";
import { MODULES } from "@constants/modules";
import {
    REQUEST_PRIORITY_LABEL,
    REQUEST_PRIORITY_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
    ROLE_LABEL,
} from "@constants/domain";
import { DashboardSummary, User } from "@dts";
import { fetchDashboardSummary } from "@service/dashboardApi";

const AUDIENCE_COPY: Record<
    DashboardSummary["audience"],
    { label: string; description: string }
> = {
    system_admin: {
        label: "Quản trị hệ thống",
        description: "Toàn cảnh vận hành và chất lượng dữ liệu",
    },
    ward: {
        label: "Điều hành cấp Phường",
        description: "Tiến độ công việc trong Phường/xã được phân công",
    },
    neighborhood: {
        label: "Điều hành Tổ dân phố",
        description: "Việc cần xử lý và tiến độ trong Tổ dân phố",
    },
    police: {
        label: "An ninh khu vực",
        description: "Ưu tiên an ninh, cư trú và nguy cơ PCCC",
    },
    staff: {
        label: "Công việc được giao",
        description: "Dữ liệu và công việc trong phạm vi phụ trách",
    },
};

const QUICK_MODULE_PRIORITY: Record<DashboardSummary["audience"], string[]> = {
    system_admin: [
        "houses",
        "complaints",
        "requests",
        "inspections",
        "reports",
        "users",
        "neighborhoods",
        "roles",
    ],
    ward: [
        "inspections",
        "requests",
        "correspondences",
        "announcements",
        "reports",
        "houses",
        "residents",
        "meetings",
    ],
    neighborhood: [
        "requests",
        "inspections",
        "complaints",
        "pccc",
        "houses",
        "residents",
        "correspondences",
        "periodic-reports",
    ],
    police: [
        "security",
        "residents",
        "pccc",
        "complaints",
        "requests",
        "reports",
        "houses",
    ],
    staff: ["requests", "houses", "reports"],
};

const CHART_PRIORITY: Record<DashboardSummary["audience"], string[]> = {
    system_admin: [
        "inspections",
        "complaints",
        "requests",
        "risks",
        "finance",
        "population",
    ],
    ward: [
        "inspections",
        "requests",
        "complaints",
        "population",
        "risks",
        "finance",
    ],
    neighborhood: [
        "inspections",
        "requests",
        "complaints",
        "risks",
        "population",
    ],
    police: ["risks", "complaints", "requests", "population"],
    staff: ["requests", "population", "complaints", "inspections"],
};

const inferDashboardAudience = (
    user?: User,
): DashboardSummary["audience"] => {
    const roles = user?.roles || [];
    if (roles.includes("admin")) return "system_admin";
    if (
        roles.includes("secretary") ||
        roles.includes("people_committee_official")
    ) {
        return "ward";
    }
    if (
        roles.includes("neighborhood_leader") ||
        roles.includes("neighborhood_coleader")
    ) {
        return "neighborhood";
    }
    if (roles.includes("regional_police")) return "police";
    return "staff";
};

/**
 * Giu frontend tuong thich trong luc deploy rolling: file JS moi co the duoc
 * phuc vu truoc khi process backend moi khoi dong xong. Payload dashboard cu
 * khong co audience/capabilities/attention/charts, nen can bo sung gia tri an
 * toan tu permission cua phien dang nhap thay vi de trang bi crash.
 */
const normalizeDashboardSummary = (
    raw: DashboardSummary,
    user?: User,
): DashboardSummary => {
    const payload = raw as Partial<DashboardSummary>;
    const permissionSet = new Set(user?.permissions || []);
    const fallbackCapabilities: DashboardSummary["capabilities"] = {
        population:
            permissionSet.has("houses.read") ||
            permissionSet.has("households.read") ||
            permissionSet.has("citizens.read"),
        complaints: permissionSet.has("complaints.read"),
        pccc: permissionSet.has("pccc.read"),
        security: permissionSet.has("security.read"),
        requests: permissionSet.has("requests.read"),
        inspections: permissionSet.has("inspections.read"),
        finance: permissionSet.has("finance.read"),
        surveys: permissionSet.has("surveys.read"),
        meetings: permissionSet.has("meetings.read"),
    };
    const audience = payload.audience || inferDashboardAudience(user);

    return {
        ...raw,
        audience,
        scopeLabel:
            payload.scopeLabel ||
            user?.wardName ||
            (payload.scopedToCluster
                ? "Khu vực được phân công"
                : "Toàn hệ thống"),
        generatedAt: payload.generatedAt || new Date().toISOString(),
        capabilities: {
            ...fallbackCapabilities,
            ...(payload.capabilities || {}),
        },
        totalHouseholds: payload.totalHouseholds ?? 0,
        totalHouses: payload.totalHouses ?? 0,
        totalCitizens: payload.totalCitizens ?? 0,
        rentalHouseholds: payload.rentalHouseholds ?? 0,
        householdsNeedingSupport: payload.householdsNeedingSupport ?? 0,
        scopedToCluster: payload.scopedToCluster ?? false,
        newComplaints: payload.newComplaints ?? 0,
        inProgressComplaints: payload.inProgressComplaints ?? 0,
        highRiskPcccCount: payload.highRiskPcccCount ?? 0,
        upcomingMeetings: payload.upcomingMeetings || [],
        financeSummary: payload.financeSummary || {
            monthIncome: 0,
            monthExpense: 0,
            monthNet: 0,
            allTimeNet: 0,
        },
        surveyParticipation: payload.surveyParticipation || {
            openSurveys: 0,
            totalResponses: 0,
        },
        attention: {
            newComplaints: payload.newComplaints ?? 0,
            overdueRequests: 0,
            highRiskPccc: payload.highRiskPcccCount ?? 0,
            urgentSecurity: 0,
            activeInspectionCampaigns: 0,
            overdueInspectionTargets: 0,
            ...(payload.attention || {}),
        },
        charts: {
            populationByArea: [],
            complaintStatus: [],
            requestStatus: [],
            inspectionProgress: [],
            riskByArea: [],
            financeByMonth: [],
            ...(payload.charts || {}),
        },
        taskList: payload.taskList || [],
        myRequests: payload.myRequests || [],
        myRequestCounts: payload.myRequestCounts || {
            inProgress: 0,
            dueSoon: 0,
            overdue: 0,
        },
        myComplaintCounts: payload.myComplaintCounts || {
            inProgress: 0,
            overdue: 0,
        },
    };
};

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    });
};

const formatMoney = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);

type DashboardChartSpec = {
    key: string;
    title: string;
    description: string;
    data: Array<Record<string, unknown>>;
    series: ReportBarChartSeries[];
    orientation?: "categories-y" | "categories-x";
    variant?: "bar" | "donut" | "line";
    link: string;
};

const renderDashboardChart = (chart: DashboardChartSpec) => {
    if (chart.variant === "donut") {
        return (
            <ReportDonutChart
                data={chart.data}
                labelKey="label"
                valueKey={chart.series[0].key}
            />
        );
    }
    if (chart.variant === "line") {
        return (
            <ReportLineChart
                data={chart.data}
                labelKey="label"
                series={chart.series}
            />
        );
    }
    return (
        <ReportBarChart
            data={chart.data}
            labelKey="label"
            series={chart.series}
            orientation={chart.orientation}
        />
    );
};

const DashboardChartCard: React.FC<{
    chart: DashboardChartSpec;
    onOpen: () => void;
}> = ({ chart, onOpen }) => (
    <section className="rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
            <div>
                <h3 className="text-sm font-semibold">{chart.title}</h3>
                <p className="mt-0.5 text-xs text-text_2">
                    {chart.description}
                </p>
            </div>
            <button
                type="button"
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                onClick={onOpen}
            >
                Xem chi tiết
                <ArrowRight className="h-3.5 w-3.5" />
            </button>
        </div>
        {renderDashboardChart(chart)}
    </section>
);

const DashboardPage: React.FC = () => (
    <AdminGuard permissions={["dashboard.read"]}>
        <DashboardContent />
    </AdminGuard>
);

const DashboardContent: React.FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(false);
        fetchDashboardSummary()
            .then(data => setSummary(normalizeDashboardSummary(data, user)))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(load, [load]);

    const quickModules = useMemo(() => {
        if (!summary) return [];
        const priority =
            QUICK_MODULE_PRIORITY[summary.audience] ||
            QUICK_MODULE_PRIORITY.staff;
        return MODULES.filter(
            module =>
                module.key !== "dashboard" &&
                user?.permissions?.includes(module.permission),
        )
            .sort((a, b) => {
                const aIndex = priority.indexOf(a.key);
                const bIndex = priority.indexOf(b.key);
                return (
                    (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) -
                    (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex)
                );
            })
            .slice(0, 8);
    }, [summary, user?.permissions]);

    if (loading) return <LoadingState />;
    if (error || !summary) return <ErrorState onRetry={load} />;

    const audienceCopy = AUDIENCE_COPY[summary.audience];
    const personalRequestTotal =
        summary.myRequestCounts.inProgress +
        summary.myRequestCounts.dueSoon +
        summary.myRequestCounts.overdue;
    const personalComplaintTotal = summary.capabilities.complaints
        ? summary.myComplaintCounts.inProgress +
          summary.myComplaintCounts.overdue
        : 0;
    const hasPersonalWork =
        personalRequestTotal + personalComplaintTotal > 0 ||
        summary.myRequests.length > 0;

    const attentionItems = [
        summary.capabilities.complaints
            ? {
                  key: "complaints",
                  label: "Phản ánh mới cần tiếp nhận",
                  value: summary.attention.newComplaints,
                  link: "/complaints?status=moi_tiep_nhan",
                  icon: MessageSquare,
              }
            : null,
        summary.capabilities.requests
            ? {
                  key: "requests",
                  label: "Yêu cầu công việc quá hạn",
                  value: summary.attention.overdueRequests,
                  link: "/requests",
                  icon: ClipboardList,
              }
            : null,
        summary.capabilities.inspections
            ? {
                  key: "inspections",
                  label: "Nhà quá hạn rà soát",
                  value: summary.attention.overdueInspectionTargets,
                  link: "/inspections",
                  icon: ClipboardCheck,
              }
            : null,
        summary.capabilities.pccc
            ? {
                  key: "pccc",
                  label: "Nguy cơ PCCC mức Đỏ",
                  value: summary.attention.highRiskPccc,
                  link: "/pccc?riskLevel=do",
                  icon: Flame,
              }
            : null,
        summary.capabilities.security
            ? {
                  key: "security",
                  label: "An ninh mức Khẩn cấp",
                  value: summary.attention.urgentSecurity,
                  link: "/security?level=khan_cap",
                  icon: ShieldAlert,
              }
            : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

    // Payload API moi co breakdown day du. Khi frontend duoc deploy truoc
    // backend (rolling deploy), dung KPI cu lam mot dong tong hop de vai tro
    // van co bieu do hop le thay vi mat ca khu "Theo doi dieu hanh".
    let populationChartData = summary.charts.populationByArea;
    if (
        populationChartData.length === 0 &&
        summary.totalHouseholds + summary.totalCitizens > 0
    ) {
        populationChartData = [
            {
                label: summary.scopeLabel,
                households: summary.totalHouseholds,
                citizens: summary.totalCitizens,
            },
        ];
    }
    let complaintChartData = summary.charts.complaintStatus;
    if (complaintChartData.length === 0) {
        complaintChartData = [
            {
                status: "moi_tiep_nhan",
                label: "Mới tiếp nhận",
                count: summary.newComplaints,
            },
            {
                status: "dang_xu_ly",
                label: "Đang xử lý",
                count: summary.inProgressComplaints,
            },
        ].filter(row => row.count > 0);
    }
    const hasAreaRequestBreakdown = summary.charts.requestStatus.length > 0;
    const requestChartData = hasAreaRequestBreakdown
        ? summary.charts.requestStatus
        : [
              {
                  status: "in_progress",
                  label: "Đang xử lý",
                  count: summary.myRequestCounts.inProgress,
              },
              {
                  status: "due_soon",
                  label: "Sắp hết hạn",
                  count: summary.myRequestCounts.dueSoon,
              },
              {
                  status: "overdue",
                  label: "Quá hạn",
                  count: summary.myRequestCounts.overdue,
              },
          ].filter(row => row.count > 0);
    let riskChartData = summary.charts.riskByArea;
    if (
        riskChartData.length === 0 &&
        summary.highRiskPcccCount + summary.householdsNeedingSupport > 0
    ) {
        riskChartData = [
            {
                label: summary.scopeLabel,
                highRiskPccc: summary.highRiskPcccCount,
                urgentSecurity: 0,
                needsSupport: summary.householdsNeedingSupport,
            },
        ];
    }
    let financeChartData = summary.charts.financeByMonth;
    const hasFinanceHistory = financeChartData.some(
        row => row.income > 0 || row.expense > 0,
    );
    if (
        !hasFinanceHistory &&
        summary.financeSummary.monthIncome + summary.financeSummary.monthExpense >
            0
    ) {
        financeChartData = [
            {
                label: "Tháng hiện tại",
                income: summary.financeSummary.monthIncome,
                expense: summary.financeSummary.monthExpense,
            },
        ];
    }

    const riskSeries: ReportBarChartSeries[] = [
        ...(summary.capabilities.pccc
            ? [
                  {
                      key: "highRiskPccc",
                      name: "PCCC mức Đỏ",
                      color: "#dc2626",
                  },
              ]
            : []),
        ...(summary.capabilities.security
            ? [
                  {
                      key: "urgentSecurity",
                      name: "An ninh khẩn cấp",
                      color: "#7c3aed",
                  },
              ]
            : []),
        ...(summary.capabilities.population
            ? [
                  {
                      key: "needsSupport",
                      name: "Hộ cần hỗ trợ",
                      color: "#d97706",
                  },
              ]
            : []),
    ];
    const riskDetailLink =
        summary.audience === "police" || !summary.capabilities.pccc
            ? "/security"
            : "/pccc";

    const chartSpecs: DashboardChartSpec[] = [
        ...(summary.capabilities.inspections &&
        summary.charts.inspectionProgress.length > 0
            ? [
                  {
                      key: "inspections",
                      title: "Tiến độ rà soát – chiến dịch",
                      description:
                          "So sánh tiến độ các chiến dịch đang hoạt động trong phạm vi quản lý.",
                      data: summary.charts.inspectionProgress.map(row => ({
                          ...row,
                      })),
                      series: [
                          {
                              key: "verified",
                              name: "Đã xác minh",
                              color: "#16a34a",
                          },
                          {
                              key: "submitted",
                              name: "Chờ xác minh",
                              color: "#2563eb",
                          },
                          {
                              key: "requiresAction",
                              name: "Cần bổ sung/kiểm tra",
                              color: "#d97706",
                          },
                          {
                              key: "pending",
                              name: "Chưa thực hiện",
                              color: "#94a3b8",
                          },
                      ],
                      link: "/inspections",
                  },
              ]
            : []),
        ...(riskSeries.length > 0 && riskChartData.length > 0
            ? [
                  {
                      key: "risks",
                      title: "Điểm cần chú ý theo địa bàn",
                      description:
                          "Chỉ hiển thị khu vực đang có rủi ro hoặc hộ cần hỗ trợ.",
                      data: riskChartData.map(row => ({ ...row })),
                      series: riskSeries,
                      link: riskDetailLink,
                  },
              ]
            : []),
        ...(summary.capabilities.requests &&
        requestChartData.length > 0
            ? [
                  {
                      key: "requests",
                      title: hasAreaRequestBreakdown
                          ? "Yêu cầu công việc theo trạng thái"
                          : "Công việc của tôi theo trạng thái",
                      description: hasAreaRequestBreakdown
                          ? "Số lượt giao việc trong phạm vi Phường/Tổ đang phụ trách."
                          : "Các yêu cầu cá nhân đang xử lý, sắp hết hạn hoặc quá hạn.",
                      data: requestChartData.map(row => ({ ...row })),
                      series: [
                          {
                              key: "count",
                              name: "Lượt giao việc",
                              color: "#2563eb",
                          },
                      ],
                      variant: "donut" as const,
                      link: "/requests",
                  },
              ]
            : []),
        ...(summary.capabilities.complaints &&
        complaintChartData.length > 0
            ? [
                  {
                      key: "complaints",
                      title: "Phản ánh theo trạng thái",
                      description:
                          "Tình hình tiếp nhận và xử lý phản ánh trong phạm vi quản lý.",
                      data: complaintChartData.map(row => ({ ...row })),
                      series: [
                          {
                              key: "count",
                              name: "Phản ánh",
                              color: "#2563eb",
                          },
                      ],
                      variant: "donut" as const,
                      link: "/complaints",
                  },
              ]
            : []),
        ...(summary.capabilities.population &&
        populationChartData.length > 0
            ? [
                  {
                      key: "population",
                      title: "Hộ dân và nhân khẩu theo địa bàn",
                      description:
                          "Quy mô dân cư đã được khai báo tại từng Tổ/khu vực.",
                      data: populationChartData.map(row => ({
                          ...row,
                      })),
                      series: [
                          {
                              key: "households",
                              name: "Hộ dân",
                              color: "#2563eb",
                          },
                          {
                              key: "citizens",
                              name: "Nhân khẩu",
                              color: "#f97316",
                          },
                      ],
                      link: "/houses",
                  },
              ]
            : []),
        ...(summary.capabilities.finance &&
        financeChartData.some(row => row.income > 0 || row.expense > 0)
            ? [
                  {
                      key: "finance",
                      title: "Thu – Chi 6 tháng gần nhất",
                      description:
                          "Không tính các giao dịch đã hủy; đơn vị hiển thị là đồng.",
                      data: financeChartData.map(row => ({ ...row })),
                      series: [
                          { key: "income", name: "Thu", color: "#16a34a" },
                          { key: "expense", name: "Chi", color: "#f97316" },
                      ],
                      variant: "line" as const,
                      link: "/finance",
                  },
              ]
            : []),
    ];
    const chartPriority = CHART_PRIORITY[summary.audience] || CHART_PRIORITY.staff;
    chartSpecs.sort(
        (a, b) => chartPriority.indexOf(a.key) - chartPriority.indexOf(b.key),
    );
    const hasChartCapability =
        summary.capabilities.inspections ||
        summary.capabilities.requests ||
        summary.capabilities.complaints ||
        summary.capabilities.population ||
        summary.capabilities.pccc ||
        summary.capabilities.security ||
        summary.capabilities.finance;
    const primaryCharts = chartSpecs.filter(chart => chart.variant !== "donut");
    const donutCharts = chartSpecs.filter(chart => chart.variant === "donut");

    return (
        <div className="space-y-5">
            <header className="relative overflow-hidden rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold text-text_1">
                                Xin chào, {user?.displayName}
                            </h1>
                            <Badge tone="blue">{audienceCopy.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-text_2">
                            {audienceCopy.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text_2">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                Phạm vi: {summary.scopeLabel}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                Cập nhật {formatDateTime(summary.generatedAt)}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-lg border border-divider_01 bg-ui_bg px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-ng_10"
                        onClick={load}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Làm mới
                    </button>
                </div>
            </header>

            {attentionItems.length > 0 && (
                <section>
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text_1">
                            <AlertTriangle className="h-4 w-4 text-danger" />
                            Cần xử lý ngay
                        </h2>
                        {attentionItems.every(item => item.value === 0) && (
                            <span className="flex items-center gap-1 text-xs font-medium text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                Không có việc tồn khẩn cấp
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {attentionItems.map(item => (
                            <StatCard
                                key={item.key}
                                label={item.label}
                                value={item.value}
                                icon={item.icon}
                                tone={item.value > 0 ? "danger" : "success"}
                                onClick={() => navigate(item.link)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {hasChartCapability && (
                <section>
                    <div className="mb-2">
                        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text_1">
                            <BarChart3 className="h-4 w-4 text-main" />
                            Theo dõi điều hành
                        </h2>
                        <p className="mt-0.5 text-xs text-text_2">
                            Biểu đồ được chọn theo vai trò và phạm vi dữ liệu
                            được phân công.
                        </p>
                    </div>
                    {chartSpecs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            {primaryCharts.length > 0 && (
                                <div className="flex flex-col gap-4 xl:col-span-2">
                                    {primaryCharts.map(chart => (
                                        <DashboardChartCard
                                            key={chart.key}
                                            chart={chart}
                                            onOpen={() => navigate(chart.link)}
                                        />
                                    ))}
                                </div>
                            )}
                            {donutCharts.length > 0 && (
                                <div
                                    className={cn(
                                        "flex flex-col gap-4",
                                        primaryCharts.length > 0
                                            ? "xl:col-span-1"
                                            : "xl:col-span-3 sm:grid sm:grid-cols-2 xl:grid-cols-3",
                                    )}
                                >
                                    {donutCharts.map(chart => (
                                        <DashboardChartCard
                                            key={chart.key}
                                            chart={chart}
                                            onOpen={() => navigate(chart.link)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-divider_01 bg-ui_bg px-4 py-8 text-center text-sm text-text_2">
                            Chưa có dữ liệu đủ để vẽ biểu đồ trong phạm vi này.
                        </div>
                    )}
                </section>
            )}

            {summary.capabilities.population && (
                <section>
                    <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text_1">
                        <Home className="h-4 w-4 text-main" />
                        Quy mô địa bàn
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            label="Hộ dân"
                            value={summary.totalHouseholds}
                            icon={Home}
                            onClick={() => navigate("/houses")}
                        />
                        <StatCard
                            label="Nhà số"
                            value={summary.totalHouses}
                            icon={Building2}
                            onClick={() => navigate("/houses")}
                        />
                        <StatCard
                            label="Nhân khẩu"
                            value={summary.totalCitizens}
                            icon={Users}
                            onClick={() => navigate("/residents")}
                        />
                        <StatCard
                            label="Hộ thuê nhà"
                            value={summary.rentalHouseholds}
                            icon={ClipboardList}
                        />
                        <StatCard
                            label="Hộ cần hỗ trợ"
                            value={summary.householdsNeedingSupport}
                            icon={Heart}
                            tone={
                                summary.householdsNeedingSupport > 0
                                    ? "warning"
                                    : "default"
                            }
                        />
                    </div>
                </section>
            )}

            {(summary.capabilities.inspections ||
                summary.capabilities.surveys ||
                summary.capabilities.finance) && (
                <section>
                    <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text_1">
                        <Activity className="h-4 w-4 text-main" />
                        Nhịp hoạt động
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {summary.capabilities.inspections && (
                            <StatCard
                                label="Chiến dịch đang triển khai"
                                value={
                                    summary.attention.activeInspectionCampaigns
                                }
                                icon={ClipboardCheck}
                                onClick={() => navigate("/inspections")}
                            />
                        )}
                        {summary.capabilities.surveys && (
                            <>
                                <StatCard
                                    label="Khảo sát đang mở"
                                    value={
                                        summary.surveyParticipation.openSurveys
                                    }
                                    icon={ListChecks}
                                    onClick={() => navigate("/surveys")}
                                />
                                <StatCard
                                    label="Lượt phản hồi khảo sát đang mở"
                                    value={
                                        summary.surveyParticipation.totalResponses
                                    }
                                    icon={MessagesSquare}
                                    onClick={() => navigate("/surveys")}
                                />
                            </>
                        )}
                        {summary.capabilities.finance && (
                            <StatCard
                                label="Chênh lệch Thu – Chi tháng"
                                value={formatMoney(
                                    summary.financeSummary.monthNet,
                                )}
                                icon={Wallet}
                                tone={
                                    summary.financeSummary.monthNet >= 0
                                        ? "success"
                                        : "danger"
                                }
                                onClick={() => navigate("/finance")}
                            />
                        )}
                    </div>
                </section>
            )}

            {hasPersonalWork && (
                <section>
                    <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text_1">
                        <ClipboardList className="h-4 w-4 text-main" />
                        Việc của tôi
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            label="Yêu cầu đang xử lý"
                            value={summary.myRequestCounts.inProgress}
                            icon={ClipboardList}
                            onClick={() => navigate("/requests/my")}
                        />
                        <StatCard
                            label="Yêu cầu sắp hết hạn"
                            value={summary.myRequestCounts.dueSoon}
                            icon={CalendarClock}
                            tone="warning"
                            onClick={() => navigate("/requests/my")}
                        />
                        <StatCard
                            label="Yêu cầu quá hạn"
                            value={summary.myRequestCounts.overdue}
                            icon={AlertTriangle}
                            tone="danger"
                            onClick={() => navigate("/requests/my")}
                        />
                        {summary.capabilities.complaints && (
                            <>
                                <StatCard
                                    label="Phản ánh tôi đang xử lý"
                                    value={
                                        summary.myComplaintCounts.inProgress
                                    }
                                    icon={MessageSquare}
                                    onClick={() => navigate("/complaints")}
                                />
                                <StatCard
                                    label="Phản ánh của tôi quá hạn"
                                    value={summary.myComplaintCounts.overdue}
                                    icon={AlertTriangle}
                                    tone="danger"
                                    onClick={() => navigate("/complaints")}
                                />
                            </>
                        )}
                    </div>
                </section>
            )}

            {/* Tạm ẩn Bản đồ tọa độ Nhà số
            {summary.capabilities.population &&
                ["system_admin", "ward", "neighborhood", "police"].includes(
                    summary.audience,
                ) && (
                    <GisOverviewMap
                        data={summary.gisOverview}
                        onOpenHouse={houseId => navigate(`/houses/${houseId}`)}
                    />
                )}
            */}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {summary.myRequests.length > 0 && (
                    <section className="rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text_1">
                                <CalendarClock className="h-4 w-4 text-main" />
                                Yêu cầu gần hạn cần xử lý
                            </h2>
                            <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => navigate("/requests/my")}
                            >
                                Xem tất cả
                            </button>
                        </div>
                        {summary.myRequests.map(request => (
                            <button
                                key={request._id}
                                type="button"
                                className="flex w-full items-center justify-between gap-2 rounded-lg border-b border-divider_01 px-2 py-2 text-left transition last:border-0 hover:bg-ng_10"
                                onClick={() => navigate("/requests/my")}
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                        {request.title}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {REQUEST_TYPE_LABEL[request.type] || request.type}
                                        {request.dueDate &&
                                            ` · Hạn: ${formatDateTime(
                                                request.dueDate,
                                            )}`}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <Badge
                                        tone={
                                            REQUEST_PRIORITY_TONE[
                                                request.priority
                                            ]
                                        }
                                    >
                                        {
                                            REQUEST_PRIORITY_LABEL[
                                                request.priority
                                            ]
                                        }
                                    </Badge>
                                    <Badge
                                        tone={
                                            request.isOverdue
                                                ? "red"
                                                : REQUEST_STATUS_TONE[
                                                      request.status
                                                  ]
                                        }
                                    >
                                        {REQUEST_STATUS_LABEL[request.status]}
                                    </Badge>
                                </div>
                            </button>
                        ))}
                    </section>
                )}

                {summary.upcomingMeetings.length > 0 && (
                    <section className="rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text_1">
                                <CalendarClock className="h-4 w-4 text-main" />
                                Cuộc họp sắp tới
                            </h2>
                            <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => navigate("/meetings")}
                            >
                                Xem lịch họp
                            </button>
                        </div>
                        {summary.upcomingMeetings.map(meeting => (
                            <button
                                key={meeting.id}
                                type="button"
                                className="block w-full rounded-lg border-b border-divider_01 px-2 py-2 text-left transition last:border-0 hover:bg-ng_10"
                                onClick={() =>
                                    navigate(`/meetings/${meeting.id}/edit`)
                                }
                            >
                                <div className="text-sm font-medium">
                                    {meeting.title}
                                </div>
                                <div className="text-xs text-text_2">
                                    {formatDateTime(meeting.startTime)} ·{" "}
                                    {meeting.location}
                                </div>
                            </button>
                        ))}
                    </section>
                )}
            </div>

            {quickModules.length > 0 && (
                <section>
                    <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text_1">
                        <Zap className="h-4 w-4 text-main" />
                        Truy cập nhanh
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {quickModules.map(module => (
                            <button
                                key={module.key}
                                type="button"
                                className="flex items-center gap-3 rounded-lg border border-divider_01 bg-ui_bg p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                onClick={() => navigate(module.path)}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue_10">
                                    <module.icon className="h-4 w-4 text-main" />
                                </span>
                                <span className="truncate text-sm font-medium text-text_1">
                                    {module.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <p className="text-right text-xs text-text_2">
                {user ? ROLE_LABEL[user.primaryRole] : ""} · Dữ liệu được giới
                hạn theo quyền và phạm vi được phân công
            </p>
        </div>
    );
};

export default DashboardPage;
