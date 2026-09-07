import React from "react";
import {
    Building2,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Flame,
    Home,
    MapPin,
    ShieldAlert,
    ShoppingBag,
    Store,
    Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "@components/admin/StatCard";
import ReportBarChart from "@components/admin/ReportBarChart";
import GisOverviewMap from "@components/admin/GisOverviewMap";
import { DashboardSummary } from "@dts";

const Section: React.FC<{
    title: string;
    icon: React.ElementType;
    description?: string;
    children: React.ReactNode;
}> = ({ title, icon: Icon, description, children }) => (
    <section>
        <div className="mb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text_1">
                <Icon className="h-4 w-4 text-main" />
                {title}
            </h2>
            {description && (
                <p className="mt-0.5 text-xs text-text_2">{description}</p>
            )}
        </div>
        {children}
    </section>
);

const EmptyNote: React.FC<{ label: string }> = ({ label }) => (
    <div className="rounded-lg border border-dashed border-divider_01 bg-ui_bg px-4 py-6 text-center text-xs text-text_2">
        {label}
    </div>
);

/**
 * Dashboard rieng cho to truong/to pho (audience === "neighborhood"), theo 6
 * nhom man hinh: Tong quan Nha so, Dan cu tong hop, Kinh doanh, PCCC-moi
 * truong-an ninh, Phan anh va nhiem vu, Ban do TDP. Cong tac vien khong vao
 * duoc audience nay (xem dashboardAreaContext o backend) nen khong can xu ly
 * rieng o day.
 */
const NeighborhoodDashboardView: React.FC<{ summary: DashboardSummary }> = ({
    summary,
}) => {
    const navigate = useNavigate();
    const overview = summary.neighborhoodOverview;

    if (!overview) {
        return <EmptyNote label="Chưa có dữ liệu tổng hợp cho Tổ dân phố này." />;
    }

    const houseStatusChart = [
        { label: "Đã xác minh", value: overview.houses.verified, key: "verified" },
        { label: "Chờ xác minh", value: overview.houses.pending, key: "pending" },
        { label: "Chưa xác minh", value: overview.houses.unverified, key: "unverified" },
        { label: "Cần chú ý", value: overview.houses.needsAttention, key: "attention" },
    ].filter(row => row.value > 0);

    return (
        <div className="space-y-5">
            <Section
                title="Tổng quan Nhà số"
                icon={Home}
                description="Số lượng và trạng thái xác minh của toàn bộ Nhà số trong Tổ."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
                    <StatCard
                        label="Tổng số nhà"
                        value={overview.houses.total}
                        icon={Home}
                        onClick={() => navigate("/houses")}
                    />
                    <StatCard
                        label="Đã xác minh"
                        value={overview.houses.verified}
                        icon={CheckCircle2}
                        tone="success"
                        onClick={() => navigate("/houses?status=verified")}
                    />
                    <StatCard
                        label="Chưa xác minh"
                        value={overview.houses.unverified}
                        icon={ClipboardCheck}
                        tone="warning"
                        onClick={() => navigate("/houses?status=unverified")}
                    />
                    <StatCard
                        label="Đang ở"
                        value={overview.houses.occupied}
                        icon={Home}
                    />
                    <StatCard
                        label="Kinh doanh"
                        value={overview.houses.business}
                        icon={Store}
                    />
                    <StatCard
                        label="Bỏ trống (ước tính)"
                        value={overview.houses.vacant}
                        icon={Building2}
                        tone={overview.houses.vacant > 0 ? "warning" : "default"}
                    />
                </div>
                {houseStatusChart.length > 0 && (
                    <div className="mt-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                        <ReportBarChart
                            data={houseStatusChart}
                            labelKey="label"
                            series={[{ key: "value", name: "Số nhà", color: "#2563eb" }]}
                        />
                    </div>
                )}
                <p className="mt-1 text-[11px] text-text_2">
                    “Đang ở”/“Kinh doanh”/“Bỏ trống” là ước tính dựa trên hộ dân
                    và hộ kinh doanh đã gắn với nhà, chưa phải trạng thái sử
                    dụng do chủ nhà tự khai báo.
                </p>
            </Section>

            <Section
                title="Dân cư tổng hợp"
                icon={Users}
                description="Quy mô hộ dân, nhân khẩu và cư trú trong Tổ."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        label="Số hộ"
                        value={overview.population.households}
                        icon={Home}
                        onClick={() => navigate("/houses")}
                    />
                    <StatCard
                        label="Nhân khẩu thực tế"
                        value={overview.population.citizens}
                        icon={Users}
                        onClick={() => navigate("/residents")}
                    />
                    <StatCard
                        label="Thường trú"
                        value={overview.population.permanentResidents}
                        icon={Users}
                    />
                    <StatCard
                        label="Tạm trú"
                        value={overview.population.temporaryResidents}
                        icon={Users}
                    />
                    <StatCard
                        label="Người thuê nhà"
                        value={overview.population.renters}
                        icon={ClipboardList}
                    />
                    <StatCard
                        label="Người cao tuổi"
                        value={overview.population.elderly}
                        icon={Users}
                    />
                    <StatCard
                        label="Trẻ em"
                        value={overview.population.children}
                        icon={Users}
                    />
                    <StatCard
                        label="Hộ cần hỗ trợ"
                        value={overview.population.needsSupport}
                        icon={Users}
                        tone={
                            overview.population.needsSupport > 0
                                ? "warning"
                                : "default"
                        }
                    />
                </div>
                <p className="mt-1 text-[11px] text-text_2">
                    Hộ mới đến/đi chưa có dữ liệu để hiển thị.
                </p>
            </Section>

            <Section
                title="Kinh doanh"
                icon={ShoppingBag}
                description="Hộ kinh doanh, công ty và tình trạng giấy phép trong Tổ."
            >
                {overview.business.dataAvailable ? (
                    <>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatCard
                                label="Hộ kinh doanh"
                                value={overview.business.total}
                                icon={Store}
                                onClick={() => navigate("/businesses")}
                            />
                            <StatCard
                                label="Công ty"
                                value={overview.business.totalCompanies}
                                icon={Building2}
                                onClick={() => navigate("/companies")}
                            />
                            <StatCard
                                label="Thiếu giấy phép"
                                value={overview.business.missingLicense}
                                icon={ClipboardList}
                                tone={
                                    overview.business.missingLicense > 0
                                        ? "danger"
                                        : "default"
                                }
                            />
                            <StatCard
                                label="Giấy phép sắp hết hạn"
                                value={overview.business.expiringLicenses}
                                icon={ClipboardList}
                                tone={
                                    overview.business.expiringLicenses > 0
                                        ? "warning"
                                        : "default"
                                }
                            />
                            <StatCard
                                label="Cần rà soát"
                                value={overview.business.needsReview}
                                icon={ClipboardCheck}
                                tone={
                                    overview.business.needsReview > 0
                                        ? "warning"
                                        : "default"
                                }
                                onClick={() => navigate("/businesses?status=pending")}
                            />
                        </div>
                        {overview.business.byIndustry.length > 0 && (
                            <div className="mt-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                                <h3 className="mb-2 text-sm font-semibold">
                                    Hộ kinh doanh theo nhóm ngành
                                </h3>
                                <ReportBarChart
                                    data={overview.business.byIndustry}
                                    labelKey="label"
                                    series={[
                                        { key: "count", name: "Số hộ", color: "#2563eb" },
                                    ]}
                                />
                            </div>
                        )}
                        <p className="mt-1 text-[11px] text-text_2">
                            “Kinh doanh có điều kiện” chưa có dữ liệu để hiển
                            thị.
                        </p>
                    </>
                ) : (
                    <EmptyNote label="Tài khoản chưa có quyền xem dữ liệu kinh doanh." />
                )}
            </Section>

            <Section
                title="PCCC – môi trường – an ninh"
                icon={ShieldAlert}
                description="Rủi ro cháy nổ, an ninh và kiến nghị chưa khắc phục."
            >
                {overview.safety.dataAvailable ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                        <StatCard
                            label="Nhà chưa rà soát"
                            value={overview.safety.housesNotInspected}
                            icon={ClipboardCheck}
                            tone={
                                overview.safety.housesNotInspected > 0
                                    ? "warning"
                                    : "default"
                            }
                            onClick={() => navigate("/pccc")}
                        />
                        <StatCard
                            label="Điểm nguy cơ mức Đỏ"
                            value={overview.safety.highRiskPccc}
                            icon={Flame}
                            tone={
                                overview.safety.highRiskPccc > 0 ? "danger" : "default"
                            }
                            onClick={() => navigate("/pccc?riskLevel=do")}
                        />
                        <StatCard
                            label="An ninh khẩn cấp"
                            value={overview.safety.urgentSecurity}
                            icon={ShieldAlert}
                            tone={
                                overview.safety.urgentSecurity > 0
                                    ? "danger"
                                    : "default"
                            }
                            onClick={() => navigate("/security?level=khan_cap")}
                        />
                        <StatCard
                            label="Kiến nghị chưa khắc phục"
                            value={overview.safety.unresolvedRecommendations}
                            icon={ClipboardList}
                            tone={
                                overview.safety.unresolvedRecommendations > 0
                                    ? "warning"
                                    : "default"
                            }
                            onClick={() => navigate("/pccc")}
                        />
                        <StatCard
                            label="Phản ánh liên quan"
                            value={overview.safety.openComplaints}
                            icon={ClipboardList}
                            onClick={() => navigate("/complaints")}
                        />
                    </div>
                ) : (
                    <EmptyNote label="Tài khoản chưa có quyền xem dữ liệu PCCC/an ninh." />
                )}
            </Section>

            <Section
                title="Phản ánh và nhiệm vụ"
                icon={ClipboardList}
                description="Tiếp nhận, xử lý và mức độ hài lòng đối với phản ánh, nhiệm vụ."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                    <StatCard
                        label="Phản ánh mới"
                        value={overview.tasks.newComplaints}
                        icon={ClipboardList}
                        onClick={() => navigate("/complaints?status=moi_tiep_nhan")}
                    />
                    <StatCard
                        label="Đang xử lý"
                        value={overview.tasks.inProgressComplaints}
                        icon={ClipboardList}
                        onClick={() => navigate("/complaints")}
                    />
                    <StatCard
                        label="Lượt việc quá hạn"
                        value={overview.tasks.overdueRequestAssignments}
                        icon={ClipboardList}
                        tone={
                            overview.tasks.overdueRequestAssignments > 0
                                ? "danger"
                                : "default"
                        }
                        onClick={() => navigate("/requests")}
                    />
                    <StatCard
                        label="Lượt việc hoàn thành"
                        value={overview.tasks.resolvedRequestAssignments}
                        icon={CheckCircle2}
                        tone="success"
                        onClick={() => navigate("/requests")}
                    />
                    <StatCard
                        label="Tỷ lệ đúng hạn"
                        value={
                            overview.tasks.onTimeCompletionRate === null
                                ? "Chưa có dữ liệu"
                                : `${overview.tasks.onTimeCompletionRate}%`
                        }
                        icon={ClipboardCheck}
                    />
                    <StatCard
                        label="Mức độ hài lòng (1-5)"
                        value={
                            overview.tasks.averageSatisfaction === null
                                ? "Chưa có dữ liệu"
                                : overview.tasks.averageSatisfaction
                        }
                        icon={Users}
                    />
                </div>
            </Section>

            <Section
                title="Bản đồ TDP"
                icon={MapPin}
                description="Lớp bản đồ theo trạng thái sử dụng, nguy cơ và phản ánh."
            >
                <GisOverviewMap
                    data={summary.gisOverview}
                    onOpenHouse={houseId => navigate(`/houses/${houseId}`)}
                />
            </Section>

            <p className="text-right text-xs text-text_2">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Phạm vi: {summary.scopeLabel}
            </p>
        </div>
    );
};

export default NeighborhoodDashboardView;
