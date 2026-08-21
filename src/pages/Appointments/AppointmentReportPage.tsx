import React, { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, UserX, XCircle } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import StatCard from "@components/admin/StatCard";
import ReportBarChart from "@components/admin/ReportBarChart";
import { AppointmentReportSummary, AppointmentService } from "@dts";
import { fetchAppointmentReportSummary } from "@service/appointmentApi";
import { fetchAppointmentServices } from "@service/appointmentServiceApi";

const ALL = "all";

// Mau accent dung chung voi ReportsPage.tsx (da kiem tra an toan cho nguoi mu
// mau - xem dataviz skill/scripts/validate_palette.js): xanh duong cho ty le
// dung gio, cam cho ty le vang mat - giu nguyen thu tu mau nhu cac bao cao
// khac trong he thong thay vi tu chon mau moi.
const CHART_COLOR_1 = "#2a78d6";
const CHART_COLOR_2 = "#eb6834";

const formatPercent = (value: number) => `${Math.round(value * (value <= 1 ? 100 : 1))}%`;

const AppointmentReportPage: React.FC = () => (
    <AdminGuard permissions={["appointments.read"]}>
        <AppointmentReportContent />
    </AdminGuard>
);

const AppointmentReportContent: React.FC = () => {
    const [serviceId, setServiceId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [services, setServices] = useState<AppointmentService[]>([]);
    const [summary, setSummary] = useState<AppointmentReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchAppointmentReportSummary({
            serviceId: serviceId || undefined,
            from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
            to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
        })
            .then(setSummary)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, from, to]);

    useEffect(() => {
        fetchAppointmentServices()
            .then(setServices)
            .catch(() => setServices([]));
    }, []);

    // onTimeRate tra ve tu backend co the la 0-1 hoac 0-100 tuy cach tinh -
    // formatPercent tu nhan biet va chuan hoa ve % de hien thi nhat quan.
    const rateChartData = (summary?.byService || []).map(row => ({
        serviceName: row.serviceName,
        onTimeRatePercent: Math.round(
            row.onTimeRate * (row.onTimeRate <= 1 ? 100 : 1),
        ),
        noShowRatePercent:
            row.total > 0 ? Math.round((row.noShow / row.total) * 100) : 0,
    }));

    const ratingChartData = (summary?.byService || [])
        .filter(row => row.avgRating !== null)
        .map(row => ({
            serviceName: row.serviceName,
            avgRating: row.avgRating ?? 0,
        }));

    return (
        <div>
            <h1 className="mb-4 text-lg font-semibold">Báo cáo lịch hẹn</h1>

            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                <div>
                    <Label>Dịch vụ</Label>
                    <Select
                        value={serviceId || ALL}
                        onValueChange={v => setServiceId(v === ALL ? "" : v)}
                    >
                        <SelectTrigger className="mt-1.5 w-56">
                            <SelectValue placeholder="Tất cả dịch vụ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Tất cả dịch vụ</SelectItem>
                            {services.map(s => (
                                <SelectItem key={s._id} value={s._id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Từ ngày</Label>
                    <Input
                        className="mt-1.5"
                        type="date"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                    />
                </div>
                <div>
                    <Label>Đến ngày</Label>
                    <Input
                        className="mt-1.5"
                        type="date"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                    />
                </div>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && summary && (
                <>
                    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            label="Tổng số lịch hẹn"
                            value={summary.overall.total}
                            icon={CalendarClock}
                        />
                        <StatCard
                            label="Đã hoàn thành"
                            value={summary.overall.completed}
                            icon={CheckCircle2}
                            tone="success"
                        />
                        <StatCard
                            label="Vắng mặt"
                            value={summary.overall.noShow}
                            icon={UserX}
                            tone={summary.overall.noShow > 0 ? "danger" : "default"}
                        />
                        <StatCard
                            label="Đã hủy"
                            value={summary.overall.cancelled}
                            icon={XCircle}
                        />
                        <StatCard
                            label="Tỷ lệ đúng giờ"
                            value={formatPercent(summary.overall.onTimeRate)}
                            tone="success"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-divider_01 bg-ui_bg p-3 shadow-sm">
                            <h3 className="mb-2 text-sm font-medium text-text_2">
                                Tỷ lệ đúng giờ / vắng mặt theo dịch vụ
                            </h3>
                            {rateChartData.length === 0 ? (
                                <EmptyState label="Chưa có dữ liệu" />
                            ) : (
                                <ReportBarChart
                                    data={rateChartData}
                                    labelKey="serviceName"
                                    series={[
                                        {
                                            key: "onTimeRatePercent",
                                            name: "Tỷ lệ đúng giờ (%)",
                                            color: CHART_COLOR_1,
                                        },
                                        {
                                            key: "noShowRatePercent",
                                            name: "Tỷ lệ vắng mặt (%)",
                                            color: CHART_COLOR_2,
                                        },
                                    ]}
                                />
                            )}
                        </div>
                        <div className="rounded-lg border border-divider_01 bg-ui_bg p-3 shadow-sm">
                            <h3 className="mb-2 text-sm font-medium text-text_2">
                                Đánh giá trung bình theo dịch vụ
                            </h3>
                            {ratingChartData.length === 0 ? (
                                <EmptyState label="Chưa có đánh giá nào" />
                            ) : (
                                <ReportBarChart
                                    data={ratingChartData}
                                    labelKey="serviceName"
                                    series={[
                                        {
                                            key: "avgRating",
                                            name: "Điểm đánh giá trung bình",
                                            color: CHART_COLOR_1,
                                        },
                                    ]}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AppointmentReportPage;
