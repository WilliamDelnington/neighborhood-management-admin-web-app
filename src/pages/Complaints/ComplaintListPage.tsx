import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import FilterBar from "@components/admin/FilterBar";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    AppError,
    Complaint,
    ComplaintTypeDefinition,
    Neighborhood,
    NhomPhanAnh,
    TrangThaiPhanAnh,
} from "@dts";
import {
    NHOM_PHAN_ANH_LABEL,
    ROLE_LABEL,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import { createComplaint, fetchComplaints } from "@service/complaintApi";
import { fetchComplaintTypeDefinitions } from "@service/complaintTypeApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { usePermission, useAuthStore } from "@store/authStore";

const ALL_STATUS = "all";
const ALL_CATEGORY = "all";
const ALL_NEIGHBORHOOD = "all";
const BOOTSTRAP_NHOM_PHAN_ANH = Object.keys(NHOM_PHAN_ANH_LABEL) as NhomPhanAnh[];

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const ComplaintListPage: React.FC = () => (
    <AdminGuard permissions={["complaints.read"]}>
        <ComplaintListContent />
    </AdminGuard>
);

const ComplaintListContent: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentUserRoles = useAuthStore(state => state.user?.roles) || [];
    const canCreateComplaint = usePermission("complaints.create");
    // To truong/To pho co 2 goc nhin rieng biet - xem ghi chu o
    // listComplaints (backend): "Nhận từ cư dân" (mac dinh) khong gom cac de
    // xuat chinh ho/dong nghiep da gui len Phuong, "Đã gửi" chi gom cac de
    // xuat do. Vai tro khac khong co tab nay (xem gia tri view co dinh).
    const isNeighborhoodTier =
        currentUserRoles.includes("neighborhood_leader") ||
        currentUserRoles.includes("neighborhood_coleader");
    const [view, setView] = useState<"received" | "sent">("received");

    // Danh sach day du (ke ca da ngung dung) - dung de hien nhan cho cac
    // phan anh cu, tranh hien key tho/trong neu loai da bi ngung dung sau khi
    // phan anh duoc tao.
    const [complaintTypes, setComplaintTypes] = useState<
        ComplaintTypeDefinition[]
    >([]);
    useEffect(() => {
        fetchComplaintTypeDefinitions({ limit: 200 })
            .then(res => setComplaintTypes(res.items))
            .catch(() => {
                /* giu fallback tinh (NHOM_PHAN_ANH_LABEL) neu goi API loi */
            });
    }, []);

    const labelByCategory = (key: NhomPhanAnh) =>
        complaintTypes.find(t => t.key === key)?.name ||
        NHOM_PHAN_ANH_LABEL[key] ||
        key;

    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    useEffect(() => {
        fetchNeighborhoods({ limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => {
                /* Khong co quyen neighborhoods.read - an bo loc, khong chan trang */
            });
    }, []);

    // "Gửi đến": nguoi phu trach cu the (assigneeId) neu da tiep nhan, neu
    // chua thi roi ve danh sach vai tro nguoi nhan cua danh muc
    // (ComplaintTypeDefinition.allowedReceiverRoles) - cho biet phan anh se
    // toi tay ai ke ca khi chua co ai bam "Tiếp nhận".
    const sentToOf = (c: Complaint): string => {
        if (c.assigneeId && typeof c.assigneeId !== "string") {
            return c.assigneeId.displayName;
        }
        const roles =
            complaintTypes.find(t => t.key === c.category)
                ?.allowedReceiverRoles || [];
        if (roles.length === 0) return "Chưa xác định";
        return roles.map(role => ROLE_LABEL[role] || role).join(", ");
    };

    const neighborhoodNameOf = (
        neighborhoodId: Complaint["neighborhoodId"],
    ): string => {
        if (!neighborhoodId) return "Chưa xác định";
        if (typeof neighborhoodId !== "string") return neighborhoodId.name;
        return (
            neighborhoods.find(n => n._id === neighborhoodId)?.name ||
            "Chưa xác định"
        );
    };

    const activeCategoryOptions = complaintTypes.length
        ? complaintTypes
              .filter(t => t.active !== false)
              .map(t => t.key)
        : BOOTSTRAP_NHOM_PHAN_ANH;

    const [status, setStatus] = useState<TrangThaiPhanAnh | "">(
        (searchParams.get("status") as TrangThaiPhanAnh | null) || "",
    );
    const [category, setCategory] = useState<NhomPhanAnh | "">(
        (searchParams.get("category") as NhomPhanAnh | null) || "",
    );
    const [neighborhoodId, setNeighborhoodId] = useState(
        searchParams.get("neighborhoodId") || "",
    );
    const [search, setSearch] = useState("");
    const relatedAssetId = searchParams.get("relatedAssetId") || undefined;

    const [items, setItems] = useState<Complaint[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchComplaints({
            page: targetPage,
            limit: size,
            status: status || undefined,
            category: category || undefined,
            search: search || undefined,
            relatedAssetId,
            neighborhoodId: neighborhoodId || undefined,
            view:
                isNeighborhoodTier && view === "sent" ? "sent" : undefined,
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
        const timer = setTimeout(() => load(1), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, category, neighborhoodId, view]);

    const handleStatusChange = (value: string) => {
        const next = (value === ALL_STATUS ? "" : value) as
            | TrangThaiPhanAnh
            | "";
        setStatus(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("status", next);
            } else {
                params.delete("status");
            }
            return params;
        });
    };

    const handleCategoryChange = (value: string) => {
        const next = (value === ALL_CATEGORY ? "" : value) as
            | NhomPhanAnh
            | "";
        setCategory(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("category", next);
            } else {
                params.delete("category");
            }
            return params;
        });
    };

    const handleNeighborhoodChange = (value: string) => {
        const next = value === ALL_NEIGHBORHOOD ? "" : value;
        setNeighborhoodId(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("neighborhoodId", next);
            } else {
                params.delete("neighborhoodId");
            }
            return params;
        });
    };

    // Danh muc actor DANG DANG NHAP duoc phep gui (vd To truong/To pho chi
    // thay danh muc "to_de_xuat_len_phuong") - loc theo allowedSenderRoles,
    // KHONG dung chung voi bo loc danh sach o tren (bo loc XEM, khac quyen GUI).
    const sendableCategories = complaintTypes.filter(
        t =>
            t.active !== false &&
            (t.allowedSenderRoles || []).some(role =>
                currentUserRoles.includes(role),
            ),
    );

    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [createCategory, setCreateCategory] = useState("");
    const [createTitle, setCreateTitle] = useState("");
    const [createContent, setCreateContent] = useState("");
    const [creatingComplaint, setCreatingComplaint] = useState(false);

    const openCreateSheet = () => {
        setCreateCategory(sendableCategories[0]?.key || "");
        setCreateTitle("");
        setCreateContent("");
        setCreateSheetOpen(true);
    };

    const isCreateFormValid =
        !!createCategory &&
        createTitle.trim().length >= 3 &&
        createContent.trim().length >= 10;

    const handleCreateComplaint = async () => {
        if (!isCreateFormValid) {
            toast.error(
                "Vui lòng chọn loại phản ánh, nhập tiêu đề (≥3 ký tự) và nội dung (≥10 ký tự)",
            );
            return;
        }
        try {
            setCreatingComplaint(true);
            await createComplaint({
                category: createCategory,
                title: createTitle.trim(),
                content: createContent.trim(),
            });
            toast.success("Đã gửi phản ánh");
            setCreateSheetOpen(false);
            load(1);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCreatingComplaint(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Phản ánh kiến nghị"
                description="Tiếp nhận và xử lý phản ánh, kiến nghị của cư dân."
                action={
                    canCreateComplaint &&
                    sendableCategories.length > 0 && (
                        <Button onClick={openCreateSheet}>
                            <Plus className="mr-1 h-4 w-4" />
                            Gửi phản ánh
                        </Button>
                    )
                }
            />

            {isNeighborhoodTier && (
                <Tabs
                    className="mb-4"
                    value={view}
                    onValueChange={value =>
                        setView(value as "received" | "sent")
                    }
                >
                    <TabsList>
                        <TabsTrigger value="received">
                            Nhận từ cư dân
                        </TabsTrigger>
                        <TabsTrigger value="sent">Đã gửi</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            <FilterBar>
                <div className="flex items-center gap-2">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, size);
                        }}
                    />
                    <Input
                        className="flex-1"
                        placeholder="Tìm theo mã phản ánh, tiêu đề..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={status || ALL_STATUS}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_STATUS}>
                            Tất cả trạng thái
                        </SelectItem>
                        {(
                            Object.entries(TRANG_THAI_PHAN_ANH_LABEL) as [
                                TrangThaiPhanAnh,
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
                    value={category || ALL_CATEGORY}
                    onValueChange={handleCategoryChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả nhóm" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_CATEGORY}>
                            Tất cả nhóm
                        </SelectItem>
                        {activeCategoryOptions.map(key => (
                            <SelectItem key={key} value={key}>
                                {labelByCategory(key)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={neighborhoodId || ALL_NEIGHBORHOOD}
                    onValueChange={handleNeighborhoodChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả tổ dân phố" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_NEIGHBORHOOD}>
                            Tất cả tổ dân phố
                        </SelectItem>
                        {neighborhoods.map(n => (
                            <SelectItem key={n._id} value={n._id}>
                                {n.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FilterBar>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có phản ánh nào phù hợp" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Thời gian gửi</TableHead>
                                <TableHead>Nhóm</TableHead>
                                <TableHead>Gửi đến</TableHead>
                                <TableHead>Tổ dân phố</TableHead>
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
                                        navigate(`/complaints/${c._id}`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {c.title}
                                    </TableCell>
                                    <TableCell className="text-text_2">
                                        {formatDateTime(c.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        {labelByCategory(c.category)}
                                    </TableCell>
                                    <TableCell className="text-text_2">
                                        {sentToOf(c)}
                                    </TableCell>
                                    <TableCell>
                                        {c.neighborhoodId ? (
                                            neighborhoodNameOf(
                                                c.neighborhoodId,
                                            )
                                        ) : (
                                            <Badge tone="red">
                                                Chưa xác định
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                TRANG_THAI_PHAN_ANH_TONE[
                                                    c.status
                                                ]
                                            }
                                        >
                                            {
                                                TRANG_THAI_PHAN_ANH_LABEL[
                                                    c.status
                                                ]
                                            }
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
                                                navigate(`/complaints/${c._id}`)
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}

            <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Gửi phản ánh</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        <div className="space-y-1.5">
                            <Label>Loại phản ánh</Label>
                            <Select
                                value={createCategory}
                                onValueChange={setCreateCategory}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại phản ánh" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sendableCategories.map(t => (
                                        <SelectItem key={t.key} value={t.key}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tiêu đề</Label>
                            <Input
                                value={createTitle}
                                onChange={e => setCreateTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                value={createContent}
                                onChange={e =>
                                    setCreateContent(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={creatingComplaint}
                            disabled={!isCreateFormValid}
                            onClick={handleCreateComplaint}
                        >
                            Gửi phản ánh
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default ComplaintListPage;
