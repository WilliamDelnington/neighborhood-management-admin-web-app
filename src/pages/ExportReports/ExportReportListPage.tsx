import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import PageHeader from "@components/admin/PageHeader";
import { cn } from "@lib/utils";
import { useAuthStore } from "@store/authStore";
import { ALL_REPORT_PERMISSIONS, REPORT_ITEMS } from "./reportItems";

const ExportReportListPage: React.FC = () => (
    <AdminGuard permissions={ALL_REPORT_PERMISSIONS}>
        <ExportReportListContent />
    </AdminGuard>
);

const ExportReportListContent: React.FC = () => {
    const navigate = useNavigate();
    // Lay thang tu store (khong goi usePermission trong .map ben duoi - goi
    // hook ben trong callback vi pham rules of hooks) roi tu kiem tra quyen
    // cho tung the.
    const grantedPermissions = useAuthStore(
        state => state.user?.permissions ?? [],
    );
    // An han cac danh sach khong duoc cap quyen thay vi hien "Khong co
    // quyen" - nguoi khong co quyen se khong biet danh sach do ton tai.
    const visibleItems = REPORT_ITEMS.filter(item =>
        grantedPermissions.includes(item.permission),
    );

    return (
        <div>
            <PageHeader
                title="Xuất báo cáo"
                description="Bấm vào từng ô để xem và xuất danh sách nhân khẩu theo nhóm đối tượng."
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item, index) => {
                    const clickable = Boolean(item.filter);
                    return (
                        <Card
                            key={item.key}
                            role={clickable ? "button" : undefined}
                            tabIndex={clickable ? 0 : undefined}
                            onClick={
                                clickable
                                    ? () => navigate(`/export-reports/${item.key}`)
                                    : undefined
                            }
                            onKeyDown={
                                clickable
                                    ? e => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              navigate(`/export-reports/${item.key}`);
                                          }
                                      }
                                    : undefined
                            }
                            className={cn(
                                "flex flex-col transition-colors",
                                clickable
                                    ? "cursor-pointer hover:border-primary hover:bg-blue_10/40"
                                    : "opacity-70",
                            )}
                        >
                            <CardContent className="flex flex-1 items-start justify-between gap-3 p-4">
                                <div className="flex flex-1 items-start gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue_10 text-xs font-semibold text-primary">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium leading-snug">
                                        {item.label}
                                    </span>
                                </div>
                                {clickable ? (
                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text_2" />
                                ) : (
                                    <Badge tone="gray" className="shrink-0 px-2">
                                        Sắp có
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ExportReportListPage;
