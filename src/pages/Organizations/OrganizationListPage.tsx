import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import HeadOfHouseholdUserPicker from "@components/admin/HeadOfHouseholdUserPicker";
import OrganizationRepresentativePanel from "@components/admin/OrganizationRepresentativePanel";
import { AppError, Organization, ORGANIZATION_TYPE_LABEL, OrganizationType } from "@dts";
import {
    createOrganization,
    fetchOrganizations,
    updateOrganization,
} from "@service/organizationApi";

const ACTIVE_ALL = "all";
const ORGANIZATION_TYPES = Object.keys(
    ORGANIZATION_TYPE_LABEL,
) as OrganizationType[];

type FormState = {
    name: string;
    taxCode: string;
    organizationType: OrganizationType;
    // Chi dung khi TAO moi - sau khi to chuc da ton tai, doi nguoi dai dien
    // phai qua OrganizationRepresentativePanel (dialog "Người đại diện"),
    // khong con sua duoc qua form nay nua.
    representativeUserId: string;
    representativeUserLabel: string;
    representativeTitle: string;
    phone: string;
    email: string;
    address: string;
    active: boolean;
};

const EMPTY_FORM: FormState = {
    name: "",
    taxCode: "",
    organizationType: "khac",
    representativeUserId: "",
    representativeUserLabel: "",
    representativeTitle: "",
    phone: "",
    email: "",
    address: "",
    active: true,
};

const OrganizationListPage: React.FC = () => (
    <AdminGuard permissions={["organizations.read"]}>
        <OrganizationListContent />
    </AdminGuard>
);

