import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Bell,
    Lock,
    Play,
    RotateCcw,
    Send,
    UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import { Badge, type BadgeTone } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import type {
    AppError,
    AssignableStaff,
    InspectionCampaign,
    InspectionResultStatus,
    InspectionTarget,
} from "@dts";
import { usePermission } from "@store/authStore";
import { fetchAssignableStaffByRoles } from "@service/userApi";
import {
    assignInspectionTargets,
    fetchInspectionCampaign,
    fetchInspectionTargets,
    remindInspection,
    sendInspectionForm,
    submitInspectionToWard,
    transitionInspectionCampaign,
} from "@service/inspectionApi";

const RESULT_STATUS: Record<InspectionResultStatus, { label: string; tone: BadgeTone }> = {
    PENDING: { label: "Chưa thực hiện", tone: "gray" },
    DRAFT: { label: "Bản nháp", tone: "yellow" },
    SUBMITTED: { label: "Chờ xác minh", tone: "blue" },
    VERIFIED: { label: "Đã xác minh", tone: "green" },
    REQUEST_REVISION: { label: "Cần bổ sung", tone: "red" },
    FIELD_CHECK_REQUIRED: { label: "Cần kiểm tra thực địa", tone: "yellow" },
};

const houseOf = (target: InspectionTarget) =>
    typeof target.houseId === "string" ? null : target.houseId;

const InspectionCampaignDetailPage: React.FC = () => (
    <AdminGuard permissions={["inspections.read"]}>
        <InspectionCampaignDetailContent />
    </AdminGuard>
);

