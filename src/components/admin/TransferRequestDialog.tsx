import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { AssignableStaff } from "@dts";
import { fetchAssignableStaffByRoles } from "@service/userApi";

export interface TransferRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Vai tro ung vien co the nhan chuyen tiep - dung targetRoles cua chinh
     * Request (khong doi hoi quyen rieng cua nguoi goi, xem GET
     * /api/users/assignable-staff?roles=). Neu Request khong co targetRoles
     * (vd gui theo targetUserIds/vai tro trong Nha cu the), danh sach ung
     * vien se rong - nguoi dung se khong chuyen tiep duoc trong truong hop
     * nay o lan trien khai dau tien.
     */
    candidateRoleKeys: string[];
    excludeUserId?: string;
    submitting?: boolean;
    onSubmit: (input: { toUserId: string; reason: string }) => void;
}

/**
 * Dialog cho nguoi nhan HIEN TAI cua mot Request de nghi chuyen tiep cho
 * nguoi khac, kem ly do bat buoc. Xem RequestDetailSheet.tsx va
 * requestService.initiateRequestTransfer o backend.
 */
const TransferRequestDialog: React.FC<TransferRequestDialogProps> = ({
    open,
    onOpenChange,
    candidateRoleKeys,
    excludeUserId,
    submitting,
    onSubmit,
}) => {
    const [search, setSearch] = useState("");
    const [staff, setStaff] = useState<AssignableStaff[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!open) return;
        setSelectedUserId(null);
        setReason("");
        setSearch("");
        setLoading(true);
        fetchAssignableStaffByRoles(candidateRoleKeys)
            .then(setStaff)
            .catch(() => setStaff([]))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, candidateRoleKeys.join(",")]);

    const results = staff
        .filter(s => s.id !== excludeUserId)
        .filter(s => s.displayName.toLowerCase().includes(search.toLowerCase()));

    const canSubmit = !!selectedUserId && reason.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chuyển tiếp yêu cầu</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label>Người nhận mới</Label>
                        <Input
                            className="mt-1.5"
                            placeholder="Tìm theo tên cán bộ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-divider_01">
                            {loading && <LoadingState />}
                            {!loading && results.length === 0 && (
                                <EmptyState label="Không tìm thấy cán bộ phù hợp" />
                            )}
                            {!loading &&
                                results.map(u => (
                                    <label
                                        key={u.id}
                                        className="flex cursor-pointer items-center gap-2 border-b border-divider_01 px-3 py-2 text-sm last:border-0 hover:bg-ng_10"
                                    >
                                        <input
                                            type="radio"
                                            name="transfer-to-user"
                                            checked={selectedUserId === u.id}
                                            onChange={() => setSelectedUserId(u.id)}
                                        />
                                        {u.displayName}
                                    </label>
                                ))}
                        </div>
                    </div>
                    <div>
                        <Label>Lý do chuyển tiếp *</Label>
                        <Textarea
                            className="mt-1.5"
                            placeholder="Mô tả lý do chuyển tiếp yêu cầu này"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        loading={submitting}
                        disabled={!canSubmit}
                        onClick={() =>
                            selectedUserId &&
                            onSubmit({ toUserId: selectedUserId, reason: reason.trim() })
                        }
                    >
                        Gửi đề nghị chuyển tiếp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TransferRequestDialog;
