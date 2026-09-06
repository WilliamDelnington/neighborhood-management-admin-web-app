import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
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
import { usePermission } from "@store/authStore";
import {
    VERIFICATION_STATUS_LABEL,
    VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, Business, BusinessType, House, VerificationStatus } from "@dts";
import { createBusiness, fetchBusinesses } from "@service/businessApi";
import { fetchBusinessTypes } from "@service/businessTypeApi";
import BusinessForm, {
    EMPTY_BUSINESS_FORM,
    BusinessFormValues,
    isBusinessFormValid,
    toBusinessInput,
} from "../Houses/BusinessForm";
import BusinessImportSheet from "./BusinessImportSheet";

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
    const canCreate = usePermission("businesses.create");
    // Rieng cho nut "Nhap tu Excel" - backend gate qua "imports.manage", khac
    // voi "businesses.create" - xem ghi chu tuong tu o HouseListPage.tsx.
    const canImport = usePermission("imports.manage");

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

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<BusinessFormValues>(EMPTY_BUSINESS_FORM);
    const [createHouseId, setCreateHouseId] = useState("");
    const [createHouseLabel, setCreateHouseLabel] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [importVisible, setImportVisible] = useState(false);

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

    const openCreate = () => {
        setForm(EMPTY_BUSINESS_FORM);
        setCreateHouseId("");
        setCreateHouseLabel("");
        setCreateVisible(true);
    };

    const handleCreate = async () => {
        if (!createHouseId) {
            toast.error("Vui lòng chọn nhà số");
            return;
        }
        if (!isBusinessFormValid(form)) {
            toast.error("Vui lòng nhập tên hộ kinh doanh");
            return;
        }
        try {
            setSubmitting(true);
            await createBusiness(toBusinessInput(form, createHouseId));
            toast.success("Đã thêm hộ kinh doanh mới");
            setCreateVisible(false);
            load(1, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Hộ kinh doanh"
                description="Quản lý hộ kinh doanh đăng ký hoạt động trên địa bàn."
                action={
                    (canCreate || canImport) && (
                        <div className="flex gap-2">
                            {canImport && (
                                <Button
                                    variant="outline"
                                    onClick={() => setImportVisible(true)}
                                >
                                    <UploadCloud className="mr-1 h-4 w-4" />
                                    Nhập từ Excel
                                </Button>
                            )}
                            {canCreate && (
                                <Button onClick={openCreate}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm hộ kinh doanh
                                </Button>
                            )}
                        </div>
                    )
                }
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

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
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
                                <TableHead className="text-right">Thao tác</TableHead>
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
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                navigate(
                                                    `/houses/${houseIdOf(b)}/businesses/${b._id}`,
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

            <Sheet open={createVisible} onOpenChange={setCreateVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Thêm hộ kinh doanh</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <BusinessForm
                            values={form}
                            onChange={setForm}
                            housePicker={{
                                value: createHouseId,
                                valueLabel: createHouseLabel,
                                onChange: (houseId, house: House) => {
                                    setCreateHouseId(houseId);
                                    setCreateHouseLabel(
                                        `${house.code} — ${house.address}`,
                                    );
                                },
                            }}
                        />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleCreate}
                        >
                            Lưu hộ kinh doanh
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <BusinessImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />
        </div>
    );
};

export default BusinessListPage;