const InspectionCampaignDetailContent: React.FC = () => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const canAssign = usePermission("inspections.assign");
    const canExecute = usePermission("inspections.execute");
    const canSubmitWard = usePermission("inspections.submit_to_ward");
    const canManage = usePermission("inspections.manage");
    const [campaign, setCampaign] = useState<InspectionCampaign | null>(null);
    const [targets, setTargets] = useState<InspectionTarget[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState("ALL");
    const [selected, setSelected] = useState<string[]>([]);
    const [collaborators, setCollaborators] = useState<AssignableStaff[]>([]);
    const [collaboratorId, setCollaboratorId] = useState("");
    const [submissionNeighborhoodId, setSubmissionNeighborhoodId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [working, setWorking] = useState(false);

    const load = async (targetPage = 1) => {
        setLoading(true);
        setError(false);
        try {
            const pendingFilters = ["not_sent", "unopened", "not_submitted", "overdue"];
            const [campaignData, targetData] = await Promise.all([
                fetchInspectionCampaign(id),
                fetchInspectionTargets(id, {
                    page: targetPage,
                    resultStatus: filter !== "ALL" && !pendingFilters.includes(filter) ? filter : undefined,
                    pending: pendingFilters.includes(filter) ? filter : undefined,
                }),
            ]);
            setCampaign(campaignData);
            if (campaignData.availableNeighborhoods?.length === 1) {
                setSubmissionNeighborhoodId(campaignData.availableNeighborhoods[0]._id);
            }
            setTargets(targetData.items);
            setPage(targetData.page);
            setTotalPages(targetData.totalPages);
            setSelected([]);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, filter]);

    useEffect(() => {
        if (!canAssign) return;
        fetchAssignableStaffByRoles(["neighborhood_collaborator", "cooperator"])
            .then(setCollaborators)
            .catch(() => setCollaborators([]));
    }, [canAssign]);

    const allSelected = targets.length > 0 && targets.every(target => selected.includes(target._id));
    const editable = campaign?.status === "ACTIVE";
    const summary = campaign?.summary;
    const run = async (action: () => Promise<unknown>, message: string) => {
        try {
            setWorking(true);
            await action();
            toast.success(message);
            await load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setWorking(false);
        }
    };

    const handleAssign = () => {
        if (!collaboratorId || selected.length === 0) {
            toast.error("Chọn ít nhất một Nhà số và một cộng tác viên");
            return;
        }
        run(
            () => assignInspectionTargets(id, selected, collaboratorId),
            `Đã giao ${selected.length} Nhà số`,
        );
    };

    if (loading && !campaign) return <LoadingState label="Đang tải chiến dịch..." />;
    if (error && !campaign) return <ErrorState onRetry={() => load(page)} />;
    if (!campaign) return null;

    return (
        <div className="space-y-4">
            <div>
                <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate("/inspections")}>
                    <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
                </Button>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold">{campaign.name}</h1>
                            <Badge tone={campaign.status === "ACTIVE" ? "blue" : "gray"}>{campaign.status}</Badge>
                        </div>
                        <p className="mt-2 max-w-3xl text-sm text-text_2">{campaign.purpose}</p>
                        <p className="mt-2 text-sm text-text_2">
                            Hạn: {new Date(campaign.dueAt).toLocaleDateString("vi-VN")}
                            {campaign.requiredEvidence ? " · Bắt buộc minh chứng" : ""}
                            {campaign.allowSelfDeclaration ? " · Cho phép Nhà số tự khai" : ""}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canManage && campaign.status === "DRAFT" && (
                            <Button
                                loading={working}
                                onClick={() => run(
                                    () => transitionInspectionCampaign(id, "publish"),
                                    "Đã triển khai chiến dịch tới Tổ dân phố",
                                )}
                            >
                                <Play className="h-4 w-4" /> Triển khai
                            </Button>
                        )}
                        {canManage && campaign.status === "ACTIVE" && (
                            <Button
                                variant="outline"
                                loading={working}
                                onClick={() => run(
                                    () => transitionInspectionCampaign(id, "lock"),
                                    "Đã khóa chiến dịch",
                                )}
                            >
                                <Lock className="h-4 w-4" /> Khóa
                            </Button>
                        )}
                        {canManage && campaign.status === "LOCKED" && (
                            <Button
                                loading={working}
                                onClick={() => run(
                                    () => transitionInspectionCampaign(id, "reopen"),
                                    "Đã mở lại chiến dịch",
                                )}
                            >
                                <RotateCcw className="h-4 w-4" /> Mở lại
                            </Button>
                        )}
                        {canManage && ["ACTIVE", "LOCKED"].includes(campaign.status) && (
                            <Button
                                variant="outline"
                                loading={working}
                                onClick={() => run(
                                    () => transitionInspectionCampaign(id, "close"),
                                    "Đã kết thúc chiến dịch",
                                )}
                            >
                                Kết thúc
                            </Button>
                        )}
                        {canSubmitWard && (campaign.availableNeighborhoods?.length || 0) > 1 && (
                            <Select
                                value={submissionNeighborhoodId}
                                onValueChange={setSubmissionNeighborhoodId}
                            >
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Chọn Tổ cần nộp" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(campaign.availableNeighborhoods || []).map(neighborhood => (
                                        <SelectItem key={neighborhood._id} value={neighborhood._id}>
                                            {neighborhood.code} · {neighborhood.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {canAssign && editable && (
                            <Button
                                variant="outline"
                                loading={working}
                                onClick={() => run(() => remindInspection(id, selected), "Đã gửi nhắc thực hiện")}
                            >
                                <Bell className="h-4 w-4" /> Nhắc {selected.length ? "đã chọn" : "tất cả"}
                            </Button>
                        )}
                        {canSubmitWard && editable && (
                            <Button
                                loading={working}
                                disabled={(campaign.availableNeighborhoods?.length || 0) > 1 && !submissionNeighborhoodId}
                                onClick={() => run(
                                    () => submitInspectionToWard(id, submissionNeighborhoodId || undefined),
                                    "Đã nộp tổng hợp lên Phường",
                                )}
                            >
                                <Send className="h-4 w-4" /> Gửi Phường
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {canSubmitWard && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="text-sm font-semibold text-blue-900">
                        Nơi nhận báo cáo tổng hợp
                    </div>
                    <div className="mt-1 text-sm text-blue-800">
                        {campaign.submissionDestination?.wardName || campaign.wardName || "Phường/xã phát hành chiến dịch"}
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                        Người tiếp nhận: {campaign.submissionDestination?.recipients
                            .map(recipient => recipient.displayName)
                            .join(", ") || (
                            typeof campaign.createdByWardUserId === "string"
                                ? "Tài khoản tạo chiến dịch"
                                : campaign.createdByWardUserId.displayName
                        )}
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                        Nút “Gửi Phường” sẽ gửi cố định tới nơi nhận trên; Tổ dân phố không cần chọn lại người nhận.
                    </div>
                    {(campaign.neighborhoodSubmissions?.length || 0) > 0 && (
                        <div className="mt-3 border-t border-blue-200 pt-2 text-xs text-blue-800">
                            {campaign.neighborhoodSubmissions?.map(submission => {
                                const neighborhood = campaign.availableNeighborhoods?.find(
                                    item => item._id === submission.neighborhoodId,
                                );
                                const submitter = typeof submission.submittedByUserId === "string"
                                    ? "Người gửi"
                                    : submission.submittedByUserId.displayName;
                                return (
                                    <div key={submission.neighborhoodId} className="mt-1">
                                        Đã gửi {neighborhood?.name || "tổng hợp của Tổ"} lúc {new Date(submission.submittedAt).toLocaleString("vi-VN")} · {submitter}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {summary && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {[
                        ["Tổng Nhà", summary.totalHouses],
                        ["Đạt", summary.pass],
                        ["Chưa đạt", summary.fail],
                        ["Chưa kiểm tra", summary.unchecked],
                        ["Cần bổ sung", summary.needsSupplement],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-divider_01 bg-white p-4 shadow-sm">
                            <div className="text-2xl font-semibold">{value}</div>
                            <div className="mt-1 text-xs text-text_2">{label}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-divider_01 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-full lg:w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả Nhà số</SelectItem>
                            {Object.entries(RESULT_STATUS).map(([value, meta]) => (
                                <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                            ))}
                            <SelectItem value="not_sent">Chưa gửi tự khai</SelectItem>
                            <SelectItem value="unopened">Chưa mở</SelectItem>
                            <SelectItem value="not_submitted">Chưa submit</SelectItem>
                            <SelectItem value="overdue">Quá hạn</SelectItem>
                        </SelectContent>
                    </Select>
                    {canAssign && editable && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Select value={collaboratorId} onValueChange={setCollaboratorId}>
                                <SelectTrigger className="w-full sm:w-56">
                                    <SelectValue placeholder="Chọn cộng tác viên" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collaborators.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAssign} loading={working}>
                                <UserRoundCheck className="h-4 w-4" /> Giao {selected.length || "Nhà"}
                            </Button>
                        </div>
                    )}
                </div>

                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && targets.length === 0 && <EmptyState label="Không có Nhà số phù hợp bộ lọc" />}
                {!loading && !error && targets.length > 0 && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {canAssign && <TableHead className="w-10">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={checked => setSelected(checked ? targets.map(item => item._id) : [])}
                                        />
                                    </TableHead>}
                                    <TableHead>Nhà số / địa chỉ</TableHead>
                                    <TableHead>Người thực hiện</TableHead>
                                    <TableHead>Tự khai</TableHead>
                                    <TableHead>Kết quả</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {targets.map(target => {
                                    const house = houseOf(target);
                                    const assignee = target.assignedCollaboratorUserId;
                                    return (
                                        <TableRow key={target._id}>
                                            {canAssign && <TableCell>
                                                <Checkbox
                                                    checked={selected.includes(target._id)}
                                                    onCheckedChange={checked => setSelected(current =>
                                                        checked
                                                            ? [...current, target._id]
                                                            : current.filter(item => item !== target._id),
                                                    )}
                                                />
                                            </TableCell>}
                                            <TableCell>
                                                <div className="font-medium">{house?.code || "—"}</div>
                                                <div className="text-xs text-text_2">{house?.address || "—"}</div>
                                            </TableCell>
                                            <TableCell>
                                                {assignee && typeof assignee !== "string" ? assignee.displayName : "Chưa giao"}
                                            </TableCell>
                                            <TableCell><Badge>{target.selfDeclarationStatus}</Badge></TableCell>
                                            <TableCell>
                                                <Badge tone={RESULT_STATUS[target.resultStatus].tone}>
                                                    {RESULT_STATUS[target.resultStatus].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    {canAssign && editable && campaign.allowSelfDeclaration && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            loading={working}
                                                            onClick={() => run(
                                                                () => sendInspectionForm(target._id),
                                                                "Đã gửi biểu mẫu tự khai",
                                                            )}
                                                        >
                                                            Gửi form
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant={canExecute ? "default" : "outline"}
                                                        onClick={() => navigate(`/inspections/targets/${target._id}`)}
                                                    >
                                                        {target.result ? "Mở kết quả" : "Rà soát"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
                {!loading && !error && totalPages > 1 && (
                    <div className="p-4">
                        <Pagination page={page} totalPages={totalPages} onPageChange={load} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InspectionCampaignDetailPage;
