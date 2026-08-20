import React, { useEffect, useState } from "react";
import { Database, Link2, MapPinned, ShieldCheck } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { ErrorState, LoadingState } from "@components/admin/DataStates";
import { Badge } from "@components/ui/badge";
import { fetchDigitalReadiness, DigitalReadiness } from "@service/digitalReadinessApi";

const DigitalReadinessPage: React.FC = () => (
    <AdminGuard permissions={["settings.read"]}>
        <DigitalReadinessContent />
    </AdminGuard>
);

const Metric = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-lg border border-divider_01 bg-white p-4 shadow-sm">
        <p className="text-xs text-text_2">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
);

const DigitalReadinessContent: React.FC = () => {
    const [data, setData] = useState<DigitalReadiness | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchDigitalReadiness()
            .then(setData)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    if (loading) return <LoadingState />;
    if (error || !data) return <ErrorState onRetry={load} />;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-lg font-semibold">Mức sẵn sàng chuyển đổi số</h1>
                <p className="mt-1 text-sm text-text_2">
                    Hiển thị đúng trạng thái kỹ thuật hiện tại; không coi cấu hình
                    môi trường là một kết nối đã được nghiệm thu.
                </p>
            </div>

            <section>
                <div className="mb-2 flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-main" />
                    <h2 className="font-semibold">GIS Nhà số</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Metric label="Tổng Nhà số" value={data.gis.totalHouses} />
                    <Metric label="Đã có tọa độ" value={data.gis.housesWithCoordinates} />
                    <Metric label="Chưa có tọa độ" value={data.gis.housesWithoutCoordinates} />
                    <Metric label="Tỷ lệ phủ GIS" value={`${data.gis.coveragePercent}%`} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    Chưa có nền bản đồ ngoài. Giá trị null, undefined hoặc 0/0 được
                    tính là chưa có dữ liệu, không tạo điểm GIS giả.
                </p>
            </section>

            <section>
                <div className="mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-main" />
                    <h2 className="font-semibold">Định danh dân cư</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Metric label="Tài khoản chưa xác minh" value={data.identity.users.unverified} />
                    <Metric label="Tài khoản đã xác minh" value={data.identity.users.verified} />
                    <Metric label="Công dân chưa đối chiếu" value={data.identity.citizens.unverified} />
                    <Metric label="Công dân đã đối chiếu" value={data.identity.citizens.verified} />
                </div>
                <p className="mt-2 text-xs text-amber-700">
                    Phương thức hiện tại: đăng nhập số điện thoại tạm thời. Chỉ adapter
                    VNeID/CSDLQGDC thật mới được chuyển trạng thái sang đã xác minh.
                </p>
            </section>

            <section>
                <div className="mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-main" />
                    <h2 className="font-semibold">Kết nối API-First</h2>
                </div>
                <div className="overflow-hidden rounded-lg border border-divider_01 bg-white shadow-sm">
                    {data.providers.map(provider => (
                        <div
                            key={provider.code}
                            className="flex flex-wrap items-center justify-between gap-3 border-b border-divider_01 px-4 py-3 last:border-b-0"
                        >
                            <div>
                                <p className="text-sm font-medium">{provider.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {provider.capabilities.join(" · ")} · cấu hình {provider.configuredFieldCount}/{provider.requiredFieldCount}
                                </p>
                            </div>
                            <Badge tone={provider.configured ? "yellow" : "gray"}>
                                {provider.configured
                                    ? "Đã cấu hình · chưa kiểm chứng"
                                    : "Chưa cấu hình"}
                            </Badge>
                        </div>
                    ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    Lõi adapter đã tách khỏi nghiệp vụ tại {data.apiFirst.versionedBasePath};
                    đồng bộ hai chiều vẫn ở trạng thái chưa sẵn sàng cho đến khi có API và
                    cơ chế xác thực chính thức.
                </p>
            </section>

            <section className="rounded-lg border border-divider_01 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-main" />
                    <h2 className="font-semibold">Bảo mật & pháp lý</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge tone={data.compliance.sensitiveFormEncryptionAtRest ? "green" : "red"}>
                        Mã hóa payload biểu mẫu nhạy cảm
                    </Badge>
                    <Badge
                        tone={
                            data.compliance.personalDataEncryptionCoverage === "full"
                                ? "green"
                                : "yellow"
                        }
                    >
                        Mã hóa dữ liệu cá nhân: một phần
                    </Badge>
                    <Badge tone={data.compliance.auditLogging ? "green" : "red"}>
                        Nhật ký tác nghiệp
                    </Badge>
                    <Badge tone="gray">Chưa chứng nhận ATTT Cấp độ 2/3</Badge>
                    <Badge tone="gray">Chưa chứng nhận tuân thủ NĐ 13</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{data.compliance.note}</p>
            </section>
        </div>
    );
};

export default DigitalReadinessPage;
