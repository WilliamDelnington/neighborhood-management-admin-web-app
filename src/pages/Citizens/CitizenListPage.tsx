import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
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
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, Citizen } from "@dts";
import { createCitizen, fetchCitizens } from "@service/citizenApi";
import CitizenForm, {
    EMPTY_CITIZEN_FORM,
    CitizenFormValues,
    isCitizenFormValid,
    toCitizenInput,
} from "./CitizenForm";
import CitizenImportSheet from "./CitizenImportSheet";

const CitizenListPage: React.FC = () => (
    <AdminGuard permissions={["citizens.read"]}>
        <CitizenListContent />
    </AdminGuard>
);

const householdLabelOf = (householdId: Citizen["householdId"]): string => {
    if (!householdId) return "—";
    return typeof householdId === "string"
        ? householdId
        : `${householdId.code} — ${householdId.address}`;
};

const householdHrefOf = (householdId: Citizen["householdId"]): string | null => {
    if (!householdId || typeof householdId === "string") return null;
    return `/households/${householdId._id}`;
};

const CitizenListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("citizens.create");
    // Rieng cho nut "Nhap tu Excel" - backend gate qua "imports.manage" (xem
    // /api/import/citizens), khac voi "citizens.create" - phai kiem tra rieng
    // giong HouseListPage.
    const canImport = usePermission("imports.manage");

    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Citizen[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState<CitizenFormValues>(EMPTY_CITIZEN_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [importVisible, setImportVisible] = useState(false);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchCitizens({ page: targetPage, limit: size, search: keyword })
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
    }, [search]);

    const openCreate = () => {
        setForm(EMPTY_CITIZEN_FORM);
        setCreateVisible(true);
    };

    const handleCreate = async () => {
        if (!isCitizenFormValid(form)) {
            toast.error("Vui lòng nhập họ tên và chọn hộ dân");
            return;
        }
        try {
            setSubmitting(true);
            await createCitizen(toCitizenInput(form));
            toast.success("Đã thêm nhân khẩu mới");
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
                title="Nhân khẩu"
                description="Xem danh sách nhân khẩu thuộc các hộ dân trên địa bàn."
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
                                    Thêm nhân khẩu
                                </Button>
                            )}
                        </div>
                    )
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, search, size);
                    }}
                />
                <Input
                    className="max-w-sm"
                    placeholder="Tìm theo họ tên, CCCD, số điện thoại..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có nhân khẩu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>SĐT</TableHead>
                                <TableHead>CCCD</TableHead>
                                <TableHead>Giới tính</TableHead>
                                <TableHead>Hộ dân</TableHead>
                                <TableHead>Quan hệ với chủ hộ</TableHead>
                                <TableHead>Loại cư trú</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((c, index) => {
                                const href = householdHrefOf(c.householdId);
                                return (
                                    <TableRow
                                        key={c._id}
                                        className={href ? "cursor-pointer" : undefined}
                                        onClick={() => href && navigate(href)}
                                    >
                                        <TableCell className="text-center text-text_2">
                                            {(page - 1) * pageSize + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {c.fullName}
                                        </TableCell>
                                        <TableCell>{c.phone || "—"}</TableCell>
                                        <TableCell>{c.cccd || "—"}</TableCell>
                                        <TableCell>
                                            {GIOI_TINH_LABEL[c.gender]}
                                        </TableCell>
                                        <TableCell>
                                            {householdLabelOf(c.householdId)}
                                        </TableCell>
                                        <TableCell>
                                            {c.relationToHead || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge tone={c.residenceType === "thuong_tru" ? "green" : "gray"}>
                                                {LOAI_CU_TRU_LABEL[c.residenceType]}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
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
                        <SheetTitle>Thêm nhân khẩu</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <CitizenForm values={form} onChange={setForm} />
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleCreate}
                        >
                            Lưu nhân khẩu
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <CitizenImportSheet
                open={importVisible}
                onOpenChange={setImportVisible}
                onImported={() => load(1, search)}
            />
        </div>
    );
};

export default CitizenListPage;
