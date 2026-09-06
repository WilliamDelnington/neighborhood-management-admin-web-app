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
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import {
    LOAI_SO_HUU_LABEL,
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Household, VerificationStatus } from "@dts";
import { fetchHouseholds } from "@service/householdApi";

const ALL_STATUS = "all";
const ALL_ASSIGNMENT = "all";
const UNASSIGNED = "unassigned";

const HouseholdListPage: React.FC = () => (
    <AdminGuard permissions={["households.read"]}>
        <HouseholdListContent />
    </AdminGuard>
);

const houseLabelOf = (h: Household): string => {
    if (!h.houseId) return "Chưa gán";
    return typeof h.houseId === "string" ? h.houseId : `${h.houseId.code} — ${h.houseId.address}`;
};

const HouseholdListContent: React.FC = () => {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<VerificationStatus | "">("");
    const [assignment, setAssignment] = useState<"" | typeof UNASSIGNED>("");
    const [items, setItems] = useState<Household[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchHouseholds({
            page: targetPage,
            limit: size,
            search: keyword,
            unassigned: assignment === UNASSIGNED ? true : undefined,
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
    }, [search, status, assignment]);

    return (
        <div>
            <PageHeader
                title="Hộ dân"
                description="Xem danh sách các hộ dân đang sinh sống trên địa bàn."
            />

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
                        placeholder="Tìm theo mã hộ, chủ hộ, địa chỉ..."
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
                    value={assignment || ALL_ASSIGNMENT}
                    onValueChange={v =>
                        setAssignment(v === ALL_ASSIGNMENT ? "" : (v as typeof UNASSIGNED))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_ASSIGNMENT}>
                            Tất cả (đã gán và chưa gán nhà)
                        </SelectItem>
                        <SelectItem value={UNASSIGNED}>
                            Chưa gán nhà số
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có hộ dân nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã hộ</TableHead>
                                <TableHead>Chủ hộ</TableHead>
                                <TableHead>Cụm dân cư</TableHead>
                                <TableHead>Nhà số</TableHead>
                                <TableHead>Hình thức sở hữu</TableHead>
                                <TableHead>Số nhân khẩu</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((h, index) => (
                                <TableRow
                                    key={h._id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/households/${h._id}`)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {h.code}
                                    </TableCell>
                                    <TableCell>{h.headOfHousehold}</TableCell>
                                    <TableCell>{h.cluster}</TableCell>
                                    <TableCell>{houseLabelOf(h)}</TableCell>
                                    <TableCell>
                                        {LOAI_SO_HUU_LABEL[h.ownershipType]}
                                    </TableCell>
                                    <TableCell>{h.memberCount}</TableCell>
                                    <TableCell>
                                        <Badge tone={VERIFICATION_STATUS_TONE[h.status]}>
                                            {VERIFICATION_STATUS_LABEL[h.status]}
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

export default HouseholdListPage;
