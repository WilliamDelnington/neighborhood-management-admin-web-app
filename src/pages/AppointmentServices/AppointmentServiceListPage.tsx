import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import AssigneeMultiPicker from "@components/admin/AssigneeMultiPicker";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Checkbox } from "@components/ui/checkbox";
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
import { AppError, AppointmentService, AssignableStaff, Neighborhood } from "@dts";
import { usePermission } from "@store/authStore";
import {
    archiveAppointmentService,
    AppointmentServiceInput,
    createAppointmentService,
    fetchAppointmentServicesPaged,
    updateAppointmentService,
} from "@service/appointmentServiceApi";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { fetchNeighborhoods } from "@service/neighborhoodApi";

const DAY_OF_WEEK_LABEL: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    7: "Chủ nhật",
};

type TimeSlotDraft = {
    _id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    active: boolean;
};

type FormState = {
    key: string;
    name: string;
    description: string;
    locationAddress: string;
    scope: "ward" | "neighborhood";
    neighborhoodId: string;
    slotDurationMinutes: number;
    autoApprove: boolean;
    active: boolean;
    assignedOfficers: AssignableStaff[];
    timeSlots: TimeSlotDraft[];
};

const EMPTY_TIME_SLOT: TimeSlotDraft = {
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "11:00",
    maxCapacity: 5,
    active: true,
};

const EMPTY_FORM: FormState = {
    key: "",
    name: "",
    description: "",
    locationAddress: "",
    scope: "ward",
    neighborhoodId: "",
    slotDurationMinutes: 30,
    autoApprove: true,
    active: true,
    assignedOfficers: [],
    timeSlots: [],
};

const AppointmentServiceListPage: React.FC = () => (
    <AdminGuard permissions={["appointments.read"]}>
        <AppointmentServiceListContent />
    </AdminGuard>
);

