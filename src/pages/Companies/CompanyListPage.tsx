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
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Company, VerificationStatus } from "@dts";
import { fetchCompanies } from "@service/companyApi";

const ALL_STATUS = "all";

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

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<VerificationStatus | "">("");
    const [items, setItems] = useState<Company[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, keyword = search) => {
        setLoading(true);
        setError(false);
        fetchCompanies({
            page: targetPage,
            search: keyword,
            status: status || undefined,
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
    }, [search, status]);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Công ty</h1>
            </div>

            <div className="mb-4 grid max-w-xl grid-cols-2 gap-3">
                <Input
                    placeholder="Tìm theo tên công ty..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
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
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
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
                                <TableHead>Cụm</TableHead>
                                <TableHead>Tổ chức liên kết</TableHead>
                                <TableHead>Trạng thái</TableHead>
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
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {c.name}
                                    </TableCell>
                                    <TableCell>{houseLabelOf(c)}</TableCell>
                                    <TableCell>{c.cluster}</TableCell>
                                    <TableCell>
                                        {c.organizationId &&
                                        typeof c.organizationId === "object"
                                            ? c.organizationId.name
                                            : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={VERIFICATION_STATUS_TONE[c.status]}>
                                            {VERIFICATION_STATUS_LABEL[c.status]}
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

export default CompanyListPage;
