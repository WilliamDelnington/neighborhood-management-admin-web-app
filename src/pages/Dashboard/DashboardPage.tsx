import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import StatCard from "@components/admin/StatCard";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { useAuthStore } from "@store/authStore";
import { MODULES } from "@constants/modules";
import { ROLE_LABEL } from "@constants/domain";
import { cn } from "@lib/utils";
import { DashboardSummary } from "@dts";
import { fetchDashboardSummary } from "@service/dashboardApi";

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    });
};

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

    const visibleModules = MODULES.filter(m =>
        user?.permissions?.includes(m.permission),
    );

    return (
        <div>
            <h1 className="mb-4 text-lg font-semibold">
                Xin chào, {user?.displayName} (
                {user ? ROLE_LABEL[user.primaryRole] : ""})
            </h1>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && summary && (
                <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                        <StatCard
                            label="Tổng hộ dân"
                            value={summary.totalHouseholds}
                        />
                        <StatCard
                            label="Tổng nhân khẩu"
                            value={summary.totalCitizens}
                        />
                        <StatCard
                            label="Nhà cho thuê"
                            value={summary.rentalHouseholds}
                        />
                        <StatCard
                            label="Hộ cần hỗ trợ"
                            value={summary.householdsNeedingSupport}
                            tone="warning"
                        />
                        <StatCard
                            label="Phản ánh mới"
                            value={summary.newComplaints}
                            tone="danger"
                        />
                        <StatCard
                            label="Đang xử lý"
                            value={summary.inProgressComplaints}
                            tone="warning"
                        />
                        <StatCard
                            label="Nguy cơ PCCC cao"
                            value={summary.highRiskPcccCount}
                            tone="danger"
                        />
                        <StatCard
                            label="Thu - Chi tháng"
                            value={`${(
                                summary.financeSummary.monthNet / 1000
                            ).toFixed(0)}k`}
                            tone={
                                summary.financeSummary.monthNet >= 0
                                    ? "success"
                                    : "danger"
                            }
                        />
                        <StatCard
                            label="Khảo sát đang mở"
                            value={summary.surveyParticipation.openSurveys}
                            onClick={() => navigate("/surveys")}
                        />
                        <StatCard
                            label="Phản hồi khảo sát"
                            value={summary.surveyParticipation.totalResponses}
                            onClick={() => navigate("/surveys")}
                        />
                    </div>

                    {summary.upcomingMeetings.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold">
                                Cuộc họp sắp tới
                            </h2>
                            <div>
                                {summary.upcomingMeetings.map(meeting => (
                                    <button
                                        key={meeting.id}
                                        type="button"
                                        className="block w-full border-b border-divider_01 py-2 text-left last:border-0"
                                        onClick={() =>
                                            navigate(
                                                `/meetings/${meeting.id}/edit`,
                                            )
                                        }
                                    >
                                        <div className="text-sm font-medium">
                                            {meeting.title}
                                        </div>
                                        <div className="text-xs text-text_2">
                                            {formatDateTime(meeting.startTime)}{" "}
                                            · {meeting.location}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {summary.taskList.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold">
                                Việc cần xử lý
                            </h2>
                            <div>
                                {summary.taskList.map(task => (
                                    <button
                                        key={task.label}
                                        type="button"
                                        className={cn(
                                            "flex w-full items-center justify-between border-b border-divider_01 py-2 text-left last:border-0",
                                            !task.link && "cursor-default",
                                        )}
                                        onClick={() => {
                                            if (task.link) {
                                                navigate(
                                                    task.link.replace(
                                                        /^\/admin/,
                                                        "",
                                                    ) || "/",
                                                );
                                            }
                                        }}
                                    >
                                        <span className="text-sm">
                                            {task.label}
                                        </span>
                                        <span className="text-sm font-medium text-main">
                                            {task.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <h2 className="mb-2 mt-4 text-sm font-semibold">
                        Nghiệp vụ
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {visibleModules.map(m => (
                            <button
                                key={m.key}
                                type="button"
                                className="flex items-center gap-2 rounded-2xl border border-divider_01 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                                onClick={() => navigate(m.path)}
                            >
                                <m.icon className="h-4 w-4 text-main" />
                                <span className="text-sm font-medium">
                                    {m.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;
