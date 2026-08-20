import React, { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
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
import SendRequestSheet from "@components/admin/SendRequestSheet";
import RequestDetailSheet from "./RequestDetailSheet";
import { usePermission } from "@store/authStore";
import { AppError, MyRequestItem, RequestItem, RequestStatus, RequestType } from "@dts";
import {
    REQUEST_PRIORITY_LABEL,
    REQUEST_PRIORITY_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
} from "@constants/domain";
import {
    fetchMyRequests,
    fetchRequests,
    updateMyRequestStatus,
} from "@service/requestApi";
import { DEFAULT_PAGE_SIZE } from "@constants/common";

const ALL_TYPES = "all";
const ALL = "all";

const houseText = (h: RequestItem["houseId"] | MyRequestItem["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const creatorText = (c: RequestItem["createdBy"] | MyRequestItem["createdBy"]) => {
    if (!c) return "Hệ thống";
    if (typeof c === "string") return c;
    return c.displayName;
};

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

type RequestView = "sent" | "assigned" | "all";

/**
 * "Yêu cầu công việc" (Đã gửi) + "Yêu cầu của tôi" (Được giao) gop lam mot
 * trang, 2 tab, giong cach da lam voi Van ban o nhom Truyen thong
 * (CorrespondenceListPage.tsx: 1 trang, 1 permission, tab dieu khien view goi
 * len backend). Route "/requests/my" (con giu lai cho cac lien ket cu tu
 * Dashboard) mac dinh mo tab "Duoc giao"; "/requests" mac dinh mo tab "Da gui".
 *
 * Tab "Tất cả" (them moi): chi hien voi nguoi co quyen "requests.update" HOAC
 * "requests.read_all" - ca hai deu duoc requestService.listRequests coi la
 * canManageAll (xem comment trong ham do). Tach rieng requests.read_all
 * (chi xem) khoi requests.update (xem VA duoc sua/huy yeu cau cua nguoi
 * khac) de co the cap quyen "xem toan bo" cho bi thu/can bo UBND ma khong
 * vo tinh cap luon quyen sua/huy yeu cau cua nguoi khac.
 */
const RequestListPage: React.FC = () => (
    <AdminGuard permissions={["dashboard.read"]}>
        <RequestListContent />
    </AdminGuard>
);

const RequestListContent: React.FC = () => {
    const location = useLocation();
    const canUpdateAll = usePermission("requests.update");
    const canReadAll = usePermission("requests.read_all");
    const canViewAll = canUpdateAll || canReadAll;
    const [view, setView] = useState<RequestView>(
        location.pathname === "/requests/my" ? "assigned" : "sent",
    );

    return (
        <div>
            <h1 className="mb-4 text-lg font-semibold">Yêu cầu công việc</h1>
            <Tabs
                className="mb-4"
                value={view}
                onValueChange={value => setView(value as RequestView)}
            >
                <TabsList>
                    <TabsTrigger value="sent">Đã gửi</TabsTrigger>
                    <TabsTrigger value="assigned">Được giao</TabsTrigger>
                    {canViewAll && (
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                    )}
                </TabsList>
            </Tabs>
            {view === "sent" && <SentRequestsTab />}
            {view === "assigned" && <AssignedRequestsTab />}
            {view === "all" && canViewAll && <AllRequestsTab />}
        </div>
    );
};

/**
 * Tab "Đã gửi" - noi dung cu cua RequestListPage (goc): yeu cau do CHINH minh
 * tao (fetchRequests({view:"sent"}) - backend loc theo createdBy=actor bat ke
 * vai tro quan ly, xem requestService.listRequests).
 */
const SentRequestsTab: React.FC = () => {
    const canCreate = usePermission("requests.create");

    const [type, setType] = useState<RequestType | "">("");
    const [items, setItems] = useState<RequestItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const requestId = searchParams.get("requestId");
        if (requestId) setDetailId(requestId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const closeDetail = (open: boolean) => {
        if (open) return;
        setDetailId(null);
        if (searchParams.get("requestId")) {
            searchParams.delete("requestId");
            setSearchParams(searchParams, { replace: true });
        }
    };

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchRequests({ page: targetPage, limit: size, type: type || undefined, view: "sent" })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    return (
        <div>
            <div className="mb-4 flex items-center justify-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
                {canCreate && (
                    <Button onClick={() => setFormOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Tạo yêu cầu
                    </Button>
                )}
            </div>

            <Select
                value={type || ALL_TYPES}
                onValueChange={v =>
                    setType(v === ALL_TYPES ? "" : (v as RequestType))
                }
            >
                <SelectTrigger className="mb-4 max-w-xs">
                    <SelectValue placeholder="Lọc theo loại yêu cầu" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_TYPES}>Tất cả loại yêu cầu</SelectItem>
                    {(Object.entries(REQUEST_TYPE_LABEL) as [RequestType, string][]).map(
                        ([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ),
                    )}
                </SelectContent>
            </Select>

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có yêu cầu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Người nhận</TableHead>
                                <TableHead>Hạn xử lý</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((r, index) => (
                                <TableRow
                                    key={r._id}
                                    className="cursor-pointer"
                                    onClick={() => setDetailId(r._id)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {r.title}
                                    </TableCell>
                                    <TableCell>
                                        {r.formDefinitionSnapshot?.name ||
                                            REQUEST_TYPE_LABEL[r.type] ||
                                            r.type}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                REQUEST_PRIORITY_TONE[
                                                    r.priority
                                                ]
                                            }
                                        >
                                            {
                                                REQUEST_PRIORITY_LABEL[
                                                    r.priority
                                                ]
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{houseText(r.houseId)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {r.recipients.map(rec => (
                                                <Badge
                                                    key={rec._id}
                                                    tone={
                                                        rec.isOverdue
                                                            ? "red"
                                                            : REQUEST_STATUS_TONE[
                                                                  rec.status
                                                              ]
                                                    }
                                                    title={
                                                        REQUEST_STATUS_LABEL[
                                                            rec.status
                                                        ]
                                                    }
                                                >
                                                    {rec.displayName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(r.dueDate)}</TableCell>
                                    <TableCell>{creatorText(r.createdBy)}</TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <Link
                                            to={`/requests/${r._id}/history`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Lịch sử
                                        </Link>
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

            <SendRequestSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                onCreated={() => load(1)}
            />

            <RequestDetailSheet
                requestId={detailId}
                onOpenChange={closeDetail}
                onUpdated={() => load(page)}
            />
        </div>
    );
};

/**
 * Tab "Tất cả" - chi render khi RequestListContent da kiem tra canViewAll
 * (requests.update). Cau truc bang giong het SentRequestsTab (đã bao gồm cột
 * "Người gửi" và badge trạng thái theo từng người nhận), chỉ khác ở nguồn dữ
 * liệu: goi fetchRequests KHONG truyen view, nen backend tra ve TOAN BO yeu
 * cau (khong loc theo createdBy/recipient) cho nguoi co quyen quan ly.
 */
const AllRequestsTab: React.FC = () => {
    const [type, setType] = useState<RequestType | "">("");
    const [items, setItems] = useState<RequestItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchRequests({ page: targetPage, limit: size, type: type || undefined })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Select
                    value={type || ALL_TYPES}
                    onValueChange={v =>
                        setType(v === ALL_TYPES ? "" : (v as RequestType))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_TYPES}>Tất cả loại yêu cầu</SelectItem>
                        {(Object.entries(REQUEST_TYPE_LABEL) as [RequestType, string][]).map(
                            ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ),
                        )}
                    </SelectContent>
                </Select>
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có yêu cầu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Người nhận</TableHead>
                                <TableHead>Hạn xử lý</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((r, index) => (
                                <TableRow
                                    key={r._id}
                                    className="cursor-pointer"
                                    onClick={() => setDetailId(r._id)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {r.title}
                                    </TableCell>
                                    <TableCell>
                                        {r.formDefinitionSnapshot?.name ||
                                            REQUEST_TYPE_LABEL[r.type] ||
                                            r.type}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                REQUEST_PRIORITY_TONE[
                                                    r.priority
                                                ]
                                            }
                                        >
                                            {
                                                REQUEST_PRIORITY_LABEL[
                                                    r.priority
                                                ]
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{houseText(r.houseId)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {r.recipients.map(rec => (
                                                <Badge
                                                    key={rec._id}
                                                    tone={
                                                        rec.isOverdue
                                                            ? "red"
                                                            : REQUEST_STATUS_TONE[
                                                                  rec.status
                                                              ]
                                                    }
                                                    title={
                                                        REQUEST_STATUS_LABEL[
                                                            rec.status
                                                        ]
                                                    }
                                                >
                                                    {rec.displayName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(r.dueDate)}</TableCell>
                                    <TableCell>{creatorText(r.createdBy)}</TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <Link
                                            to={`/requests/${r._id}/history`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Lịch sử
                                        </Link>
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

            <RequestDetailSheet
                requestId={detailId}
                onOpenChange={open => !open && setDetailId(null)}
                onUpdated={() => load(page)}
            />
        </div>
    );
};

/**
 * Tab "Được giao" - noi dung cu cua MyRequestsPage: yeu cau ma CHINH minh la
 * nguoi nhan (fetchMyRequests, khong doi API/permission - van mo cho bat ky
 * nhan vien nao, khong rieng ai co requests.read).
 */
const AssignedRequestsTab: React.FC = () => {
    const [status, setStatus] = useState<RequestStatus | "">("");
    const [type, setType] = useState<RequestType | "">("");
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [items, setItems] = useState<MyRequestItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [needsInfoTarget, setNeedsInfoTarget] = useState<MyRequestItem | null>(
        null,
    );
    const [needsInfoNote, setNeedsInfoNote] = useState("");
    const [detailRequestId, setDetailRequestId] = useState<string | null>(
        null,
    );
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const requestId = searchParams.get("requestId");
        if (requestId) setDetailRequestId(requestId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const closeDetail = (open: boolean) => {
        if (open) return;
        setDetailRequestId(null);
        if (searchParams.get("requestId")) {
            searchParams.delete("requestId");
            setSearchParams(searchParams, { replace: true });
        }
    };

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchMyRequests({
            page: targetPage,
            limit: size,
            status: status || undefined,
            type: type || undefined,
            overdueOnly: overdueOnly || undefined,
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
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, type, overdueOnly]);

    const handleStatusChange = async (
        item: MyRequestItem,
        nextStatus: RequestStatus,
        note?: string,
    ) => {
        try {
            setUpdatingId(item.requestId);
            await updateMyRequestStatus(item.requestId, {
                status: nextStatus,
                note,
            });
            toast.success("Đã cập nhật trạng thái");
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUpdatingId(null);
        }
    };

    const openNeedsInfoDialog = (item: MyRequestItem) => {
        setNeedsInfoNote("");
        setNeedsInfoTarget(item);
    };

    const confirmNeedsInfo = async () => {
        if (!needsInfoTarget) return;
        if (!needsInfoNote.trim()) {
            toast.error("Vui lòng mô tả thông tin cần bổ sung");
            return;
        }
        await handleStatusChange(needsInfoTarget, "needs_info", needsInfoNote.trim());
        setNeedsInfoTarget(null);
    };

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select
                    value={status || ALL}
                    onValueChange={v =>
                        setStatus(v === ALL ? "" : (v as RequestStatus))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
                        {(
                            Object.entries(REQUEST_STATUS_LABEL) as [
                                RequestStatus,
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
                    value={type || ALL}
                    onValueChange={v =>
                        setType(v === ALL ? "" : (v as RequestType))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tất cả loại yêu cầu</SelectItem>
                        {(
                            Object.entries(REQUEST_TYPE_LABEL) as [
                                RequestType,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                        checked={overdueOnly}
                        onCheckedChange={c => setOverdueOnly(!!c)}
                    />
                    <Label className="cursor-pointer">Chỉ hiện quá hạn</Label>
                </label>

                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có yêu cầu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Hạn xử lý</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => {
                                const busy = updatingId === item.requestId;
                                return (
                                    <TableRow
                                        key={item._id}
                                        className="cursor-pointer"
                                        onClick={() =>
                                            setDetailRequestId(item.requestId)
                                        }
                                    >
                                        <TableCell className="text-center text-text_2">
                                            {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.title}
                                        </TableCell>
                                        <TableCell>
                                            {item.formDefinitionSnapshot?.name ||
                                                REQUEST_TYPE_LABEL[item.type] ||
                                                item.type}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                tone={
                                                    REQUEST_PRIORITY_TONE[
                                                        item.priority
                                                    ]
                                                }
                                            >
                                                {
                                                    REQUEST_PRIORITY_LABEL[
                                                        item.priority
                                                    ]
                                                }
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {houseText(item.houseId)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {formatDate(item.dueDate)}
                                                {item.isOverdue && (
                                                    <Badge tone="red">
                                                        Quá hạn
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {creatorText(item.createdBy)}
                                        </TableCell>
                                        <TableCell
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex flex-col items-start gap-1.5">
                                                <Badge
                                                    tone={
                                                        item.isOverdue
                                                            ? "red"
                                                            : REQUEST_STATUS_TONE[
                                                                  item.status
                                                              ]
                                                    }
                                                >
                                                    {
                                                        REQUEST_STATUS_LABEL[
                                                            item.status
                                                        ]
                                                    }
                                                </Badge>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.status ===
                                                        "pending" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    item,
                                                                    "acknowledged",
                                                                )
                                                            }
                                                        >
                                                            Tiếp nhận
                                                        </Button>
                                                    )}
                                                    {item.status ===
                                                        "acknowledged" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    item,
                                                                    "in_progress",
                                                                )
                                                            }
                                                        >
                                                            Bắt đầu xử lý
                                                        </Button>
                                                    )}
                                                    {item.status ===
                                                        "in_progress" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    openNeedsInfoDialog(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                Cần bổ sung
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        item,
                                                                        "awaiting_confirmation",
                                                                    )
                                                                }
                                                            >
                                                                Báo hoàn thành
                                                            </Button>
                                                        </>
                                                    )}
                                                    {item.status ===
                                                        "needs_info" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    item,
                                                                    "in_progress",
                                                                )
                                                            }
                                                        >
                                                            Tiếp tục xử lý
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setDetailRequestId(
                                                        item.requestId,
                                                    )
                                                }
                                            >
                                                Chi tiết
                                            </Button>
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}

            <Dialog
                open={!!needsInfoTarget}
                onOpenChange={open => !open && setNeedsInfoTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yêu cầu bổ sung thông tin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label>Bạn cần bổ sung thông tin gì? (bắt buộc)</Label>
                        <Textarea
                            value={needsInfoNote}
                            onChange={e => setNeedsInfoNote(e.target.value)}
                            placeholder="Mô tả cụ thể thông tin bạn cần người giao yêu cầu bổ sung"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setNeedsInfoTarget(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={updatingId === needsInfoTarget?.requestId}
                            onClick={confirmNeedsInfo}
                        >
                            Gửi yêu cầu bổ sung
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RequestDetailSheet
                requestId={detailRequestId}
                onOpenChange={closeDetail}
                onUpdated={() => load(page)}
            />
        </div>
    );
};

export default RequestListPage;
