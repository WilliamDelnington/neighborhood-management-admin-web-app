import React from "react";
import {
    AlertTriangle,
    Briefcase,
    Building2,
    ClipboardCheck,
    ClipboardList,
    Database,
    Flame,
    GraduationCap,
    Heart,
    HeartHandshake,
    Home,
    LayoutGrid,
    MessageSquare,
    ShieldAlert,
    ShoppingBag,
    Sparkles,
    Stethoscope,
    Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "@components/admin/StatCard";
import ReportBarChart from "@components/admin/ReportBarChart";
import { Badge } from "@components/ui/badge";
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

const ComingSoonSection: React.FC<{
    title: string;
    icon: React.ElementType;
    description: string;
}> = ({ title, icon, description }) => (
    <Section title={title} icon={icon}>
        <EmptyNote label={description} />
    </Section>
);

/**
 * Dashboard rieng cho dieu hanh cap Phuong (audience === "ward"): bi
 * thu/can bo UBND, va bat ky vai tro tuy chinh nao duoc gan wardCode (xem
 * dashboardAreaContext o backend - khong phu thuoc ten role key cu the). 7
 * nhom man hinh theo yeu cau, 2 nhom cuoi (Dich vu so, An toan he thong)
 * chua co du lieu backing nen hien "Sap ra mat" thay vi so lieu gia.
 */
const WardDashboardView: React.FC<{ summary: DashboardSummary }> = ({
    summary,
}) => {
    const navigate = useNavigate();
    const overview = summary.wardOverview;

    if (!overview) {
        return <EmptyNote label="Chưa có dữ liệu tổng hợp cho Phường này." />;
    }

    const slowCount = overview.neighborhoods.filter(row => row.isSlow).length;
    const highAlertCount = overview.neighborhoods.filter(
        row => row.isHighAlert,
    ).length;

    return (
        <div className="space-y-5">
            <Section
                title="Nhà số"
                icon={Home}
                description="Số liệu tổng hợp Nhà số/Tổ dân phố/chủ sở hữu/đơn vị kinh doanh trong toàn Phường."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        label="Tổ dân phố"
                        value={overview.houseSummary.neighborhoods}
                        icon={LayoutGrid}
                    />
                    <StatCard
                        label="Nhà số"
                        value={overview.houseSummary.houses}
                        icon={Building2}
                        onClick={() => navigate("/houses")}
                    />
                    <StatCard
                        label="Chủ sở hữu"
                        value={overview.houseSummary.owners}
                        icon={Users}
                    />
                    <StatCard
                        label="Đơn vị kinh doanh"
                        value={overview.houseSummary.businessUnits}
                        icon={ShoppingBag}
                    />
                </div>
            </Section>

            <Section
                title="Phản ánh"
                icon={MessageSquare}
                description="Tình hình tiếp nhận và xử lý phản ánh trong toàn Phường."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        label="Tổng số"
                        value={overview.complaintSummary.total}
                        icon={MessageSquare}
                        onClick={() => navigate("/complaints")}
                    />
                    <StatCard
                        label="Chưa xử lý"
                        value={overview.complaintSummary.unprocessed}
                        icon={AlertTriangle}
                        tone={
                            overview.complaintSummary.unprocessed > 0
                                ? "danger"
                                : "default"
                        }
                        onClick={() =>
                            navigate("/complaints?status=moi_tiep_nhan")
                        }
                    />
                    <StatCard
                        label="Đang xử lý"
                        value={overview.complaintSummary.inProgress}
                        icon={ClipboardList}
                    />
                    <StatCard
                        label="Đã xử lý"
                        value={overview.complaintSummary.processed}
                        icon={ClipboardCheck}
                    />
                </div>
            </Section>

            <Section
                title={`Toàn cảnh ${overview.neighborhoods.length} Tổ dân phố`}
                icon={LayoutGrid}
                description="Tiến độ Nhà số và mức độ cảnh báo theo từng Tổ dân phố."
            >
                <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        label="Số Tổ dân phố"
                        value={overview.neighborhoods.length}
                        icon={LayoutGrid}
                    />
                    <StatCard
                        label="Tỷ lệ xác minh trung bình"
                        value={
                            overview.neighborhoods.length > 0
                                ? `${(
                                      overview.neighborhoods.reduce(
                                          (sum, row) => sum + row.verificationRate,
                                          0,
                                      ) / overview.neighborhoods.length
                                  ).toFixed(1)}%`
                                : "—"
                        }
                        icon={ClipboardCheck}
                    />
                    <StatCard
                        label="Tổ dân phố chậm"
                        value={slowCount}
                        icon={AlertTriangle}
                        tone={slowCount > 0 ? "warning" : "default"}
                    />
                    <StatCard
                        label="Tổ dân phố nhiều cảnh báo"
                        value={highAlertCount}
                        icon={ShieldAlert}
                        tone={highAlertCount > 0 ? "danger" : "default"}
                    />
                </div>
                {overview.neighborhoods.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-divider_01 text-xs text-text_2">
                                    <th className="px-3 py-2 font-medium">
                                        Tổ dân phố
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Nhà số
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Tỷ lệ xác minh
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Cập nhật gần nhất
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Cảnh báo
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.neighborhoods
                                    .slice()
                                    .sort(
                                        (a, b) =>
                                            a.verificationRate - b.verificationRate,
                                    )
                                    .map(row => (
                                        <tr
                                            key={row.neighborhoodId}
                                            className="cursor-pointer border-b border-divider_01 last:border-0 hover:bg-ng_10"
                                            onClick={() =>
                                                navigate(
                                                    `/neighborhoods/${row.neighborhoodId}`,
                                                )
                                            }
                                        >
                                            <td className="px-3 py-2 font-medium">
                                                {row.name}
                                            </td>
                                            <td className="px-3 py-2 text-text_2">
                                                {row.verifiedHouses}/{row.totalHouses}
                                            </td>
                                            <td className="px-3 py-2 text-text_2">
                                                {row.verificationRate}%
                                            </td>
                                            <td className="px-3 py-2 text-text_2">
                                                {row.lastUpdatedAt
                                                    ? new Date(
                                                          row.lastUpdatedAt,
                                                      ).toLocaleDateString("vi-VN")
                                                    : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {row.isSlow && (
                                                        <Badge tone="yellow">
                                                            Chậm
                                                        </Badge>
                                                    )}
                                                    {row.isHighAlert && (
                                                        <Badge tone="red">
                                                            {row.highAlertCount} cảnh
                                                            báo
                                                        </Badge>
                                                    )}
                                                    {!row.isSlow &&
                                                        !row.isHighAlert && (
                                                            <Badge tone="green">
                                                                Ổn định
                                                            </Badge>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyNote label="Chưa có Tổ dân phố nào được phân công cho Phường này." />
                )}
                <p className="mt-1 text-[11px] text-text_2">
                    “Mức độ cập nhật” là ước tính dựa trên thời điểm sửa Nhà số
                    gần nhất, chưa phải chỉ tiêu cập nhật dữ liệu chính thức.
                </p>
            </Section>

            <Section
                title="Chất lượng dữ liệu"
                icon={Database}
                description="Rà soát trùng lặp và các sai lệch dữ liệu Nhà số trong Phường."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        label="Nhóm địa chỉ trùng"
                        value={overview.dataQuality.duplicateAddressGroups}
                        icon={AlertTriangle}
                        tone={
                            overview.dataQuality.duplicateAddressGroups > 0
                                ? "warning"
                                : "default"
                        }
                        onClick={() => navigate("/houses")}
                    />
                    <StatCard
                        label="Số nhà bị ảnh hưởng"
                        value={overview.dataQuality.duplicateAddressHouses}
                        icon={Building2}
                        tone={
                            overview.dataQuality.duplicateAddressHouses > 0
                                ? "warning"
                                : "default"
                        }
                    />
                </div>
                {!overview.dataQuality.otherChecksAvailable && (
                    <p className="mt-2 text-[11px] text-text_2">
                        Trùng mã, thiếu chủ thể liên hệ, hồ sơ quá hạn và dữ
                        liệu chưa có nguồn xác nhận chưa có dữ liệu để hiển
                        thị.
                    </p>
                )}
            </Section>

            <Section
                title="Dân cư – xã hội"
                icon={Users}
                description="Quy mô dân cư và các chỉ báo xã hội trong toàn Phường."
            >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard
                        label="Số hộ"
                        value={overview.population.households}
                        icon={Users}
                        onClick={() => navigate("/houses")}
                    />
                    <StatCard
                        label="Nhân khẩu"
                        value={overview.population.citizens}
                        icon={Users}
                        onClick={() => navigate("/residents")}
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
            </Section>

            <Section
                title="Kinh tế địa bàn"
                icon={ShoppingBag}
                description="Hộ kinh doanh, công ty và giấy phép trong toàn Phường."
            >
                {overview.economy.dataAvailable ? (
                    <>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatCard
                                label="Hộ kinh doanh"
                                value={overview.economy.total}
                                icon={ShoppingBag}
                                onClick={() => navigate("/businesses")}
                            />
                            <StatCard
                                label="Công ty"
                                value={overview.economy.totalCompanies}
                                icon={Building2}
                                onClick={() => navigate("/companies")}
                            />
                            <StatCard
                                label="Giấy phép sắp hết hạn"
                                value={overview.economy.expiringLicenses}
                                icon={ClipboardList}
                                tone={
                                    overview.economy.expiringLicenses > 0
                                        ? "warning"
                                        : "default"
                                }
                            />
                            <StatCard
                                label="Mới trong 30 ngày"
                                value={overview.economy.newInPeriod}
                                icon={Sparkles}
                            />
                            <StatCard
                                label="Ngừng hoạt động"
                                value={overview.economy.inactive}
                                icon={AlertTriangle}
                            />
                        </div>
                        {overview.economy.byIndustry.length > 0 && (
                            <div className="mt-3 rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                                <h3 className="mb-2 text-sm font-semibold">
                                    Cơ cấu ngành nghề
                                </h3>
                                <ReportBarChart
                                    data={overview.economy.byIndustry}
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
                description="Điểm nguy cơ và tỷ lệ xử lý theo từng Tổ dân phố."
            >
                {overview.safety.dataAvailable ? (
                    <>
                        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                            <StatCard
                                label="Nhà chưa kiểm tra"
                                value={overview.safety.housesNotInspected}
                                icon={ClipboardCheck}
                                tone={
                                    overview.safety.housesNotInspected > 0
                                        ? "warning"
                                        : "default"
                                }
                            />
                            <StatCard
                                label="Điểm nguy cơ mức Đỏ"
                                value={overview.safety.highRiskPccc}
                                icon={Flame}
                                tone={
                                    overview.safety.highRiskPccc > 0
                                        ? "danger"
                                        : "default"
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
                            />
                        </div>
                        {overview.safety.byNeighborhood.some(
                            row =>
                                row.highRiskPccc +
                                    row.urgentSecurity +
                                    row.openComplaints >
                                0,
                        ) && (
                            <div className="rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
                                <h3 className="mb-2 text-sm font-semibold">
                                    Phản ánh theo Tổ dân phố
                                </h3>
                                <ReportBarChart
                                    data={overview.safety.byNeighborhood.filter(
                                        row =>
                                            row.highRiskPccc +
                                                row.urgentSecurity +
                                                row.openComplaints >
                                            0,
                                    )}
                                    labelKey="name"
                                    series={[
                                        {
                                            key: "openComplaints",
                                            name: "Phản ánh tồn đọng",
                                            color: "#2563eb",
                                        },
                                        {
                                            key: "highRiskPccc",
                                            name: "PCCC mức Đỏ",
                                            color: "#dc2626",
                                        },
                                    ]}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyNote label="Tài khoản chưa có quyền xem dữ liệu PCCC/an ninh." />
                )}
            </Section>

            {summary.departmentOverview?.police && (
                <Section
                    title="Công an phường"
                    icon={ShieldAlert}
                    description="Số liệu cư trú và độ tuổi nhập ngũ trong toàn Phường."
                >
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard
                            label="Chưa khai báo cư trú"
                            value={
                                summary.departmentOverview.police
                                    .undeclaredResidency
                            }
                            icon={AlertTriangle}
                            tone={
                                summary.departmentOverview.police
                                    .undeclaredResidency > 0
                                    ? "warning"
                                    : "default"
                            }
                            onClick={() => navigate("/residents")}
                        />
                        <StatCard
                            label="Nam trong độ tuổi nhập ngũ"
                            value={
                                summary.departmentOverview.police
                                    .militaryAgeMen
                            }
                            icon={Users}
                        />
                    </div>
                </Section>
            )}

            {summary.departmentOverview?.socialAffairs && (
                <Section
                    title="Văn hóa – Xã hội (An sinh)"
                    icon={HeartHandshake}
                    description="Số liệu an sinh xã hội trong toàn Phường."
                >
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard
                            label="Phụ nữ"
                            value={summary.departmentOverview.socialAffairs.women}
                            icon={Users}
                        />
                        <StatCard
                            label="Người cao tuổi"
                            value={
                                summary.departmentOverview.socialAffairs.elderly
                            }
                            icon={Users}
                        />
                        <StatCard
                            label="Trẻ em"
                            value={
                                summary.departmentOverview.socialAffairs.children
                            }
                            icon={Users}
                        />
                        <StatCard
                            label="Cựu chiến binh"
                            value={
                                summary.departmentOverview.socialAffairs.veterans
                            }
                            icon={Users}
                        />
                        <StatCard
                            label="Liệt sĩ/TB/BB"
                            value={
                                summary.departmentOverview.socialAffairs.martyrs
                            }
                            icon={Users}
                        />
                        <StatCard
                            label="Hộ nghèo/cận nghèo"
                            value={
                                summary.departmentOverview.socialAffairs
                                    .poorHouseholds
                            }
                            icon={Heart}
                            tone={
                                summary.departmentOverview.socialAffairs
                                    .poorHouseholds > 0
                                    ? "warning"
                                    : "default"
                            }
                        />
                    </div>
                </Section>
            )}

            {summary.departmentOverview?.health && (
                <Section
                    title="Y tế"
                    icon={Stethoscope}
                    description="Tình hình theo dõi dịch bệnh trong toàn Phường."
                >
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard
                            label="Đang theo dõi dịch bệnh"
                            value={
                                summary.departmentOverview.health
                                    .diseaseMonitoredHouseholds
                            }
                            icon={Stethoscope}
                            tone={
                                summary.departmentOverview.health
                                    .diseaseMonitoredHouseholds > 0
                                    ? "danger"
                                    : "default"
                            }
                        />
                    </div>
                </Section>
            )}

            {summary.departmentOverview?.education && (
                <Section
                    title="Giáo dục"
                    icon={GraduationCap}
                    description="Số liệu trẻ trong độ tuổi đi học trong toàn Phường."
                >
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard
                            label="Trẻ trong độ tuổi đi học"
                            value={
                                summary.departmentOverview.education
                                    .schoolAgeChildren
                            }
                            icon={GraduationCap}
                        />
                    </div>
                </Section>
            )}

            {summary.departmentOverview?.economyLabor && (
                <Section
                    title="Kinh tế, Lao động"
                    icon={Briefcase}
                    description="Số liệu kinh tế và lao động trong toàn Phường."
                >
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard
                            label="Đơn vị kinh doanh"
                            value={
                                summary.departmentOverview.economyLabor
                                    .businessUnits
                            }
                            icon={ShoppingBag}
                            onClick={() => navigate("/businesses")}
                        />
                        <StatCard
                            label="Đang thất nghiệp"
                            value={
                                summary.departmentOverview.economyLabor
                                    .unemployed
                            }
                            icon={Briefcase}
                        />
                    </div>
                </Section>
            )}

            <ComingSoonSection
                title="Dịch vụ số"
                icon={Sparkles}
                description="Lượt kích hoạt tài khoản, thông báo đã đọc, phản ánh trực tuyến và mức độ hài lòng — sắp ra mắt."
            />

            <ComingSoonSection
                title="An toàn hệ thống"
                icon={ShieldAlert}
                description="Tài khoản hoạt động, MFA, truy cập bất thường, nhật ký xuất dữ liệu, sao lưu và uptime — sắp ra mắt."
            />

            <p className="text-right text-xs text-text_2">
                Phạm vi: {summary.scopeLabel}
            </p>
        </div>
    );
};

export default WardDashboardView;