const AppointmentServiceListContent: React.FC = () => {
    const canManage = usePermission("appointments.manage");
    const [items, setItems] = useState<AppointmentService[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AppointmentService | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [officerPickerOpen, setOfficerPickerOpen] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchAppointmentServicesPaged({
            page: targetPage,
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

    useEffect(() => load(1), []);

    useEffect(() => {
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (item: AppointmentService) => {
        setEditing(item);
        setForm({
            key: item.key,
            name: item.name,
            description: item.description || "",
            locationAddress: item.locationAddress,
            scope: item.scope,
            neighborhoodId:
                typeof item.neighborhoodId === "string" ? item.neighborhoodId : "",
            slotDurationMinutes: item.slotDurationMinutes,
            autoApprove: item.autoApprove,
            active: item.active,
            assignedOfficers: item.assignedOfficerUserIds.map(o => ({
                id: o._id,
                displayName: o.displayName,
            })),
            timeSlots: item.timeSlots.map(slot => ({ ...slot })),
        });
        setOpen(true);
    };

    const updateTimeSlot = <K extends keyof TimeSlotDraft>(
        index: number,
        key: K,
        value: TimeSlotDraft[K],
    ) => {
        setForm(current => ({
            ...current,
            timeSlots: current.timeSlots.map((slot, slotIndex) =>
                slotIndex === index ? { ...slot, [key]: value } : slot,
            ),
        }));
    };

    const handleSave = async () => {
        if (
            !form.name.trim() ||
            (!editing && !form.key.trim()) ||
            !form.locationAddress.trim() ||
            (form.scope === "neighborhood" && !form.neighborhoodId) ||
            form.timeSlots.length === 0
        ) {
            toast.error(
                "Vui lòng nhập đủ tên, địa điểm, phạm vi và ít nhất một khung giờ",
            );
            return;
        }
        const payload: AppointmentServiceInput = {
            key: form.key.trim(),
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            locationAddress: form.locationAddress.trim(),
            scope: form.scope,
            neighborhoodId:
                form.scope === "neighborhood" ? form.neighborhoodId : undefined,
            slotDurationMinutes: form.slotDurationMinutes,
            autoApprove: form.autoApprove,
            active: form.active,
            assignedOfficerUserIds: form.assignedOfficers.map(o => o.id),
            timeSlots: form.timeSlots.map(slot => ({
                _id: slot._id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxCapacity: slot.maxCapacity,
                active: slot.active,
            })),
        };
        try {
            setSaving(true);
            if (editing?._id) {
                const { key: _key, ...update } = payload;
                await updateAppointmentService(editing._id, update);
                toast.success("Đã cập nhật dịch vụ hẹn lịch");
            } else {
                await createAppointmentService(payload);
                toast.success("Đã tạo dịch vụ hẹn lịch");
            }
            setOpen(false);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (item: AppointmentService) => {
        if (!window.confirm(`Ngừng sử dụng “${item.name}”?`)) return;
        try {
            await archiveAppointmentService(item._id);
            toast.success("Đã ngừng sử dụng dịch vụ hẹn lịch");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">Dịch vụ hẹn lịch</h1>
                    <p className="mt-1 text-sm text-text_2">
                        Cấu hình các dịch vụ có thể đặt lịch hẹn và khung giờ tiếp
                        nhận tương ứng.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" /> Thêm dịch vụ
                    </Button>
                )}
            </div>

            <div className="mb-3 flex justify-end">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có dịch vụ hẹn lịch nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên dịch vụ</TableHead>
                                <TableHead>Phạm vi</TableHead>
                                <TableHead>Duyệt tự động</TableHead>
                                <TableHead>Khung giờ</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                {canManage && <TableHead />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item._id}>
                                    <TableCell className="text-center text-text_2">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.key}</TableCell>
                                    <TableCell>
                                        <button
                                            className="text-left font-medium text-main hover:underline"
                                            onClick={() => canManage && openEdit(item)}
                                        >
                                            {item.name}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        {item.scope === "ward" ? "Toàn phường" : "Tổ dân phố"}
                                    </TableCell>
                                    <TableCell>{item.autoApprove ? "Có" : "Không"}</TableCell>
                                    <TableCell>{item.timeSlots.length}</TableCell>
                                    <TableCell>
                                        <Badge tone={item.active ? "green" : "gray"}>
                                            {item.active ? "Hoạt động" : "Ngừng dùng"}
                                        </Badge>
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-right">
                                            {item.active && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Ngừng sử dụng"
                                                    onClick={() => void handleArchive(item)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={load}
                disabled={loading}
            />

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Sửa dịch vụ hẹn lịch" : "Thêm dịch vụ hẹn lịch"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto py-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Mã dịch vụ</Label>
                                <Input
                                    className="mt-1"
                                    value={form.key}
                                    disabled={!!editing}
                                    placeholder="cong_chung_ho_tich"
                                    onChange={event =>
                                        setForm(current => ({
                                            ...current,
                                            key: event.target.value.toLowerCase(),
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>Tên dịch vụ</Label>
                                <Input
                                    className="mt-1"
                                    value={form.name}
                                    onChange={event =>
                                        setForm(current => ({ ...current, name: event.target.value }))
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Mô tả</Label>
                            <Textarea
                                className="mt-1"
                                value={form.description}
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Địa điểm tiếp nhận</Label>
                            <Input
                                className="mt-1"
                                value={form.locationAddress}
                                placeholder="Trụ sở UBND phường, số ..."
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        locationAddress: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Phạm vi áp dụng</Label>
                                <Select
                                    value={form.scope}
                                    onValueChange={value =>
                                        setForm(current => ({
                                            ...current,
                                            scope: value as "ward" | "neighborhood",
                                        }))
                                    }
                                >
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ward">Toàn phường</SelectItem>
                                        <SelectItem value="neighborhood">Một tổ dân phố</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.scope === "neighborhood" && (
                                <div>
                                    <Label>Tổ dân phố</Label>
                                    <Select
                                        value={form.neighborhoodId}
                                        onValueChange={value =>
                                            setForm(current => ({
                                                ...current,
                                                neighborhoodId: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Chọn tổ dân phố" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {neighborhoods.map(n => (
                                                <SelectItem key={n._id} value={n._id}>
                                                    {n.code} — {n.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Thời lượng mỗi lượt hẹn (phút)</Label>
                            <Input
                                className="mt-1"
                                type="number"
                                min={5}
                                value={form.slotDurationMinutes}
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        slotDurationMinutes: Number(event.target.value) || 0,
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.autoApprove}
                                    onCheckedChange={checked =>
                                        setForm(current => ({
                                            ...current,
                                            autoApprove: checked === true,
                                        }))
                                    }
                                />
                                Tự động xác nhận lịch hẹn
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.active}
                                    onCheckedChange={checked =>
                                        setForm(current => ({
                                            ...current,
                                            active: checked === true,
                                        }))
                                    }
                                />
                                Đang hoạt động
                            </label>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label>Cán bộ phụ trách check-in / hoàn thành</Label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOfficerPickerOpen(true)}
                                >
                                    Chọn cán bộ
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {form.assignedOfficers.length === 0 && (
                                    <span className="text-xs text-text_2">
                                        Chưa chọn cán bộ phụ trách
                                    </span>
                                )}
                                {form.assignedOfficers.map(o => (
                                    <Badge key={o.id} tone="blue">
                                        {o.displayName}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <Label>Khung giờ tiếp nhận</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Mỗi khung giờ áp dụng lặp lại hàng tuần theo thứ.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setForm(current => ({
                                            ...current,
                                            timeSlots: [...current.timeSlots, { ...EMPTY_TIME_SLOT }],
                                        }))
                                    }
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Thêm khung giờ
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.timeSlots.map((slot, index) => (
                                    <div key={index} className="rounded-lg border p-3">
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            <Select
                                                value={String(slot.dayOfWeek)}
                                                onValueChange={value =>
                                                    updateTimeSlot(index, "dayOfWeek", Number(value))
                                                }
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                                        <SelectItem key={day} value={String(day)}>
                                                            {DAY_OF_WEEK_LABEL[day]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                type="time"
                                                value={slot.startTime}
                                                onChange={event =>
                                                    updateTimeSlot(index, "startTime", event.target.value)
                                                }
                                            />
                                            <Input
                                                type="time"
                                                value={slot.endTime}
                                                onChange={event =>
                                                    updateTimeSlot(index, "endTime", event.target.value)
                                                }
                                            />
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="Số lượt tối đa"
                                                value={slot.maxCapacity}
                                                onChange={event =>
                                                    updateTimeSlot(
                                                        index,
                                                        "maxCapacity",
                                                        Number(event.target.value) || 0,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={slot.active}
                                                    onCheckedChange={checked =>
                                                        updateTimeSlot(index, "active", checked === true)
                                                    }
                                                />
                                                Đang áp dụng
                                            </label>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setForm(current => ({
                                                        ...current,
                                                        timeSlots: current.timeSlots.filter(
                                                            (_, slotIndex) => slotIndex !== index,
                                                        ),
                                                    }))
                                                }
                                            >
                                                Xóa khung giờ
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button className="w-full" loading={saving} onClick={() => void handleSave()}>
                            Lưu cấu hình
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AssigneeMultiPicker
                open={officerPickerOpen}
                onOpenChange={setOfficerPickerOpen}
                permission="appointments.checkin"
                selected={form.assignedOfficers}
                onChange={assignedOfficers =>
                    setForm(current => ({ ...current, assignedOfficers }))
                }
            />
        </div>
    );
};

export default AppointmentServiceListPage;
