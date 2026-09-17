import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
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
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { AppError, PasswordResetRequest, TrangThaiYeuCauDatLaiMatKhau } from "@dts";
import {
    ROLE_LABEL,
    TRANG_THAI_YEU_CAU_DAT_LAI_MAT_KHAU_LABEL,
    TRANG_THAI_YEU_CAU_DAT_LAI_MAT_KHAU_TONE,
} from "@constants/domain";
import {
    fetchPasswordResetRequests,
    resetPasswordResetRequestPassword,
    updatePasswordResetRequestStatus,
} from "@service/passwordResetRequestApi";

const ALL_STATUS = "all";

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const PasswordResetRequestListPage: React.FC = () => (
    <AdminGuard permissions={["users.reset_password"]}>
        <PasswordResetRequestListContent />
    </AdminGuard>
);

const PasswordResetRequestListContent: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState<TrangThaiYeuCauDatLaiMatKhau | "">(
        (searchParams.get("status") as TrangThaiYeuCauDatLaiMatKhau | null) ||
            "",
    );
    const [search, setSearch] = useState("");

    const [items, setItems] = useState<PasswordResetRequest[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [resettingId, setResettingId] = useState<string | null>(null);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchPasswordResetRequests({
            page: targetPage,
            limit: size,
            status: status || undefined,
            search: search || undefined,
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
    }, [search, status]);

    const handleStatusFilterChange = (value: string) => {
        const next = (value === ALL_STATUS ? "" : value) as
            | TrangThaiYeuCauDatLaiMatKhau
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

    const handleRowStatusChange = async (
        id: string,
        next: TrangThaiYeuCauDatLaiMatKhau,
    ) => {
        try {
            setUpdatingId(id);
            const updated = await updatePasswordResetRequestStatus(id, next);
            setItems(prev =>
                prev.map(item => (item._id === id ? updated : item)),
            );
            toast.success("Đã cập nhật trạng thái");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleResetPassword = async (item: PasswordResetRequest) => {
        try {
            setResettingId(item._id);
            const { request } = await resetPasswordResetRequestPassword(
                item._id,
            );
            setItems(prev =>
                prev.map(i => (i._id === item._id ? request : i)),
            );
            toast.success(
                "Đã đặt lại mật khẩu. Người dùng có thể tự lấy mật khẩu mới bằng cách nhập lại số điện thoại ở màn hình đăng nhập.",
            );
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setResettingId(null);
        }
    };

    return (
        <div>
            <PageHeader
                title="Yêu cầu đặt lại mật khẩu"
                description="Yêu cầu hỗ trợ đặt lại mật khẩu từ người dùng không đăng nhập được (gửi từ màn hình đăng nhập, không qua tài khoản). Xác minh danh tính qua số điện thoại/tài khoản khớp rồi bấm Đặt lại mật khẩu - hệ thống tự sinh mật khẩu mới, người dùng có thể tự lấy lại bằng cách nhập lại số điện thoại ở màn đăng nhập."
            />

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
                        placeholder="Tìm theo số điện thoại..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={status || ALL_STATUS}
                    onValueChange={handleStatusFilterChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_STATUS}>
                            Tất cả trạng thái
                        </SelectItem>
                        {(
                            Object.entries(
                                TRANG_THAI_YEU_CAU_DAT_LAI_MAT_KHAU_LABEL,
                            ) as [TrangThaiYeuCauDatLaiMatKhau, string][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FilterBar>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có yêu cầu đặt lại mật khẩu nào phù hợp" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Số điện thoại</TableHead>
                                <TableHead>Tài khoản khớp</TableHead>
                                <TableHead>Ghi chú</TableHead>
                                <TableHead>Gửi lúc</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item._id}>
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.phone}
                                    </TableCell>
                                    <TableCell>
                                        {item.matchedUser ? (
                                            <div>
                                                <div>
                                                    {
                                                        item.matchedUser
                                                            .displayName
                                                    }
                                                </div>
                                                <div className="text-xs text-text_2">
                                                    {item.matchedUser.roles
                                                        .map(
                                                            r =>
                                                                ROLE_LABEL[r] ||
                                                                r,
                                                        )
                                                        .join(", ")}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text_2">
                                                Không tìm thấy tài khoản
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[240px] whitespace-pre-line text-sm">
                                        {item.note || "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-text_2">
                                        {formatDateTime(item.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                tone={
                                                    TRANG_THAI_YEU_CAU_DAT_LAI_MAT_KHAU_TONE[
                                                        item.status
                                                    ]
                                                }
                                            >
                                                {
                                                    TRANG_THAI_YEU_CAU_DAT_LAI_MAT_KHAU_LABEL[
                                                        item.status
                                                    ]
                                                }
                                            </Badge>
                                            <Select
                                                value={item.status}
                                                disabled={
                                                    updatingId === item._id
                                                }
                                                onValueChange={v =>
                                                    handleRowStatusChange(
                                                        item._id,
                                                        v as TrangThaiYeuCauDatLaiMatKhau,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-[150px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(
                                                        Object.entries(
                                                            TRANG_THAI_YEU_CAU_DAT_LAI_MAT_KHAU_LABEL,
                                                        ) as [
                                                            TrangThaiYeuCauDatLaiMatKhau,
                                                            string,
                                                        ][]
                                                    ).map(([key, label]) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={key}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status !== "dong" && (
                                            <Button
                                                size="sm"
                                                disabled={
                                                    !item.matchedUser ||
                                                    resettingId === item._id
                                                }
                                                loading={
                                                    resettingId === item._id
                                                }
                                                onClick={() =>
                                                    handleResetPassword(item)
                                                }
                                            >
                                                Đặt lại mật khẩu
                                            </Button>
                                        )}
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
        </div>
    );
};

export default PasswordResetRequestListPage;
