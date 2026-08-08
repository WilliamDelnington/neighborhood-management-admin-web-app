import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import { useAuthStore } from "@store/authStore";
import {
    fetchPopulationReport,
    fetchComplaintReport,
    fetchPcccReport,
    fetchSecurityReport,
    fetchFinanceReport,
    fetchHouseReport,
    fetchBusinessReport,
    downloadReportExcel,
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
    | "business";

type ReportTab = {
    key: ReportTabKey;
    label: string;
    fetch: () => Promise<unknown>;
    excelFileName: string;
};

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
    byUsageType: "Theo mục đích sử dụng",
    usageType: "Mục đích sử dụng",
    byBusinessType: "Theo loại hình kinh doanh",
    businessType: "Loại hình kinh doanh",
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
                {value.map((item, idx) => (
                    <div
                        key={idx}
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
    <AdminGuard roles={["admin", "neighborhood_leader", "regional_police"]}>
        <ReportsContent />
    </AdminGuard>
);

const ReportsContent: React.FC = () => {
    const user = useAuthStore(state => state.user);
    const isAdmin = !!user && user.roles.includes("admin");
    const isNeighborhoodLeader =
        !!user && user.roles.includes("neighborhood_leader");
    const isRegionalPolice = !!user && user.roles.includes("regional_police");

    const tabs: ReportTab[] = [
        ...(isAdmin || isNeighborhoodLeader
            ? [
                  {
                      key: "population" as ReportTabKey,
                      label: "Dân cư",
                      fetch: fetchPopulationReport,
                      excelFileName: "bao-cao-dan-cu.xlsx",
                  },
                  {
                      key: "complaints" as ReportTabKey,
                      label: "Phản ánh",
                      fetch: () => fetchComplaintReport(),
                      excelFileName: "bao-cao-phan-anh.xlsx",
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
              ]
            : []),
        ...(isAdmin || isNeighborhoodLeader || isRegionalPolice
            ? [
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
        ...(isAdmin
            ? [
                  {
                      key: "finance" as ReportTabKey,
                      label: "Tài chính",
                      fetch: () => fetchFinanceReport(),
                      excelFileName: "bao-cao-tai-chinh.xlsx",
                  },
              ]
            : []),
    ];

    const [activeKey, setActiveKey] = useState<ReportTabKey>("population");
    const [dataByTab, setDataByTab] = useState<
        Partial<Record<ReportTabKey, unknown>>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [exporting, setExporting] = useState(false);

    const activeTab = tabs.find(t => t.key === activeKey) || tabs[0];

    const load = (tab: ReportTab) => {
        setLoading(true);
        setError(false);
        tab.fetch()
            .then(res => setDataByTab(prev => ({ ...prev, [tab.key]: res })))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (activeTab) load(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeKey]);

    const handleExport = async () => {
        if (!activeTab) return;
        try {
            setExporting(true);
            await downloadReportExcel(activeTab.key, activeTab.excelFileName);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Không thể xuất báo cáo",
            );
        } finally {
            setExporting(false);
        }
    };

    const currentData = activeTab ? dataByTab[activeTab.key] : undefined;

    if (!activeTab) {
        return (
            <div>
                <h1 className="mb-4 text-lg font-semibold">Báo cáo</h1>
                <EmptyState label="Bạn không có quyền xem báo cáo nào" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="mb-4 text-lg font-semibold">Báo cáo</h1>

            <Tabs
                value={activeKey}
                onValueChange={value => setActiveKey(value as ReportTabKey)}
            >
                <TabsList>
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
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    loading={exporting}
                                    onClick={handleExport}
                                >
                                    Xuất Excel
                                </Button>
                            </div>

                            {loading && <LoadingState />}
                            {!loading && error && (
                                <ErrorState onRetry={() => load(tab)} />
                            )}
                            {!loading && !error && !currentData && (
                                <EmptyState label="Chưa có dữ liệu báo cáo" />
                            )}
                            {!loading && !error && currentData
                                ? renderValue(currentData)
                                : null}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default ReportsPage;