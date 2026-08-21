import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Paperclip, Plus, Trash2, Upload } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import SendRequestSheet from "@components/admin/SendRequestSheet";
import RequestSubSection, {
    emptyRequestSubSection,
    isRequestSubSectionValid,
    RequestSubSectionValue,
} from "@components/admin/RequestSubSection";
import RecordHistorySection from "@components/admin/RecordHistorySection";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
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
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import StatCard from "@components/admin/StatCard";
import { usePermission } from "@store/authStore";
import { AppError, MucNguyCoPccc, PcccAttachment, PcccCheck, RequestItem } from "@dts";
import {
    MUC_NGUY_CO_PCCC_LABEL,
    MUC_NGUY_CO_PCCC_TONE,
    PCCC_AUDIT_ACTION_LABEL,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE, resolveAssetUrl } from "@constants/common";
import {
    createPcccCheck,
    deletePcccAttachment,
    deletePcccCheck,
    fetchPcccAttachments,
    fetchPcccAuditLogs,
    fetchPcccChecks,
    fetchPcccRiskSummary,
    updatePcccCheck,
    uploadPcccAttachment,
} from "@service/pcccApi";
import { createRequest, fetchRequests } from "@service/requestApi";
import PcccForm, {
    EMPTY_PCCC_FORM,
    PcccFormValues,
    isPcccFormValid,
    toPcccInput,
} from "./PcccForm";

const ALL_RISK_LEVELS = "all";

const houseText = (h: PcccCheck["houseId"]) => {
    if (typeof h === "string") return h;
    if (h) return `${h.code} — ${h.address}`;
    return "Nhà đã bị xóa";
};

const houseIdOf = (h: PcccCheck["houseId"]) =>
    typeof h === "string" ? h : h?._id || "";

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const checkToForm = (c: PcccCheck): PcccFormValues => ({
    houseId: houseIdOf(c.houseId),
    houseLabel: houseText(c.houseId),
    hasFireExtinguisher: c.hasFireExtinguisher,
    hasEmergencyExit: c.hasEmergencyExit,
    hasIndoorEvCharging: c.hasIndoorEvCharging,
    hasGasStoveOrStorageOrBusiness: c.hasGasStoveOrStorageOrBusiness,
    isCrowdedRental: c.isCrowdedRental,
    riskLevel: c.riskLevel,
    remediationNeeded: c.remediationNeeded || "",
    note: c.note || "",
    inspectionDate: c.inspectionDate ? c.inspectionDate.slice(0, 10) : "",
    followUpStatus: c.followUpStatus || "chua_khac_phuc",
});

const PcccListPage: React.FC = () => (
    <AdminGuard permissions={["pccc.read"]}>
        <PcccListContent />
    </AdminGuard>
);

