import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Business, BusinessType, VerificationStatus } from "@dts";
import { fetchBusinesses } from "@service/businessApi";
import { fetchBusinessTypes } from "@service/businessTypeApi";

const ALL_STATUS = "all";
const ALL_BUSINESS_TYPE = "all";

const BusinessListPage: React.FC = () => (
    <AdminGuard permissions={["businesses.read"]}>
        <BusinessListContent />
    </AdminGuard>
);

const houseIdOf = (b: Business): string => {
    if (!b.houseId) return "";
    return typeof b.houseId === "string" ? b.houseId : b.houseId._id;
};

const houseLabelOf = (b: Business): string => {
    if (!b.houseId) return "Không xác định";
    return typeof b.houseId === "string"
        ? b.houseId
        : `${b.houseId.code} — ${b.houseId.address}`;
};

const BusinessListContent: React.FC = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<VerificationStatus | "">("");
    const [businessType, setBusinessType] = useState("");
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [items, setItems] = useState<Business[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchBusinesses({
            page: targetPage,
            limit: size,
            search: keyword,
            status: status || undefined,
            businessType: businessType || undefined,
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
    }, [search, status, businessType]);

    useEffect(() => {
        fetchBusinessTypes({ limit: 200, active: true })
            .then(res => setBusinessTypes(res.items))
            .catch(() => setBusinessTypes([]));
    }, []);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Hộ kinh doanh</h1>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
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
                        placeholder="Tìm theo tên hộ kinh doanh..."
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
            </div>

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có hộ kinh doanh nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên hộ kinh doanh</TableHead>
                                <TableHead>Nhà số</TableHead>
                                <TableHead>Cụm</TableHead>
                                <TableHead>Loại hình</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((b, index) => (
                                <TableRow
                                    key={b._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/houses/${houseIdOf(b)}/businesses/${b._id}`,
                                        )
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {b.name}
                                    </TableCell>
                                    <TableCell>{houseLabelOf(b)}</TableCell>
                                    <TableCell>{b.cluster}</TableCell>
                                    <TableCell>
                                        {b.businessType?.name || "Chưa phân loại"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={VERIFICATION_STATUS_TONE[b.status]}>
                                            {VERIFICATION_STATUS_LABEL[b.status]}
                                        </Badge>
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
        </div>
    );
};

export default BusinessListPage;
