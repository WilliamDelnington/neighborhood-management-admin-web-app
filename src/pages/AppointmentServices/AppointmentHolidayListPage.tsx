import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
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
import { AppError, AppointmentHoliday, AppointmentHolidayType } from "@dts";
import { usePermission } from "@store/authStore";
import {
    createAppointmentHoliday,
    deleteAppointmentHoliday,
    fetchAppointmentHolidays,
    updateAppointmentHoliday,
} from "@service/appointmentHolidayApi";
import { convertLunarToSolar } from "@lib/lunarCalendar";

const TYPE_LABEL: Record<AppointmentHolidayType, string> = {
    le: "Ngày lễ",
    tam_ngung: "Tạm ngưng tiếp nhận",
};

type DateMode = "solar" | "lunar";

type FormState = {
    dateMode: DateMode;
    // Duong lich - dung khi dateMode="solar".
    solarDate: string;
    // Am lich - dung khi dateMode="lunar", quy doi sang duong lich truoc khi luu.
    lunarDay: string;
    lunarMonth: string;
    lunarYear: string;
    lunarLeap: boolean;
    name: string;
    type: AppointmentHolidayType;
    note: string;
};

const EMPTY_FORM: FormState = {
    dateMode: "solar",
    solarDate: "",
    lunarDay: "",
    lunarMonth: "",
    lunarYear: String(new Date().getFullYear()),
    lunarLeap: false,
    name: "",
    type: "le",
    note: "",
};

const AppointmentHolidayListPage: React.FC = () => (
    <AdminGuard permissions={["appointments.read"]}>
        <AppointmentHolidayListContent />
    </AdminGuard>
);