const PcccListContent: React.FC = () => {
    const canCreate = usePermission("pccc.create");
    const canManage = usePermission("pccc.update");

    const [searchParams, setSearchParams] = useSearchParams();
    const [riskLevel, setRiskLevel] = useState<MucNguyCoPccc | "">(
        (searchParams.get("riskLevel") as MucNguyCoPccc | null) || "",
    );

    const [summary, setSummary] = useState<Record<string, number>>({});
    const [items, setItems] = useState<PcccCheck[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingCheck, setEditingCheck] = useState<PcccCheck | null>(null);
    const [form, setForm] = useState<PcccFormValues>(EMPTY_PCCC_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const canSendRequest = usePermission("requests.create");
    const [sendRequestOpen, setSendRequestOpen] = useState(false);
    const [relatedRequests, setRelatedRequests] = useState<RequestItem[]>([]);
    const [relatedRequestsLoading, setRelatedRequestsLoading] = useState(false);
    const [requestSubSection, setRequestSubSection] =
        useState<RequestSubSectionValue>(emptyRequestSubSection());

    const [attachments, setAttachments] = useState<PcccAttachment[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSummary = () => {
        fetchPcccRiskSummary()
            .then(setSummary)
            .catch(() => setSummary({}));
    };

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchPcccChecks({ page: targetPage, limit: size, riskLevel: riskLevel || undefined })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [riskLevel]);

    const handleRiskLevelChange = (value: string) => {
        const next = (value === ALL_RISK_LEVELS ? "" : value) as
            | MucNguyCoPccc
            | "";
        setRiskLevel(next);
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) {
                params.set("riskLevel", next);
            } else {
                params.delete("riskLevel");
            }
            return params;
        });
    };

    const openCreate = () => {
        setEditingId(null);
        setEditingCheck(null);
        setForm(EMPTY_PCCC_FORM);
        setAttachments([]);
        setRequestSubSection(emptyRequestSubSection("Xử lý nguy cơ PCCC"));
        setFormVisible(true);
    };

    const loadRelatedRequests = (checkId: string) => {
        setRelatedRequestsLoading(true);
        fetchRequests({ relatedModel: "PcccCheck", relatedId: checkId })
            .then(res => setRelatedRequests(res.items))
            .catch(() => setRelatedRequests([]))
            .finally(() => setRelatedRequestsLoading(false));
    };

    const openEdit = (c: PcccCheck) => {
        if (!canManage) return;
        setEditingId(c._id);
        setEditingCheck(c);
        setForm(checkToForm(c));
        setRequestSubSection(
            emptyRequestSubSection(`Xử lý nguy cơ PCCC — ${houseText(c.houseId)}`),
        );
        setFormVisible(true);
        loadRelatedRequests(c._id);

        setAttachmentsLoading(true);
        fetchPcccAttachments(c._id)
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !editingId) return;
        try {
            setUploading(true);
            const asset = await uploadPcccAttachment(editingId, file);
            setAttachments(prev => [asset, ...prev]);
            toast.success("Đã tải lên file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (fileId: string) => {
        if (!editingId) return;
        try {
            setDeletingAttachmentId(fileId);
            await deletePcccAttachment(editingId, fileId);
            setAttachments(prev => prev.filter(a => a._id !== fileId));
            toast.success("Đã xóa file đính kèm");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    const handleSubmit = async () => {
        if (!isPcccFormValid(form)) {
            toast.error("Vui lòng chọn hộ dân và ngày kiểm tra");
            return;
        }
        if (!isRequestSubSectionValid(requestSubSection)) {
            toast.error(
                "Vui lòng nhập tiêu đề và chọn ít nhất một người nhận cho yêu cầu",
            );
            return;
        }
        try {
            setSubmitting(true);
            const check = editingId
                ? await updatePcccCheck(editingId, toPcccInput(form))
                : await createPcccCheck(toPcccInput(form));
            toast.success(
                editingId ? "Đã cập nhật đợt kiểm tra" : "Đã thêm đợt kiểm tra PCCC",
            );

            if (requestSubSection.enabled) {
                try {
                    await createRequest({
                        type: "pccc",
                        title: requestSubSection.title,
                        relatedModel: "PcccCheck",
                        relatedId: check._id,
                        houseId: houseIdOf(check.houseId),
                        dueDate: requestSubSection.dueDate
                            ? new Date(requestSubSection.dueDate).toISOString()
                            : undefined,
                        targetUserIds: requestSubSection.targetUserIds,
                        targetRoles: requestSubSection.targetRoles,
                    });
                    toast.success("Đã gửi yêu cầu xử lý");
                } catch (err) {
                    toast.error(
                        `Đã lưu đợt kiểm tra nhưng gửi yêu cầu thất bại: ${(err as AppError).message}`,
                    );
                }
            }

            setFormVisible(false);
            load(1);
            loadSummary();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            setDeleting(true);
            await deletePcccCheck(confirmDeleteId);
            toast.success("Đã xóa đợt kiểm tra");
            setConfirmDeleteId(null);
            setFormVisible(false);
            load(1);
            loadSummary();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Phòng cháy chữa cháy"
                description="Quản lý hồ sơ, kiểm tra phòng cháy chữa cháy tại các nhà số/tổ chức."
                action={
                    canCreate && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm đợt kiểm tra
                        </Button>
                    )
                }
            />

            <div className="mb-4 flex items-center justify-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
                <StatCard label="Xanh" value={summary.xanh ?? 0} tone="success" />
                <StatCard label="Vàng" value={summary.vang ?? 0} tone="warning" />
                <StatCard label="Đỏ" value={summary.do ?? 0} tone="danger" />
            </div>

            <Select
                value={riskLevel || ALL_RISK_LEVELS}
                onValueChange={handleRiskLevelChange}
            >
                <SelectTrigger className="mb-4 max-w-xs">
                    <SelectValue placeholder="Lọc theo mức nguy cơ" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_RISK_LEVELS}>
                        Tất cả mức nguy cơ
                    </SelectItem>
                    {(
                        Object.entries(MUC_NGUY_CO_PCCC_LABEL) as [
                            MucNguyCoPccc,
                            string,
                        ][]
                    ).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có đợt kiểm tra PCCC nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Nhà</TableHead>
                                <TableHead>Ngày kiểm tra</TableHead>
                                <TableHead>Mức nguy cơ</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((c, index) => (
                                <TableRow
                                    key={c._id}
                                    className={canManage ? "cursor-pointer" : ""}
                                    onClick={
                                        canManage ? () => openEdit(c) : undefined
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {houseText(c.houseId)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(c.inspectionDate)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={MUC_NGUY_CO_PCCC_TONE[c.riskLevel]}
                                        >
                                            {MUC_NGUY_CO_PCCC_LABEL[c.riskLevel]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEdit(c)}
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}

            <Sheet open={formVisible} onOpenChange={setFormVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingId
                                ? "Sửa đợt kiểm tra PCCC"
                                : "Thêm đợt kiểm tra PCCC"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <PcccForm
                            values={form}
                            onChange={setForm}
                            afterRiskLevel={
                                form.riskLevel !== "xanh" && (
                                    <RequestSubSection
                                        type="pccc"
                                        value={requestSubSection}
                                        onChange={setRequestSubSection}
                                    />
                                )
                            }
                            afterInspectionDate={
                                editingId && (
                                    <div className="rounded-lg border border-divider_01 p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">
                                                Yêu cầu liên quan
                                            </h3>
                                            {canSendRequest && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSendRequestOpen(true)
                                                    }
                                                >
                                                    Gửi yêu cầu
                                                </Button>
                                            )}
                                        </div>
                                        {relatedRequestsLoading && (
                                            <LoadingState />
                                        )}
                                        {!relatedRequestsLoading &&
                                            relatedRequests.length === 0 && (
                                                <EmptyState label="Chưa có yêu cầu nào liên quan" />
                                            )}
                                        {!relatedRequestsLoading &&
                                            relatedRequests.map(r => (
                                                <div
                                                    key={r._id}
                                                    className="border-b border-divider_01 py-2 text-sm last:border-0"
                                                >
                                                    <div className="font-medium">
                                                        {r.title}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {r.recipients.map(
                                                            rec => (
                                                                <Badge
                                                                    key={
                                                                        rec._id
                                                                    }
                                                                    tone={
                                                                        rec.isOverdue
                                                                            ? "red"
                                                                            : REQUEST_STATUS_TONE[
                                                                                  rec
                                                                                      .status
                                                                              ]
                                                                    }
                                                                >
                                                                    {
                                                                        rec.displayName
                                                                    }{" "}
                                                                    ·{" "}
                                                                    {
                                                                        REQUEST_STATUS_LABEL[
                                                                            rec
                                                                                .status
                                                                        ]
                                                                    }
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )
                            }
                        />

                        {editingId && (
                            <div className="mt-5 border-t border-divider_01 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Tệp đính kèm
                                    </h3>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={uploading}
                                            onClick={handleUploadClick}
                                        >
                                            <Upload className="mr-1 h-3.5 w-3.5" />
                                            Tải lên
                                        </Button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        onChange={handleFileSelected}
                                    />
                                </div>
                                {attachmentsLoading && <LoadingState />}
                                {!attachmentsLoading &&
                                    attachments.length === 0 && (
                                        <EmptyState label="Chưa có file đính kèm" />
                                    )}
                                {!attachmentsLoading &&
                                    attachments.map(a => (
                                        <div
                                            key={a._id}
                                            className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                                        >
                                            <a
                                                href={resolveAssetUrl(a.url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-primary hover:underline"
                                            >
                                                <Paperclip className="h-3.5 w-3.5" />
                                                {a.name}
                                            </a>
                                            {canManage && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="!text-red-500"
                                                    loading={
                                                        deletingAttachmentId ===
                                                        a._id
                                                    }
                                                    onClick={() =>
                                                        handleDeleteAttachment(
                                                            a._id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}

                        {editingId && (
                            <RecordHistorySection
                                className="mt-5 border-t border-divider_01 pt-4"
                                fetchHistory={params =>
                                    fetchPcccAuditLogs(editingId, params)
                                }
                                actionLabels={PCCC_AUDIT_ACTION_LABEL}
                                historyHref={`/pccc/${editingId}/history`}
                            />
                        )}
                    </div>
                    <SheetFooter>
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            {editingId ? "Lưu thay đổi" : "Thêm đợt kiểm tra"}
                        </Button>
                        {canManage && editingId && (
                            <Button
                                variant="outline"
                                className="w-full text-red-500"
                                onClick={() => setConfirmDeleteId(editingId)}
                            >
                                Xóa đợt kiểm tra
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!confirmDeleteId}
                onOpenChange={open => !open && setConfirmDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa đợt kiểm tra?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa đợt kiểm tra PCCC này? Hành động
                        này không thể hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDeleteId(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editingId && (
                <SendRequestSheet
                    open={sendRequestOpen}
                    onOpenChange={setSendRequestOpen}
                    lockedType="pccc"
                    relatedModel="PcccCheck"
                    relatedId={editingId}
                    defaultTitle="Theo dõi khắc phục PCCC"
                    defaultHouseId={editingCheck ? houseIdOf(editingCheck.houseId) : undefined}
                    defaultHouseLabel={
                        editingCheck ? houseText(editingCheck.houseId) : undefined
                    }
                    onCreated={() => loadRelatedRequests(editingId)}
                />
            )}
        </div>
    );
};

export default PcccListPage;
