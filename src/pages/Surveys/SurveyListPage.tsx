import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { useAuthStore, usePermission } from "@store/authStore";
import {
    TRANG_THAI_KHAO_SAT_LABEL,
    TRANG_THAI_KHAO_SAT_TONE,
} from "@constants/domain";
import { AppError, Survey } from "@dts";
import { closeSurvey, fetchSurveys, openSurvey } from "@service/surveyApi";
import SurveyRespondDialog from "./SurveyRespondDialog";

const idOf = (ref?: string | { _id: string }): string | undefined =>
    !ref ? undefined : typeof ref === "string" ? ref : ref._id;

const SurveyListPage: React.FC = () => (
    <AdminGuard permissions={["surveys.read"]}>
        <SurveyListContent />
    </AdminGuard>
);

const SurveyListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("surveys.create");
    const hasUpdatePermission = usePermission("surveys.update");
    const canPublish = usePermission("surveys.publish");
    const canRespond = usePermission("surveys.respond");
    const currentUser = useAuthStore(state => state.user);
    const isAdmin = !!currentUser?.roles.includes("admin");

    const [items, setItems] = useState<Survey[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);
    const [respondingSurvey, setRespondingSurvey] = useState<Survey | null>(
        null,
    );

    // Chi chu khao sat (createdBy) hoac dong chu bien (coEditorUserIds) moi
    // duoc sua/mo/dong/xoa - khac voi truoc day (bat ky ai co quyen
    // "surveys.update"/"surveys.publish" deu thao tac duoc tren khao sat cua
    // nguoi khac). Backend da chan (assertSurveyEditable, ap dung chung cho ca
    // update/open/close/delete) - day chi la an bot thao tac khong dung duoc
    // de tranh nguoi dung bam vao roi gap loi 403.
    const isOwnerOrCoEditor = (survey: Survey): boolean => {
        if (!currentUser) return false;
        if (isAdmin) return true;
        if (idOf(survey.createdBy) === currentUser.id) return true;
        return (survey.coEditorUserIds || []).some(
            u => idOf(u) === currentUser.id,
        );
    };
    const canEditSurvey = (survey: Survey): boolean =>
        hasUpdatePermission && isOwnerOrCoEditor(survey);
    const canPublishSurvey = (survey: Survey): boolean =>
        canPublish && isOwnerOrCoEditor(survey);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchSurveys(false, targetPage, size)
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => load(1), []);

    const handleToggle = async (e: React.MouseEvent, survey: Survey) => {
        e.stopPropagation();
        try {
            setActingId(survey._id);
            if (survey.status === "dang_mo") {
                await closeSurvey(survey._id);
                toast.success("Đã đóng khảo sát");
            } else {
                await openSurvey(survey._id);
                toast.success("Đã mở khảo sát");
            }
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setActingId(null);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Quản lý khảo sát</h1>
                <div className="flex items-center gap-3">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={size => {
                            setPageSize(size);
                            load(1, size);
                        }}
                    />
                    {canCreate && (
                        <Button onClick={() => navigate("/surveys/create")}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm mới
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có khảo sát nào được tạo" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tên khảo sát</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Số câu hỏi</TableHead>
                                <TableHead aria-label="Thao tác" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((s, index) => (
                                <TableRow
                                    key={s._id}
                                    className={
                                        canEditSurvey(s) ? "cursor-pointer" : ""
                                    }
                                    onClick={
                                        canEditSurvey(s)
                                            ? () =>
                                                  navigate(
                                                      `/surveys/${s._id}/edit`,
                                                  )
                                            : undefined
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {s.title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                TRANG_THAI_KHAO_SAT_TONE[
                                                    s.status
                                                ]
                                            }
                                        >
                                            {
                                                TRANG_THAI_KHAO_SAT_LABEL[
                                                    s.status
                                                ]
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{s.questions.length}</TableCell>
                                    <TableCell
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    navigate(
                                                        `/surveys/${s._id}/results`,
                                                    )
                                                }
                                            >
                                                Kết quả
                                            </Button>
                                            {canRespond &&
                                                s.status === "dang_mo" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setRespondingSurvey(
                                                                s,
                                                            )
                                                        }
                                                    >
                                                        Trả lời
                                                    </Button>
                                                )}
                                            {canPublishSurvey(s) &&
                                                s.status !== "da_dong" && (
                                                    <Button
                                                        size="sm"
                                                        loading={
                                                            actingId === s._id
                                                        }
                                                        onClick={e =>
                                                            handleToggle(e, s)
                                                        }
                                                    >
                                                        {s.status === "dang_mo"
                                                            ? "Đóng"
                                                            : "Mở"}
                                                    </Button>
                                                )}
                                        </div>
                                    </TableCell>
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

            <SurveyRespondDialog
                survey={respondingSurvey}
                onOpenChange={open => !open && setRespondingSurvey(null)}
            />
        </div>
    );
};

export default SurveyListPage;
