import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import FilterBar from "@components/admin/FilterBar";
import FilterableSelect from "@components/admin/FilterableSelect";
import { AppError, Neighborhood, Role, RoleRecord, User } from "@dts";
import {
    NEIGHBORHOOD_ASSIGNABLE_ROLE_KEYS,
    ROLE_LABEL,
    USER_STATUS_LABEL,
    USER_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    createHouseOwner,
    CreatableStaffRole,
    fetchCreatableRoles,
    fetchUsers,
} from "@service/userApi";
import { fetchRoles } from "@service/roleApi";
import {
    assignNeighborhoodColeader,
    assignNeighborhoodLeader,
    fetchNeighborhoods,
} from "@service/neighborhoodApi";
import { usePermission } from "@store/authStore";

const NEIGHBORHOOD_LEADER_ROLE = "neighborhood_leader";
const NEIGHBORHOOD_COLEADER_ROLE = "neighborhood_coleader";
// 2 vai tro duoc phep chon truc tiep khi "Tạo tài khoản" ma con duoc gan vao
// mot To dan pho cu the ngay luc tao (xem handleCreateAccount) - Cong tac
// vien (neighborhood_collaborator) KHONG nam trong danh sach nay vi con can
// chon them pham vi con (STREET/HOUSE_GROUP/CAMPAIGN), phai thuc hien o
// trang chi tiet Tổ dân phố.
const NEIGHBORHOOD_LEADERSHIP_ROLES: Role[] = [
    NEIGHBORHOOD_LEADER_ROLE,
    NEIGHBORHOOD_COLEADER_ROLE,
];

type CreateAccountForm = {
    phone: string;
    displayName: string;
    address: string;
    idNumber: string;
    password: string;
    role: CreatableStaffRole;
    // Chi dung khi role la To truong/To pho (xem NEIGHBORHOOD_LEADERSHIP_ROLES) -
    // gan luon vao To dan pho nay ngay sau khi tao tai khoan thanh cong (xem
    // handleCreateAccount), thay vi phai vao rieng trang chi tiet Tổ dân phố.
    neighborhoodId: string;
    neighborhoodLabel: string;
};

const EMPTY_CREATE_FORM: CreateAccountForm = {
    phone: "",
    displayName: "",
    address: "",
    idNumber: "",
    password: "",
    role: "house_owner",
    neighborhoodId: "",
    neighborhoodLabel: "",
};

const UserListPage: React.FC = () => (
    <AdminGuard permissions={["users.read"]}>
        <UserListContent />
    </AdminGuard>
);

const UserListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreateAccount = usePermission("users.create");
    // to truong khong co roles.read - goi fetchRoles se luon 403. Danh sach
    // nay chi phuc vu bo loc theo vai tro + hien ten vai tro trong bang, nen
    // bo qua hoan toan thay vi goi roi bo ket qua qua .catch().
    const canReadRoles = usePermission("roles.read");
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<Role | "">("");
    const [items, setItems] = useState<User[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    // Vai tro duoc phep chon khi "Tạo tài khoản" - LUON goi tu backend
    // (fetchCreatableRoles, xem userService.getCreatableRolesForActor), KHONG
    // tu suy luan lai o client: phu thuoc permission dong (Role.
    // allowedCreatableRoles) cua CHINH actor dang dang nhap, khong chi admin
    // moi thay - vd neighborhood_leader duoc admin cap quyen tao them
    // social_cultral_leader se thay dung 2 lua chon (house_owner + vai tro do).
    const [creatableRoles, setCreatableRoles] = useState<
        { key: Role; name: string }[]
    >([]);
    const roleNameByKey = React.useMemo(
        () =>
            Object.fromEntries([
                // to truong khong co roles.read nen `roles` co the rong -
                // creatableRoles (chi doi hoi users.create) la nguon du phong
                // de van hien dung ten vai tro tuy chinh trong toast/goi y.
                ...creatableRoles.map(r => [r.key, r.name]),
                ...roles.map(r => [r.key, r.name]),
            ]),
        [roles, creatableRoles],
    );
    const roleLabel = (key: Role) => roleNameByKey[key] ?? ROLE_LABEL[key] ?? key;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateAccountForm>(EMPTY_CREATE_FORM);
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [lastCreatedPhone, setLastCreatedPhone] = useState<string | null>(null);
    // Vai tro/ten To dan pho cua lan tao gan nhat - dung rieng cho khoi thong
    // bao ket qua (KHONG doc tu createForm, da bi reset ve EMPTY_CREATE_FORM
    // ngay sau khi tao xong).
    const [lastCreatedRole, setLastCreatedRole] =
        useState<CreatableStaffRole | null>(null);
    const [lastCreatedNeighborhoodLabel, setLastCreatedNeighborhoodLabel] =
        useState<string | null>(null);
    // Danh sach To dan pho de chon khi tao tai khoan To truong/To pho (xem
    // NEIGHBORHOOD_LEADERSHIP_ROLES) - tai luc mo Sheet, khong phai luc doi
    // vai tro (danh sach nay khong phu thuoc vai tro duoc chon).
    const [createNeighborhoods, setCreateNeighborhoods] = useState<
        Neighborhood[]
    >([]);

    const load = (targetPage = 1, keyword = search, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchUsers(
            targetPage,
            size,
            keyword || undefined,
            role || undefined,
        )
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
                setTotal(res.total);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    const setCreateField = <K extends keyof CreateAccountForm>(
        key: K,
        value: CreateAccountForm[K],
    ) => setCreateForm(prev => ({ ...prev, [key]: value }));

    const openCreateSheet = () => {
        setCreateForm(EMPTY_CREATE_FORM);
        setLastCreatedPhone(null);
        setCreateSheetOpen(true);
        fetchNeighborhoods({ limit: 300, status: "ACTIVE" })
            .then(res => setCreateNeighborhoods(res.items))
            .catch(() => setCreateNeighborhoods([]));
    };

    const isCreateFormValid =
        createForm.phone.trim().length > 0 &&
        createForm.displayName.trim().length > 0 &&
        createForm.password.trim().length >= 6;

    const handleCreateAccount = async () => {
        if (!isCreateFormValid) {
            toast.error(
                "Vui lòng nhập đầy đủ số điện thoại, họ tên và mật khẩu (ít nhất 6 ký tự)",
            );
            return;
        }
        try {
            setCreatingAccount(true);
            const created = await createHouseOwner({
                phone: createForm.phone.trim(),
                displayName: createForm.displayName.trim(),
                address: createForm.address.trim() || undefined,
                idNumber: createForm.idNumber.trim() || undefined,
                role: createForm.role,
                password: createForm.password.trim(),
            });

            // Gan luon vao To dan pho neu vai tro la To truong/To pho VA da
            // chon To - tien ich, khong bat buoc (van co the bo qua va gan
            // sau qua trang chi tiet Tổ dân phố, xem khoi thong bao ben duoi).
            // That bai o buoc nay KHONG duoc coi la that bai tao tai khoan -
            // tai khoan da tao xong, chi rieng viec gan la chua thanh cong.
            let assignedNeighborhoodLabel: string | null = null;
            if (
                NEIGHBORHOOD_LEADERSHIP_ROLES.includes(createForm.role) &&
                createForm.neighborhoodId
            ) {
                try {
                    if (createForm.role === NEIGHBORHOOD_LEADER_ROLE) {
                        await assignNeighborhoodLeader(
                            createForm.neighborhoodId,
                            created.id,
                        );
                    } else {
                        await assignNeighborhoodColeader(
                            createForm.neighborhoodId,
                            created.id,
                        );
                    }
                    assignedNeighborhoodLabel = createForm.neighborhoodLabel;
                } catch (err) {
                    toast.error(
                        `Đã tạo tài khoản nhưng gán Tổ dân phố thất bại: ${(err as AppError).message}`,
                    );
                }
            }

            toast.success(`Đã tạo tài khoản ${roleLabel(createForm.role)} mới`);
            setLastCreatedPhone(createForm.phone.trim());
            setLastCreatedRole(createForm.role);
            setLastCreatedNeighborhoodLabel(assignedNeighborhoodLabel);
            setCreateForm(EMPTY_CREATE_FORM);
            load(page, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCreatingAccount(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, role]);

    useEffect(() => {
        if (!canReadRoles) return;
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canReadRoles]);

    useEffect(() => {
        if (!canCreateAccount) return;
        fetchCreatableRoles()
            .then(setCreatableRoles)
            .catch(() => setCreatableRoles([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canCreateAccount]);

    return (
        <div>
            <PageHeader
                title="Người dùng & vai trò"
                description="Quản lý tài khoản người dùng và vai trò được gán."
                action={
                    canCreateAccount && (
                        <Button onClick={openCreateSheet}>
                            <Plus className="mr-1 h-4 w-4" />
                            Tạo tài khoản
                        </Button>
                    )
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
                        placeholder="Tìm theo tên hoặc số điện thoại..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </FilterBar>

            <div className="mb-3 flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant={role === "" ? "default" : "outline"}
                    onClick={() => setRole("")}
                >
                    Tất cả
                </Button>
                {roles.map(r => (
                        <Button
                            key={r.key}
                            size="sm"
                            variant={role === r.key ? "default" : "outline"}
                            onClick={() => setRole(r.key)}
                        >
                            {r.name}
                        </Button>
                    ),
                )}
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">
                    {total} người dùng
                </div>
            )}

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không tìm thấy người dùng nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên/SĐT</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((u, index) => (
                                <TableRow
                                    key={u.id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/users/${u.id}`)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {u.displayName}
                                        {u.phone ? ` · ${u.phone}` : ""}
                                    </TableCell>
                                    <TableCell>
                                        {u.roles.map(roleLabel).join(", ")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={USER_STATUS_TONE[u.status]}>
                                            {USER_STATUS_LABEL[u.status]}
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
                                                navigate(`/users/${u.id}`)
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

            <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Tạo tài khoản</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-4">
                        {lastCreatedPhone && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                Đã tạo tài khoản với số điện thoại{" "}
                                <strong>{lastCreatedPhone}</strong>. Đăng nhập
                                trong Mini App bằng số điện thoại và mật khẩu
                                vừa đặt.
                                {lastCreatedNeighborhoodLabel ? (
                                    <>
                                        {" "}
                                        Đã gán làm{" "}
                                        {lastCreatedRole && roleLabel(lastCreatedRole)}{" "}
                                        của {lastCreatedNeighborhoodLabel}.
                                    </>
                                ) : (
                                    lastCreatedRole &&
                                    NEIGHBORHOOD_ASSIGNABLE_ROLE_KEYS.includes(
                                        lastCreatedRole,
                                    ) && (
                                        <>
                                            {" "}
                                            Vào trang chi tiết Tổ dân phố để gán
                                            tài khoản này làm{" "}
                                            {roleLabel(lastCreatedRole)} của một
                                            tổ cụ thể.
                                        </>
                                    )
                                )}
                            </div>
                        )}
                        {creatableRoles.length > 1 && (
                            <div className="space-y-1.5">
                                <Label>Vai trò</Label>
                                <Select
                                    value={createForm.role}
                                    onValueChange={v =>
                                        setCreateField(
                                            "role",
                                            v as CreatableStaffRole,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {creatableRoles.map(r => (
                                            <SelectItem key={r.key} value={r.key}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {NEIGHBORHOOD_LEADERSHIP_ROLES.includes(createForm.role) && (
                            <div className="space-y-1.5">
                                <FilterableSelect
                                    label="Tổ dân phố (tùy chọn - gán ngay sau khi tạo)"
                                    placeholder="Chưa chọn Tổ dân phố"
                                    searchPlaceholder="Tìm theo tên hoặc mã Tổ dân phố..."
                                    items={createNeighborhoods}
                                    getId={n => n._id}
                                    getLabel={n => `${n.code} — ${n.name}`}
                                    value={createForm.neighborhoodId}
                                    valueLabel={createForm.neighborhoodLabel}
                                    onChange={(neighborhoodId, neighborhood) => {
                                        setCreateField(
                                            "neighborhoodId",
                                            neighborhoodId || "",
                                        );
                                        setCreateField(
                                            "neighborhoodLabel",
                                            neighborhood
                                                ? `${neighborhood.code} — ${neighborhood.name}`
                                                : "",
                                        );
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Bỏ trống nếu chưa muốn gán ngay - có thể gán
                                    sau ở trang chi tiết Tổ dân phố.
                                </p>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>Số điện thoại</Label>
                            <Input
                                placeholder="VD: 0912345678"
                                autoComplete="off"
                                inputMode="numeric"
                                value={createForm.phone}
                                onChange={e =>
                                    setCreateField(
                                        "phone",
                                        e.target.value.replace(/\D/g, ""),
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Họ tên</Label>
                            <Input
                                placeholder="VD: Nguyễn Văn A"
                                autoComplete="off"
                                value={createForm.displayName}
                                onChange={e =>
                                    setCreateField(
                                        "displayName",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Địa chỉ (tùy chọn)</Label>
                            <Input
                                autoComplete="off"
                                value={createForm.address}
                                onChange={e =>
                                    setCreateField("address", e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Số CMND/CCCD (tùy chọn)</Label>
                            <Input
                                autoComplete="off"
                                value={createForm.idNumber}
                                onChange={e =>
                                    setCreateField("idNumber", e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Mật khẩu</Label>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Ít nhất 6 ký tự"
                                value={createForm.password}
                                onChange={e =>
                                    setCreateField("password", e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Sẽ đăng nhập bằng số điện thoại + mật khẩu này.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="w-full"
                        loading={creatingAccount}
                        disabled={!isCreateFormValid}
                        onClick={handleCreateAccount}
                    >
                        Tạo tài khoản
                    </Button>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default UserListPage;
