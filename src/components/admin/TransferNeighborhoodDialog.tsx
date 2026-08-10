import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
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
import { createChangeRequest } from "@service/changeRequestApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { AppError, Neighborhood } from "@dts";

export interface TransferNeighborhoodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    houseId: string;
    currentNeighborhoodId?: string;
    onCreated?: () => void;
}

/**
 * Gui de nghi chuyen mot Nha so sang To dan pho khac (B03) - tao mot
 * ChangeRequest changeType="transfer_neighborhood", cho PCO hoac To
 * truong/To pho cua To SE NHAN quyet dinh (xem changeRequestService.ts).
 */
const TransferNeighborhoodDialog: React.FC<TransferNeighborhoodDialogProps> = ({
    open,
    onOpenChange,
    houseId,
    currentNeighborhoodId,
    onCreated,
}) => {
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [destinationId, setDestinationId] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setDestinationId("");
        setReason("");
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, [open]);

    const candidates = neighborhoods.filter(
        n => n._id !== currentNeighborhoodId,
    );

    const handleSubmit = async () => {
        if (!destinationId) {
            toast.error("Vui lòng chọn tổ dân phố muốn chuyển đến");
            return;
        }
        try {
            setSubmitting(true);
            await createChangeRequest({
                targetModel: "HouseRecord",
                targetId: houseId,
                changeType: "transfer_neighborhood",
                patch: { neighborhoodId: destinationId },
                reason: reason.trim() || undefined,
            });
            toast.success(
                "Đã gửi đề nghị chuyển tổ dân phố, chờ Tổ nhận hoặc cán bộ UBND quyết định",
            );
            onOpenChange(false);
            onCreated?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chuyển tổ dân phố</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Chuyển đến tổ dân phố</Label>
                        <Select
                            value={destinationId}
                            onValueChange={setDestinationId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn tổ dân phố" />
                            </SelectTrigger>
                            <SelectContent>
                                {candidates.map(n => (
                                    <SelectItem key={n._id} value={n._id}>
                                        {n.code} — {n.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Lý do (tùy chọn)</Label>
                        <Textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Vì sao nhà số này nên thuộc tổ dân phố khác"
                        />
                    </div>
                    <p className="text-xs text-text_2">
                        Đề nghị này cần cán bộ UBND hoặc Tổ trưởng/Tổ phó của
                        tổ dân phố sẽ nhận quyết định trước khi có hiệu lực.
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button loading={submitting} onClick={handleSubmit}>
                        Gửi đề nghị
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TransferNeighborhoodDialog;
