import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import { resolveAssetUrl } from "@constants/common";
import {
    BUSINESS_DOCUMENT_STATUS_LABEL,
    BUSINESS_DOCUMENT_STATUS_TONE,
} from "@constants/domain";
import { useAuthStore, usePermission } from "@store/authStore";
import { AppError, BusinessDocument, RequiredDocumentItem } from "@dts";
import { fetchRequiredDocuments, reviewBusinessDocument } from "@service/businessApi";

const formatDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("vi-VN");
};

const formatDateTime = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
};

const actorLabel = (actor: BusinessDocument["uploadedBy"]) => {
    if (!actor) return "Không rõ";
    return typeof actor === "string" ? actor : actor.displayName;
};

const documentTypeName = (item: RequiredDocumentItem) => {
    const dt = item.rule.documentTypeId;
    return typeof dt === "string" ? dt : dt.name;
};

export interface RequiredDocumentsPanelProps {
    businessId: string;
    className?: string;
    /** Goi lai sau khi duyet/tu choi thanh cong de trang cha lam moi trang thai ho kinh doanh. */
    onChanged?: () => void;
}

const RequiredDocumentsPanel: React.FC<RequiredDocumentsPanelProps> = ({
    businessId,
    className = "mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm",
    onChanged,
}) => {
    const currentUser = useAuthStore(state => state.user);
    const canVerifyDefault = usePermission("businesses.verify");

    const [items, setItems] = useState<RequiredDocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expandedHistory, setExpandedHistory] = useState<Set<string>>(
        new Set(),
    );

    const [reviewing, setReviewing] = useState<RequiredDocumentItem | null>(
        null,
    );
    const [reviewNote, setReviewNote] = useState("");
    const [submittingDecision, setSubmittingDecision] = useState<
        "approved" | "rejected" | null
    >(null);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchRequiredDocuments(businessId)
            .then(res => setItems(res.items))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId]);

    const canReview = (item: RequiredDocumentItem) => {
        if (!currentUser) return false;
        if (currentUser.roles.includes("admin")) return true;
        if (item.rule.reviewerRoles.length > 0) {
            return item.rule.reviewerRoles.some(r =>
                currentUser.roles.includes(r),
            );
        }
        return canVerifyDefault;
    };

    const toggleHistory = (key: string) => {
        setExpandedHistory(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const openReview = (item: RequiredDocumentItem) => {
        setReviewing(item);
        setReviewNote("");
    };

    const submitDecision = async (decision: "approved" | "rejected") => {
        if (!reviewing?.activeDocument) return;
        if (decision === "rejected" && !reviewNote.trim()) {
            toast.error("Vui lòng nhập lý do yêu cầu bổ sung");
            return;
        }
        try {
            setSubmittingDecision(decision);
            await reviewBusinessDocument(
                businessId,
                reviewing.activeDocument._id,
                decision,
                decision === "rejected" ? reviewNote.trim() : undefined,
                decision === "approved" ? reviewNote.trim() || undefined : undefined,
            );
            toast.success(
                decision === "approved"
                    ? "Đã duyệt giấy tờ"
                    : "Đã yêu cầu bổ sung giấy tờ",
            );
            setReviewing(null);
            load();
            onChanged?.();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmittingDecision(null);
        }
    };

    return (
        <div className={className}>
            <h2 className="mb-2 text-base font-semibold">
                Hồ sơ giấy tờ theo yêu cầu
            </h2>
            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}
            {!loading && !error && items.length === 0 && (
                <EmptyState label="Loại hình kinh doanh này chưa có yêu cầu giấy tờ nào" />
            )}
            {!loading && !error && items.length > 0 && (
                <div className="flex flex-col gap-3">
                    {items.map(item => {
                        const key = documentTypeName(item);
                        const historyOpen = expandedHistory.has(key);
                        return (
                            <div
                                key={key}
                                className="rounded-lg border border-divider_01 p-3"
                            >
                                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 shrink-0 text-text_2" />
                                        <span className="font-medium">
                                            {documentTypeName(item)}
                                        </span>
                                        <Badge
                                            tone={
                                                item.rule.isRequired
                                                    ? "blue"
                                                    : "gray"
                                            }
                                        >
                                            {item.rule.isRequired
                                                ? "Bắt buộc"
                                                : "Tùy chọn"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {item.missing ? (
                                            <Badge tone="gray">
                                                Chưa nộp
                                            </Badge>
                                        ) : (
                                            item.activeDocument && (
                                                <Badge
                                                    tone={
                                                        BUSINESS_DOCUMENT_STATUS_TONE[
                                                            item.activeDocument
                                                                .status
                                                        ]
                                                    }
                                                >
                                                    {
                                                        BUSINESS_DOCUMENT_STATUS_LABEL[
                                                            item.activeDocument
                                                                .status
                                                        ]
                                                    }
                                                </Badge>
                                            )
                                        )}
                                        {item.expired && (
                                            <Badge tone="red">Hết hạn</Badge>
                                        )}
                                    </div>
                                </div>

                                {item.activeDocument && (
                                    <div className="ml-6 text-sm">
                                        <a
                                            href={resolveAssetUrl(
                                                typeof item.activeDocument
                                                    .fileAssetId === "string"
                                                    ? ""
                                                    : item.activeDocument
                                                          .fileAssetId.url,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            {typeof item.activeDocument
                                                .fileAssetId === "string"
                                                ? "Xem tệp"
                                                : item.activeDocument
                                                      .fileAssetId.name}
                                        </a>
                                        <div className="text-xs text-text_2">
                                            {actorLabel(
                                                item.activeDocument.uploadedBy,
                                            )}{" "}
                                            •{" "}
                                            {formatDateTime(
                                                item.activeDocument.createdAt,
                                            )}
                                            {item.activeDocument.docNumber &&
                                                ` • Số: ${item.activeDocument.docNumber}`}
                                            {item.activeDocument.issueDate &&
                                                ` • Cấp ngày: ${formatDate(item.activeDocument.issueDate)}`}
                                            {item.activeDocument.expiryDate &&
                                                ` • Hạn: ${formatDate(item.activeDocument.expiryDate)}`}
                                        </div>
                                        {item.activeDocument.status ===
                                            "rejected" &&
                                            item.activeDocument
                                                .rejectionReason && (
                                                <div className="mt-1 text-xs text-red-500">
                                                    Lý do: {item.activeDocument.rejectionReason}
                                                </div>
                                            )}
                                        {item.activeDocument.status ===
                                            "approved" &&
                                            item.activeDocument
                                                .approvalNote && (
                                                <div className="mt-1 text-xs text-text_2">
                                                    Ghi chú: {item.activeDocument.approvalNote}
                                                </div>
                                            )}
                                    </div>
                                )}

                                {item.activeDocument?.status === "pending" &&
                                    canReview(item) && (
                                        <div className="ml-6 mt-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    openReview(item)
                                                }
                                            >
                                                Duyệt / yêu cầu bổ sung
                                            </Button>
                                        </div>
                                    )}

                                {item.history.length > 0 && (
                                    <div className="ml-6 mt-2">
                                        <button
                                            type="button"
                                            className="text-xs text-primary hover:underline"
                                            onClick={() => toggleHistory(key)}
                                        >
                                            {historyOpen
                                                ? "Ẩn lịch sử nộp trước đây"
                                                : `Xem ${item.history.length} lần nộp trước đây`}
                                        </button>
                                        {historyOpen && (
                                            <div className="mt-1.5 flex flex-col gap-1">
                                                {item.history.map(h => (
                                                    <div
                                                        key={h._id}
                                                        className="text-xs text-text_2"
                                                    >
                                                        <Badge
                                                            tone={
                                                                BUSINESS_DOCUMENT_STATUS_TONE[
                                                                    h.status
                                                                ]
                                                            }
                                                        >
                                                            {
                                                                BUSINESS_DOCUMENT_STATUS_LABEL[
                                                                    h.status
                                                                ]
                                                            }
                                                        </Badge>{" "}
                                                        {formatDateTime(
                                                            h.createdAt,
                                                        )}
                                                        {h.rejectionReason &&
                                                            ` — ${h.rejectionReason}`}
                                                        {h.approvalNote &&
                                                            ` — ${h.approvalNote}`}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog
                open={!!reviewing}
                onOpenChange={open => !open && setReviewing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Duyệt giấy tờ
                            {reviewing ? `: ${documentTypeName(reviewing)}` : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label className="text-sm text-text_2">
                            Ghi chú (bắt buộc nếu yêu cầu bổ sung)
                        </Label>
                        <Textarea
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                            placeholder="VD: Ảnh mờ, thiếu trang, sai thông tin..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            loading={submittingDecision === "rejected"}
                            onClick={() => submitDecision("rejected")}
                        >
                            Yêu cầu bổ sung
                        </Button>
                        <Button
                            loading={submittingDecision === "approved"}
                            onClick={() => submitDecision("approved")}
                        >
                            Duyệt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RequiredDocumentsPanel;
