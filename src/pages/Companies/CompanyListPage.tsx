import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, UploadCloud } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import FilterBar from "@components/admin/FilterBar";
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, BusinessType, Company, CompanyType, VerificationStatus } from "@dts";
import { fetchAllCompanies, fetchCompanies } from "@service/companyApi";
import { fetchBusinessTypes } from "@service/businessTypeApi";
import { fetchCompanyTypes } from "@service/companyTypeApi";
import { usePermission } from "@store/authStore";
import { exportFileTimestamp, exportRowsToExcel } from "@lib/exportExcel";
import CompanyImportSheet from "./CompanyImportSheet";

const ALL_STATUS = "all";
const ALL_BUSINESS_TYPE = "all";
const ALL_COMPANY_TYPE = "all";

const CompanyListPage: React.FC = () => (
    <AdminGuard permissions={["companies.read"]}>
        <CompanyListContent />
    </AdminGuard>
);

const houseIdOf = (c: Company): string => {
    if (!c.houseId) return "";
    return typeof c.houseId === "string" ? c.houseId : c.houseId._id;
};

const houseLabelOf = (c: Company): string => {
    if (!c.houseId) return "Không xác định";
    return typeof c.houseId === "string"
        ? c.houseId
        : `${c.houseId.code} — ${c.houseId.address}`;
};

const CompanyListContent: React.FC = () => {
    const navigate = useNavigate();
    // Rieng cho nut "Nhap tu Excel" - backend gate qua "imports.manage" (xem
    // /api/import/companies), giong House/Business, khong lien quan quyen
    // "companies.create" (hien khong co nut tao cong ty rieng tren trang
    // danh sach nay - tao cong ty van thuc hien qua trang chi tiet nha).
    const canImport = usePermission("imports.manage");
    const [importVisible, setImportVisible] = useState(false);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<VerificationStatus | "">("");
    const [businessType, setBusinessType] = useState("");
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [companyType, setCompanyType] = useState("");
    const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
    const [items, setItems] = useState<Company[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [exporting, setExporting] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchCompanies({
            page: targetPage,
            limit: size,
            search: keyword,
            status: status || undefined,
            businessType: businessType || undefined,
            companyType: companyType || undefined,
        })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, businessType, companyType]);

    useEffect(() => {
        fetchBusinessTypes({ limit: 200, active: true })
            .then(res => setBusinessTypes(res.items))
            .catch(() => setBusinessTypes([]));
        fetchCompanyTypes({ limit: 200, active: true })
            .then(res => setCompanyTypes(res.items))
            .catch(() => setCompanyTypes([]));
    }, []);

    // Xuat TOAN BO cong ty khop bo loc hien tai ra file .xlsx - xem ghi chu
    // tuong tu o HouseListPage.tsx.
    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const rows = await fetchAllCompanies({
                search: search || undefined,
                status: status || undefined,
                businessType: businessType || undefined,
                companyType: companyType || undefined,
            });
            if (rows.length === 0) {
                toast.error("Không có công ty nào khớp bộ lọc để xuất");
                return;
            }
            await exportRowsToExcel(
                rows,
                `cong-ty_${exportFileTimestamp()}.xlsx`,
                "Công ty",
                [
                    { label: "Tên công ty", width: 30, value: c => c.name },
                    { label: "Nhà số", width: 34, value: c => houseLabelOf(c) },
                    {
                        label: "Loại hình kinh doanh",
                        width: 26,
                        value: c =>
                            (c.businessTypeIds || [])
                                .map(bt =>
                                    typeof bt === "object" ? bt.name : null,
                                )
                                .filter(Boolean)
                                .join(", ") || "Chưa phân loại",
                    },
                    {
                        label: "Loại hình DN",
                        width: 20,
                        value: c =>
                            c.companyTypeId &&
                            typeof c.companyTypeId === "object"
                                ? c.companyTypeId.name
                                : "Chưa chọn",
                    },
                    {
                        label: "Trạng thái",
                        width: 16,
                        value: c => VERIFICATION_STATUS_LABEL[c.status],
                    },
                ],
            );
            toast.success(`Đã xuất ${rows.length} công ty`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Công ty"
                description="Quản lý công ty/doanh nghiệp đăng ký hoạt động trên địa bàn."
                action={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            loading={exporting}
                            onClick={handleExportExcel}
                        >
                            <Download className="mr-1 h-4 w-4" />
                            Xuất Excel
                        </Button>
                        {canImport && (
                            <Button
                                variant="outline"
                                onClick={() => setImportVisible(true)}
                            >
                                <UploadCloud className="mr-1 h-4 w-4" />
                                Nhập từ Excel
                            </Button>
                        )}
                    </div>
                }
            />

            <FilterBar>
                <div className="flex items-center gap-2">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, search, size);
                        }}
                    />
                    <Input
                        className="flex-1"
                        placeholder="Tìm theo tên công ty..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={status || ALL_STATUS}
                    onValueChange={v =>
                        setStatus(v === ALL_STATUS ? "" : (v as VerificationStatus))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_STATUS}>
                            Tất cả trạng thái
                        </SelectItem>
                        {(
                            Object.entries(VERIFICATION_STATUS_LABEL) as [
                                VerificationStatus,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={businessType || ALL_BUSINESS_TYPE}
                    onValueChange={v =>
                        setBusinessType(v === ALL_BUSINESS_TYPE ? "" : v)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả loại hình" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_BUSINESS_TYPE}>
                            Tất cả loại hình
                        </SelectItem>
                        {businessTypes.map(bt => (
                            <SelectItem key={bt._id} value={bt._id}>
                                {bt.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={companyType || ALL_COMPANY_TYPE}
                    onValueChange={v =>
                        setCompanyType(v === ALL_COMPANY_TYPE ? "" : v)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả loại hình DN" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_COMPANY_TYPE}>
                            Tất cả loại hình DN
                        </SelectItem>
                        {companyTypes.map(ct => (
                            <SelectItem key={ct._id} value={ct._id}>
                                {ct.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FilterBar>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có công ty nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên công ty</TableHead>
                                <TableHead>Nhà số</TableHead>
                                <TableHead>Loại hình kinh doanh</TableHead>
                                <TableHead>Loại hình DN</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((c, index) => (
                                <TableRow
                                    key={c._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/houses/${houseIdOf(c)}/companies/${c._id}`,
                                        )
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {c.name}
                                    </TableCell>
                                    <TableCell>{houseLabelOf(c)}</TableCell>
                                    <TableCell>
                                        {(c.businessTypeIds || [])
                                            .map(bt =>
                                                typeof bt === "object"
                                                    ? bt.name
                                                    : null,
                                            )
                                            .filter(Boolean)
                                            .join(", ") || "Chưa phân loại"}
                                    </TableCell>
                                    <TableCell>
                                        {c.companyTypeId &&
                                        typeof c.companyTypeId === "object"
                                            ? c.companyTypeId.name
                                            : "Chưa chọn"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={VERIFICATION_STATUS_TONE[c.status]}>
                                            {VERIFICATION_STATUS_LABEL[c.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                navigate(
                                                    `/houses/${houseIdOf(c)}/companies/${c._id}`,
                                                )
                                            }
                                        >
                                            Chi tiết
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={p => load(p, search)}
                    disabled={loading}
                />
            )}

            <CompanyImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />
        </div>
    );
};

export default CompanyListPage;
