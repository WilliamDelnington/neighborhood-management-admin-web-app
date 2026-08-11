import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, MapPin, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import StatCard from "@components/admin/StatCard";
import ReportBarChart, {
    ReportBarChartSeries,
} from "@components/admin/ReportBarChart";
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
import { DashboardSummary } from "@dts";
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
    staff: ["my_requests", "requests", "houses", "reports"],
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
    link: string;
};

const DashboardChartCard: React.FC<{
    chart: DashboardChartSpec;
    onOpen: () => void;
}> = ({ chart, onOpen }) => (
    <section className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
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
        <ReportBarChart
            data={chart.data}
            labelKey="label"
            series={chart.series}
            orientation={chart.orientation}
        />
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

    const load = () => {
        setLoading(true);
        setError(false);
        fetchDashboardSummary()
            .then(setSummary)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const quickModules = useMemo(() => {
        if (!summary) return [];
        const priority = QUICK_MODULE_PRIORITY[summary.audience];
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
              }
            : null,
        summary.capabilities.requests
            ? {
                  key: "requests",
                  label: "Yêu cầu công việc quá hạn",
                  value: summary.attention.overdueRequests,
                  link: "/requests",
              }
            : null,
        summary.capabilities.inspections
            ? {
                  key: "inspections",
                  label: "Nhà quá hạn rà soát",
                  value: summary.attention.overdueInspectionTargets,
                  link: "/inspections",
              }
            : null,
        summary.capabilities.pccc
            ? {
                  key: "pccc",
                  label: "Nguy cơ PCCC mức Đỏ",
                  value: summary.attention.highRiskPccc,
                  link: "/pccc?riskLevel=do",
              }
            : null,
        summary.capabilities.security
            ? {
                  key: "security",
                  label: "An ninh mức Khẩn cấp",
                  value: summary.attention.urgentSecurity,
                  link: "/security?level=khan_cap",
              }
            : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

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
        summary.charts.inspectionProgress.some(
            row =>
                row.verified +
                    row.submitted +
                    row.requiresAction +
                    row.pending >
                0,
        )
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
        ...(riskSeries.length > 0 && summary.charts.riskByArea.length > 0
            ? [
                  {
                      key: "risks",
                      title: "Điểm cần chú ý theo địa bàn",
                      description:
                          "Chỉ hiển thị khu vực đang có rủi ro hoặc hộ cần hỗ trợ.",
                      data: summary.charts.riskByArea.map(row => ({ ...row })),
                      series: riskSeries,
                      link: riskDetailLink,
                  },
              ]
            : []),
        ...(summary.capabilities.requests &&
        summary.charts.requestStatus.some(row => row.count > 0)
            ? [
                  {
                      key: "requests",
                      title: "Yêu cầu công việc theo trạng thái",
                      description:
                          "Số lượt giao việc trong phạm vi Phường/Tổ đang phụ trách.",
                      data: summary.charts.requestStatus.map(row => ({ ...row })),
                      series: [
                          {
                              key: "count",
                              name: "Lượt giao việc",
                              color: "#2563eb",
                          },
                      ],
                      link: "/requests",
                  },
              ]
            : []),
        ...(summary.capabilities.complaints &&
        summary.charts.complaintStatus.some(row => row.count > 0)
            ? [
                  {
                      key: "complaints",
                      title: "Phản ánh theo trạng thái",
                      description:
                          "Tình hình tiếp nhận và xử lý phản ánh trong phạm vi quản lý.",
                      data: summary.charts.complaintStatus.map(row => ({ ...row })),
                      series: [
                          {
                              key: "count",
                              name: "Phản ánh",
                              color: "#2563eb",
                          },
                      ],
                      link: "/complaints",
                  },
              ]
            : []),
        ...(summary.capabilities.population &&
        summary.charts.populationByArea.some(row => row.households > 0)
            ? [
                  {
                      key: "population",
                      title: "Hộ dân và nhân khẩu theo địa bàn",
                      description:
                          "Quy mô dân cư đã được khai báo tại từng Tổ/khu vực.",
                      data: summary.charts.populationByArea.map(row => ({
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
        summary.charts.financeByMonth.some(
            row => row.income > 0 || row.expense > 0,
        )
            ? [
                  {
                      key: "finance",
                      title: "Thu – Chi 6 tháng gần nhất",
                      description:
                          "Không tính các giao dịch đã hủy; đơn vị hiển thị là đồng.",
                      data: summary.charts.financeByMonth.map(row => ({ ...row })),
                      series: [
                          { key: "income", name: "Thu", color: "#16a34a" },
                          { key: "expense", name: "Chi", color: "#f97316" },
                      ],
                      orientation: "categories-x" as const,
                      link: "/finance",
                  },
              ]
            : []),
    ];
    let chartPriority = [
        "inspections",
        "complaints",
        "requests",
        "risks",
        "finance",
        "population",
    ];
    if (summary.audience === "police") {
        chartPriority = ["risks", "complaints", "requests", "population"];
    } else if (summary.audience === "neighborhood") {
        chartPriority = [
            "inspections",
            "requests",
            "complaints",
            "risks",
            "population",
        ];
    }
    chartSpecs.sort(
        (a, b) => chartPriority.indexOf(a.key) - chartPriority.indexOf(b.key),
    );

    return (
        <div className="space-y-5">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold">
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
                    className="flex items-center justify-center gap-2 rounded-xl border border-divider_01 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-ng_10"
                    onClick={load}
                >
                    <RefreshCw className="h-4 w-4" />
                    Làm mới
                </button>
            </header>

            {attentionItems.length > 0 && (
                <section>
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">
                            Cần xử lý ngay
                        </h2>
                        {attentionItems.every(item => item.value === 0) && (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
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
                                tone={item.value > 0 ? "danger" : "success"}
                                onClick={() => navigate(item.link)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {summary.capabilities.population && (
                <section>
                    <h2 className="mb-2 text-sm font-semibold">
                        Quy mô địa bàn
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            label="Hộ dân"
                            value={summary.totalHouseholds}
                            onClick={() => navigate("/houses")}
                        />
                        <StatCard
                            label="Nhà số"
                            value={summary.totalHouses}
                            onClick={() => navigate("/houses")}
                        />
                        <StatCard
                            label="Nhân khẩu"
                            value={summary.totalCitizens}
                            onClick={() => navigate("/residents")}
                        />
                        <StatCard
                            label="Hộ thuê nhà"
                            value={summary.rentalHouseholds}
                        />
                        <StatCard
                            label="Hộ cần hỗ trợ"
                            value={summary.householdsNeedingSupport}
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
                    <h2 className="mb-2 text-sm font-semibold">
                        Nhịp hoạt động
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {summary.capabilities.inspections && (
                            <StatCard
                                label="Chiến dịch đang triển khai"
                                value={
                                    summary.attention.activeInspectionCampaigns
                                }
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
                                    onClick={() => navigate("/surveys")}
                                />
                                <StatCard
                                    label="Lượt phản hồi khảo sát đang mở"
                                    value={
                                        summary.surveyParticipation.totalResponses
                                    }
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
                    <h2 className="mb-2 text-sm font-semibold">Việc của tôi</h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            label="Yêu cầu đang xử lý"
                            value={summary.myRequestCounts.inProgress}
                            onClick={() => navigate("/requests/my")}
                        />
                        <StatCard
                            label="Yêu cầu sắp hết hạn"
                            value={summary.myRequestCounts.dueSoon}
                            tone="warning"
                            onClick={() => navigate("/requests/my")}
                        />
                        <StatCard
                            label="Yêu cầu quá hạn"
                            value={summary.myRequestCounts.overdue}
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
                                    onClick={() => navigate("/complaints")}
                                />
                                <StatCard
                                    label="Phản ánh của tôi quá hạn"
                                    value={summary.myComplaintCounts.overdue}
                                    tone="danger"
                                    onClick={() => navigate("/complaints")}
                                />
                            </>
                        )}
                    </div>
                </section>
            )}

            {chartSpecs.length > 0 && (
                <section>
                    <h2 className="mb-2 text-sm font-semibold">
                        Theo dõi điều hành
                    </h2>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {chartSpecs.map(chart => (
                            <DashboardChartCard
                                key={chart.key}
                                chart={chart}
                                onOpen={() => navigate(chart.link)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {summary.myRequests.length > 0 && (
                    <section className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
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
                                className="flex w-full items-center justify-between gap-2 border-b border-divider_01 py-2 text-left last:border-0"
                                onClick={() => navigate("/requests/my")}
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                        {request.title}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {REQUEST_TYPE_LABEL[request.type]}
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
                    <section className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
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
                                className="block w-full border-b border-divider_01 py-2 text-left last:border-0"
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
                    <h2 className="mb-2 text-sm font-semibold">
                        Truy cập nhanh
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {quickModules.map(module => (
                            <button
                                key={module.key}
                                type="button"
                                className="flex items-center gap-2 rounded-2xl border border-divider_01 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                                onClick={() => navigate(module.path)}
                            >
                                <module.icon className="h-4 w-4 text-main" />
                                <span className="text-sm font-medium">
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
