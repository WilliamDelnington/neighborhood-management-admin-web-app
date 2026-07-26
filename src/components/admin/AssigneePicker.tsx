import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { AssignableStaff } from "@dts";
import { fetchAssignableStaff } from "@service/userApi";

export interface AssigneePickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Permission dung de tra cuu danh sach nhan vien co the duoc gan (vd "pccc.assign"). */
    permission: string;
    onSelect: (staff: AssignableStaff) => void;
    selecting?: boolean;
}

/**
 * Dialog chon nguoi phu trach dung chung cho cac man hinh giao viec (phan anh,
 * PCCC, ...). Danh sach nhan vien phu thuoc vao permission truyen vao - xem
 * GET /api/users/assignable-staff.
 */
const AssigneePicker: React.FC<AssigneePickerProps> = ({
    open,
    onOpenChange,
    permission,
    onSelect,
    selecting,
}) => {
    const [search, setSearch] = useState("");
    const [staff, setStaff] = useState<AssignableStaff[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chọn người phụ trách</DialogTitle>
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
                        results.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                disabled={selecting}
                                className="block w-full border-b border-divider_01 py-2 text-left text-sm last:border-0 hover:bg-ng_10 disabled:opacity-50"
                                onClick={() => onSelect(u)}
                            >
                                {u.displayName}
                            </button>
                        ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AssigneePicker;
