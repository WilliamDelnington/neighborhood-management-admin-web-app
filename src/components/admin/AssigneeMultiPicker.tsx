import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { AssignableStaff } from "@dts";
import { fetchAssignableStaff } from "@service/userApi";

export interface AssigneeMultiPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Permission dung de tra cuu danh sach nhan vien co the duoc gan (vd "appointments.checkin"). */
    permission: string;
    selected: AssignableStaff[];
    onChange: (staff: AssignableStaff[]) => void;
}

/**
 * Bien the CHON NHIEU cua AssigneePicker.tsx (dung cho luong giao viec don le
 * cua Phan anh) - dung cho cau hinh "assignedOfficerUserIds" cua mot dich vu
 * hen lich (nhieu can bo cung duoc phu trach check-in/hoan thanh mot dich vu).
 * Danh sach nhan vien phu thuoc vao permission truyen vao - xem
 * GET /api/users/assignable-staff.
 */
const AssigneeMultiPicker: React.FC<AssigneeMultiPickerProps> = ({
    open,
    onOpenChange,
    permission,
    selected,
    onChange,
}) => {
    const [search, setSearch] = useState("");
    const [staff, setStaff] = useState<AssignableStaff[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setSearch("");
        setLoading(true);
        fetchAssignableStaff(permission)
            .then(setStaff)
            .catch(() => setStaff([]))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, permission]);

    const results = staff.filter(s =>
        s.displayName.toLowerCase().includes(search.toLowerCase()),
    );

    const toggle = (s: AssignableStaff) => {
        const isSelected = selected.some(item => item.id === s.id);
        onChange(
            isSelected
                ? selected.filter(item => item.id !== s.id)
                : [...selected, s],
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chọn cán bộ phụ trách</DialogTitle>
                </DialogHeader>
                <Input
                    placeholder="Tìm theo tên cán bộ..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-80 overflow-y-auto">
                    {loading && <LoadingState />}
                    {!loading && results.length === 0 && (
                        <EmptyState label="Không tìm thấy cán bộ phù hợp" />
                    )}
                    {!loading &&
                        results.map(s => (
                            <label
                                key={s.id}
                                className="flex cursor-pointer items-center gap-2 border-b border-divider_01 py-2 text-sm last:border-0"
                            >
                                <Checkbox
                                    checked={selected.some(item => item.id === s.id)}
                                    onCheckedChange={() => toggle(s)}
                                />
                                {s.displayName}
                            </label>
                        ))}
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Xong</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AssigneeMultiPicker;
