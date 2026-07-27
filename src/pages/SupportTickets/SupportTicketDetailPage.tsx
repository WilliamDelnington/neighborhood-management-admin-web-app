import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Textarea } from "@components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { AppError, SupportTicket, TrangThaiYeuCauHoTro } from "@dts";
import {
    LOAI_YEU_CAU_HO_TRO_LABEL,
    TRANG_THAI_YEU_CAU_HO_TRO_LABEL,
    TRANG_THAI_YEU_CAU_HO_TRO_TONE,
} from "@constants/domain";
import {
    fetchSupportTicketDetail,
    updateSupportTicketStatus,
} from "@service/supportTicketApi";

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const SupportTicketDetailPage: React.FC = () => (
    <AdminGuard permissions={["support_tickets.read"]}>
        <SupportTicketDetailContent />
    </AdminGuard>
);

const SupportTicketDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canUpdateStatus = usePermission("support_tickets.update_status");

    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [newStatus, setNewStatus] = useState<TrangThaiYeuCauHoTro | "">("");
    const [response, setResponse] = useState("");
    const [updating, setUpdating] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchSupportTicketDetail(id)
            .then(res => {
                setTicket(res);
                setNewStatus(res.status);
                setResponse(res.adminResponse || "");
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleUpdateStatus = async () => {
        if (!id || !newStatus) return;
        try {
            setUpdating(true);
            const updated = await updateSupportTicketStatus(id, {
                status: newStatus,
                response: response.trim() || undefined,
            });
            setTicket(updated);
            toast.success("Đã cập nhật trạng thái yêu cầu hỗ trợ");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUpdating(false);
        }
    };

    const creator =
        ticket && typeof ticket.createdByUserId === "object"
            ? ticket.createdByUserId
            : undefined;

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/support-tickets")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Yêu cầu hỗ trợ</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && ticket && (
                <>
                    <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {ticket.code}
                            </h2>
                            <Badge
                                tone={
                                    TRANG_THAI_YEU_CAU_HO_TRO_TONE[
                                        ticket.status
                                    ]
                                }
                            >
                                {TRANG_THAI_YEU_CAU_HO_TRO_LABEL[ticket.status]}
                            </Badge>
                        </div>
                        <div className="text-sm font-medium">
                            {ticket.title}
                        </div>
                        <div className="mt-1 text-xs text-text_2">
                            {LOAI_YEU_CAU_HO_TRO_LABEL[ticket.type]}
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm">
                            {ticket.content}
                        </p>

                        <div className="mt-3 border-t border-divider_01 pt-3">
                            {creator && (
                                <InfoRow
                                    label="Người gửi"
                                    value={`${creator.displayName}${
                                        creator.phone
                                            ? ` (${creator.phone})`
                                            : ""
                                    }`}
                                />
                            )}
                            <InfoRow
                                label="Gửi lúc"
                                value={formatDateTime(ticket.createdAt)}
                            />
                            {ticket.deviceInfo && (
                                <InfoRow
                                    label="Thiết bị"
                                    value={ticket.deviceInfo}
                                />
                            )}
                        </div>
                    </div>

                    {canUpdateStatus && (
                        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold">
                                Cập nhật trạng thái & phản hồi
                            </h2>
                            <Select
                                value={newStatus}
                                onValueChange={v =>
                                    setNewStatus(v as TrangThaiYeuCauHoTro)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Trạng thái mới" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(
                                            TRANG_THAI_YEU_CAU_HO_TRO_LABEL,
                                        ) as [TrangThaiYeuCauHoTro, string][]
                                    ).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Textarea
                                className="mt-3"
                                placeholder="Phản hồi cho người dân..."
                                value={response}
                                onChange={e => setResponse(e.target.value)}
                            />
                            <div className="mt-3">
                                <Button
                                    loading={updating}
                                    disabled={!newStatus}
                                    onClick={handleUpdateStatus}
                                >
                                    Cập nhật
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <div className="flex justify-between py-1 text-sm">
        <span className="text-text_2">{label}</span>
        <span className="max-w-[70%] text-right">{value}</span>
    </div>
);

export default SupportTicketDetailPage;
