import React from "react";
import { LayoutGrid } from "lucide-react";
import StatCard from "@components/admin/StatCard";
import { DASHBOARD_METRIC_LABEL } from "@constants/domain";
import { ComplaintSummary, DashboardMetricKey, DashboardSummary } from "@dts";

const isComplaintSummary = (
    value: number | ComplaintSummary,
): value is ComplaintSummary => typeof value === "object" && value !== null;

/**
 * Grid so lieu CHUNG, khong theo audience co dinh - hien thi khi
 * summary.allowedDashboardMetrics khac null (tuc la co it nhat 1 vai tro cua
 * actor da cau hinh Role.dashboardMetrics qua man Quan ly vai tro), THAY CHO
 * NeighborhoodDashboardView/WardDashboardView. Danh sach the hien thi dung
 * DASHBOARD_METRIC_LABEL lam nhan, theo dung thu tu DASHBOARD_METRIC_KEYS
 * (khong phai thu tu Object.entries cua summary.metrics, de on dinh giao dien
 * bat ke thu tu backend tra ve).
 */
const CustomMetricsSection: React.FC<{ summary: DashboardSummary }> = ({
    summary,
}) => {
    const metrics = summary.metrics || {};
    const keys = Object.keys(DASHBOARD_METRIC_LABEL) as DashboardMetricKey[];
    const presentKeys = keys.filter(key => metrics[key] !== undefined);

    if (presentKeys.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-divider_01 bg-ui_bg px-4 py-6 text-center text-xs text-text_2">
                Vai trò của bạn chưa được cấu hình số liệu dashboard nào. Liên hệ
                quản trị viên để thiết lập qua Quản lý vai trò.
            </div>
        );
    }

    return (
        <section>
            <div className="mb-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text_1">
                    <LayoutGrid className="h-4 w-4 text-main" />
                    Số liệu tổng hợp
                </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {presentKeys.map(key => {
                    const value = metrics[key];
                    if (value === undefined) return null;
                    if (key === "complaints_summary" && isComplaintSummary(value)) {
                        return (
                            <React.Fragment key={key}>
                                <StatCard
                                    label="Chưa xử lý"
                                    value={value.unprocessed}
                                    tone="danger"
                                />
                                <StatCard
                                    label="Đang xử lý"
                                    value={value.inProgress}
                                    tone="warning"
                                />
                                <StatCard
                                    label="Đã xử lý"
                                    value={value.processed}
                                    tone="success"
                                />
                                <StatCard label="Tổng phản ánh" value={value.total} />
                            </React.Fragment>
                        );
                    }
                    if (isComplaintSummary(value)) return null;
                    return (
                        <StatCard
                            key={key}
                            label={DASHBOARD_METRIC_LABEL[key]}
                            value={value}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default CustomMetricsSection;