const OrganizationListContent: React.FC = () => {
    const canCreate = usePermission("organizations.create");
    const canUpdate = usePermission("organizations.update");
    // Chi admin moi duoc chon nguoi dai dien khac minh - house_owner tu tao to
    // chuc luon bi ep ve chinh minh o backend (xem organizationService.createOrganization).
    const canPickRepresentative = usePermission("users.read");

    const [search, setSearch] = useState("");
    const [active, setActive] = useState<"" | "true" | "false">("");
    const [items, setItems] = useState<Organization[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Organization | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [repDialogTarget, setRepDialogTarget] = useState<Organization | null>(
        null,
    );

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchOrganizations({
            page: targetPage,
            search: search || undefined,
            active: active === "" ? undefined : active === "true",
            limit: size,
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
    }, [search, active]);

    const openCreateSheet = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setSheetOpen(true);
    };

    const openEditSheet = (organization: Organization) => {
        setEditing(organization);
        setForm({
            ...EMPTY_FORM,
            name: organization.name,
            taxCode: organization.taxCode || "",
            organizationType: organization.organizationType,
            phone: organization.phone || "",
            email: organization.email || "",
            address: organization.address || "",
            active: organization.active,
        });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("Vui lòng nhập tên tổ chức");
            return;
        }
        try {
            setSaving(true);
            if (editing) {
                await updateOrganization(editing._id, {
                    name: form.name.trim(),
                    organizationType: form.organizationType,
                    phone: form.phone.trim() || undefined,
                    email: form.email.trim() || undefined,
                    address: form.address.trim() || undefined,
                    active: form.active,
                });
                toast.success("Đã cập nhật tổ chức");
            } else {
                await createOrganization({
                    name: form.name.trim(),
                    taxCode: form.taxCode.trim() || undefined,
                    organizationType: form.organizationType,
                    representativeUserId: form.representativeUserId || undefined,
                    representativeTitle:
                        form.representativeTitle.trim() || undefined,
                    phone: form.phone.trim() || undefined,
                    email: form.email.trim() || undefined,
                    address: form.address.trim() || undefined,
                    active: form.active,
                });
                toast.success("Đã tạo tổ chức mới");
            }
            setSheetOpen(false);
            load(editing ? page : 1);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Tổ chức (chủ nhà)</h1>
                {canCreate && (
                    <Button onClick={openCreateSheet}>Thêm tổ chức</Button>
                )}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                        placeholder="Tìm theo tên hoặc mã số thuế..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={active || ACTIVE_ALL}
                    onValueChange={v =>
                        setActive(v === ACTIVE_ALL ? "" : (v as "true" | "false"))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ACTIVE_ALL}>Tất cả trạng thái</SelectItem>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có tổ chức nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên tổ chức</TableHead>
                                <TableHead>Mã số thuế</TableHead>
                                <TableHead>Người đại diện</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((o, index) => (
                                <TableRow
                                    key={o._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() => canUpdate && openEditSheet(o)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {o.name}
                                    </TableCell>
                                    <TableCell>
                                        {o.taxCode || "Chưa có"}
                                    </TableCell>
                                    <TableCell>
                                        {!o.representativeUserId
                                            ? "Chưa có người đại diện"
                                            : typeof o.representativeUserId === "string"
                                                ? o.representativeUserId
                                                : o.representativeUserId.displayName}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={o.active ? "green" : "gray"}>
                                            {o.active ? "Hoạt động" : "Vô hiệu"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {canUpdate && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEditSheet(o)}
                                            >
                                                Chi tiết
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
                    onPageChange={load}
                    disabled={loading}
                />
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="flex flex-col sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Cập nhật tổ chức" : "Thêm tổ chức"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label>Tên tổ chức</Label>
                                <Input
                                    placeholder="VD: Công ty TNHH ABC"
                                    value={form.name}
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>
                                    Mã số thuế / số đăng ký kinh doanh (không
                                    bắt buộc)
                                </Label>
                                <Input
                                    placeholder="VD: 0123456789 (nếu có)"
                                    value={form.taxCode}
                                    disabled={!!editing}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            taxCode: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Loại hình tổ chức</Label>
                                <Select
                                    value={form.organizationType}
                                    onValueChange={v =>
                                        setForm(prev => ({
                                            ...prev,
                                            organizationType: v as OrganizationType,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORGANIZATION_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {ORGANIZATION_TYPE_LABEL[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {!editing && canPickRepresentative && (
                                <HeadOfHouseholdUserPicker
                                    value={form.representativeUserId}
                                    valueLabel={form.representativeUserLabel}
                                    onChange={(userId, user) =>
                                        setForm(prev => ({
                                            ...prev,
                                            representativeUserId: userId || "",
                                            representativeUserLabel:
                                                user?.displayName || "",
                                        }))
                                    }
                                />
                            )}
                            {!editing && (
                                <div className="space-y-1.5">
                                    <Label>Chức vụ người đại diện</Label>
                                    <Input
                                        placeholder="VD: Giám đốc"
                                        value={form.representativeTitle}
                                        onChange={e =>
                                            setForm(prev => ({
                                                ...prev,
                                                representativeTitle:
                                                    e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}
                            {editing && (
                                <div className="space-y-1.5">
                                    <Label>Người đại diện</Label>
                                    <p className="text-xs text-text_2">
                                        {!editing.representativeUserId
                                            ? "Chưa có người đại diện"
                                            : typeof editing.representativeUserId ===
                                                "string"
                                                ? editing.representativeUserId
                                                : editing.representativeUserId
                                                      .displayName}
                                        {editing.representativeRole &&
                                            ` (${editing.representativeRole})`}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setRepDialogTarget(editing)
                                        }
                                    >
                                        Quản lý người đại diện
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Số điện thoại</Label>
                                <Input
                                    value={form.phone}
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, phone: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input
                                    value={form.email}
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, email: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Địa chỉ</Label>
                                <Input
                                    value={form.address}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            address: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.active}
                                    onCheckedChange={checked =>
                                        setForm(prev => ({
                                            ...prev,
                                            active: checked === true,
                                        }))
                                    }
                                />
                                Đang hoạt động
                            </label>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={saving}
                            onClick={handleSave}
                        >
                            {editing ? "Lưu thay đổi" : "Tạo tổ chức"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!repDialogTarget}
                onOpenChange={open => {
                    if (!open) {
                        setRepDialogTarget(null);
                        load(page);
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Người đại diện — {repDialogTarget?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {repDialogTarget && (
                        <OrganizationRepresentativePanel
                            organizationId={repDialogTarget._id}
                            canManage={canUpdate}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrganizationListPage;
