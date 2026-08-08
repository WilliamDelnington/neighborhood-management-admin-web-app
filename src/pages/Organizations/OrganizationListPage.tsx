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
import HeadOfHouseholdUserPicker from "@components/admin/HeadOfHouseholdUserPicker";
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
    representativeUserId: string;
    representativeUserLabel: string;
    representativeRole: string;
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
    representativeRole: "",
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Organization | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchOrganizations({
            page: targetPage,
            search: search || undefined,
            active: active === "" ? undefined : active === "true",
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
        const representative = !organization.representativeUserId
            ? { id: "", label: "" }
            : typeof organization.representativeUserId === "string"
                ? { id: organization.representativeUserId, label: "" }
                : {
                      id: organization.representativeUserId._id,
                      label: organization.representativeUserId.displayName,
                  };
        setForm({
            name: organization.name,
            taxCode: organization.taxCode || "",
            organizationType: organization.organizationType,
            representativeUserId: representative.id,
            representativeUserLabel: representative.label,
            representativeRole: organization.representativeRole || "",
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
                    representativeUserId: form.representativeUserId || undefined,
                    representativeRole: form.representativeRole.trim() || undefined,
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
                    representativeRole: form.representativeRole.trim() || undefined,
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

            <div className="mb-4 grid max-w-xl grid-cols-2 gap-3">
                <Input
                    placeholder="Tìm theo tên hoặc mã số thuế..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
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

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có tổ chức nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên tổ chức</TableHead>
                                <TableHead>Mã số thuế</TableHead>
                                <TableHead>Người đại diện</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(o => (
                                <TableRow
                                    key={o._id}
                                    className={canUpdate ? "cursor-pointer" : ""}
                                    onClick={() => canUpdate && openEditSheet(o)}
                                >
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
                            {canPickRepresentative && (
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
                            <div className="space-y-1.5">
                                <Label>Chức vụ người đại diện</Label>
                                <Input
                                    placeholder="VD: Giám đốc"
                                    value={form.representativeRole}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            representativeRole: e.target.value,
                                        }))
                                    }
                                />
                            </div>
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
        </div>
    );
};

export default OrganizationListPage;