const AppointmentHolidayListContent: React.FC = () => {
    const canManage = usePermission("appointments.manage");
    const [items, setItems] = useState<AppointmentHoliday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AppointmentHoliday | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchAppointmentHolidays()
            .then(setItems)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (item: AppointmentHoliday) => {
        setEditing(item);
        setForm({
            ...EMPTY_FORM,
            dateMode: "solar",
            solarDate: item.date.slice(0, 10),
            name: item.name,
            type: item.type,
            note: item.note || "",
        });
        setOpen(true);
    };

    // Ngay duong lich cuoi cung se duoc luu - hoac nhap truc tiep, hoac quy
    // doi tu am lich (xem lib/lunarCalendar.ts). null = chua nhap du/khong
    // quy doi duoc (vd chon nham thang nhuan khong ton tai nam do).
    const resolvedSolarDate = useMemo(() => {
        if (form.dateMode === "solar") {
            return form.solarDate || null;
        }
        const day = Number(form.lunarDay);
        const month = Number(form.lunarMonth);
        const year = Number(form.lunarYear);
        if (!day || !month || !year) return null;
        const solar = convertLunarToSolar(day, month, year, form.lunarLeap, 7);
        if (!solar) return null;
        return `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(
            solar.day,
        ).padStart(2, "0")}`;
    }, [
        form.dateMode,
        form.solarDate,
        form.lunarDay,
        form.lunarMonth,
        form.lunarYear,
        form.lunarLeap,
    ]);

    const handleSave = async () => {
        if (!form.name.trim() || !resolvedSolarDate) {
            toast.error(
                form.dateMode === "lunar" && form.lunarDay
                    ? "Ngày âm lịch không hợp lệ cho năm đã chọn (có thể do chọn nhầm tháng nhuận)"
                    : "Vui lòng nhập đủ tên và ngày",
            );
            return;
        }
        try {
            setSaving(true);
            if (editing?._id) {
                await updateAppointmentHoliday(editing._id, {
                    date: resolvedSolarDate,
                    name: form.name.trim(),
                    type: form.type,
                    note: form.note.trim() || undefined,
                });
                toast.success("Đã cập nhật ngày nghỉ/lễ");
            } else {
                await createAppointmentHoliday({
                    date: resolvedSolarDate,
                    name: form.name.trim(),
                    type: form.type,
                    note: form.note.trim() || undefined,
                });
                toast.success("Đã khai báo ngày nghỉ/lễ");
            }
            setOpen(false);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: AppointmentHoliday) => {
        if (!window.confirm(`Xóa ngày nghỉ/lễ "${item.name}"?`)) return;
        try {
            await deleteAppointmentHoliday(item._id);
            toast.success("Đã xóa ngày nghỉ/lễ");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">Ngày nghỉ / lễ</h1>
                    <p className="mt-1 text-sm text-text_2">
                        Các ngày cụ thể không tiếp nhận đặt lịch hẹn (lễ, Tết, tạm
                        ngưng đột xuất). Có thể nhập theo ngày âm lịch để tự động
                        quy đổi sang dương lịch.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" /> Thêm ngày nghỉ/lễ
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa khai báo ngày nghỉ/lễ nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Ngày</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Phạm vi</TableHead>
                                {canManage && <TableHead />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item._id}>
                                    <TableCell className="text-center text-text_2">{index + 1}</TableCell>
                                    <TableCell>
                                        <button
                                            className="text-left font-medium text-main hover:underline"
                                            onClick={() => canManage && openEdit(item)}
                                        >
                                            {item.date.slice(0, 10)}
                                        </button>
                                    </TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <Badge tone={item.type === "le" ? "blue" : "yellow"}>
                                            {TYPE_LABEL[item.type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.wardCode === undefined
                                            ? "Toàn hệ thống"
                                            : `Phường ${item.wardCode}`}
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-right">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="Xóa"
                                                onClick={() => void handleDelete(item)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Sửa ngày nghỉ/lễ" : "Thêm ngày nghỉ/lễ"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto py-4">
                        <div>
                            <Label>Tên</Label>
                            <Input
                                className="mt-1"
                                value={form.name}
                                placeholder="Tết Nguyên Đán, Giỗ Tổ Hùng Vương, ..."
                                onChange={event =>
                                    setForm(current => ({ ...current, name: event.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Loại</Label>
                            <Select
                                value={form.type}
                                onValueChange={value =>
                                    setForm(current => ({
                                        ...current,
                                        type: value as AppointmentHolidayType,
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="le">Ngày lễ</SelectItem>
                                    <SelectItem value="tam_ngung">
                                        Tạm ngưng tiếp nhận
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Cách nhập ngày</Label>
                            <Select
                                value={form.dateMode}
                                onValueChange={value =>
                                    setForm(current => ({
                                        ...current,
                                        dateMode: value as DateMode,
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="solar">Dương lịch</SelectItem>
                                    <SelectItem value="lunar">Âm lịch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.dateMode === "solar" ? (
                            <div>
                                <Label>Ngày (dương lịch)</Label>
                                <Input
                                    className="mt-1"
                                    type="date"
                                    value={form.solarDate}
                                    onChange={event =>
                                        setForm(current => ({
                                            ...current,
                                            solarDate: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        ) : (
                            <div>
                                <Label>Ngày âm lịch</Label>
                                <div className="mt-1 grid grid-cols-3 gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={30}
                                        placeholder="Ngày"
                                        value={form.lunarDay}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                lunarDay: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        type="number"
                                        min={1}
                                        max={12}
                                        placeholder="Tháng"
                                        value={form.lunarMonth}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                lunarMonth: event.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Năm"
                                        value={form.lunarYear}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                lunarYear: event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <label className="mt-2 flex items-center gap-2 text-xs text-text_2">
                                    <input
                                        type="checkbox"
                                        checked={form.lunarLeap}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                lunarLeap: event.target.checked,
                                            }))
                                        }
                                    />
                                    Là tháng nhuận (hiếm gặp, chỉ tick nếu chắc chắn)
                                </label>
                                <p className="mt-2 text-xs text-text_2">
                                    {resolvedSolarDate
                                        ? `Tương ứng dương lịch: ${resolvedSolarDate}`
                                        : form.lunarDay && form.lunarMonth && form.lunarYear
                                          ? "Không quy đổi được - kiểm tra lại ngày/tháng/năm âm lịch"
                                          : "Nhập đủ ngày/tháng/năm âm lịch để xem ngày dương lịch tương ứng"}
                                </p>
                            </div>
                        )}
                        <div>
                            <Label>Ghi chú</Label>
                            <Textarea
                                className="mt-1"
                                value={form.note}
                                onChange={event =>
                                    setForm(current => ({ ...current, note: event.target.value }))
                                }
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button className="w-full" loading={saving} onClick={() => void handleSave()}>
                            Lưu
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AppointmentHolidayListPage;
