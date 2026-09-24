import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
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
import { Survey } from "@dts";
import { fetchSurveys } from "@service/surveyApi";
import SurveyRespondDialog from "./SurveyRespondDialog";
import {
    SurveyStatusToggleButton,
    SurveyTargetSummary,
    idOf,
    isSurveyCreatorOrCoEditor,
    surveyCoEditorNames,
    surveyCreatorName,
} from "./surveyShared";

const SurveyListPage: React.FC = () => (
    <AdminGuard permissions={["surveys.read"]}>
        <SurveyListContent />
    </AdminGuard>
);

const SurveyListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("surveys.create");
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
    // true neu nguoi dang nhap quan ly du lieu khong gioi han pham vi (backend
    // tra ve) - hien them cot Người tạo/Đối tượng va nut Mở/Đóng cho moi khao sat.
    const [canViewAll, setCanViewAll] = useState(false);
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
    const canPublishSurvey = (survey: Survey): boolean =>
        canPublish && (isOwnerOrCoEditor(survey) || canViewAll);
    // Chi nguoi thuoc doi tuong tra loi moi thay nut "Trả lời" - nguoi quan ly
    // chi xem (vd admin khong nam trong doi tuong) khong tra loi duoc.
    const canAnswerSurvey = (survey: Survey): boolean =>
        canRespond &&
        survey.status === "dang_mo" &&
        !!survey.isEligible &&
        !survey.hasResponded;
    const showRespondedColumn = canRespond && items.some(s => s.isEligible);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchSurveys(false, targetPage, size)
            .then(res => {
                setCanViewAll(!!res.canViewAll);
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => load(1), []);

    return (
        <div>
            <PageHeader
                title="Quản lý khảo sát"
                description="Tạo khảo sát và thu thập ý kiến cư dân."
                action={
                    canCreate && (
                        <Button onClick={() => navigate("/surveys/create")}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm mới
                        </Button>
                    )
                }
            />

            <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
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
                                {canViewAll && (
                                    <>
                                        <TableHead>Người tạo</TableHead>
                                        <TableHead>Đối tượng</TableHead>
                                    </>
                                )}
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Số câu hỏi</TableHead>
                                {showRespondedColumn && (
                                    <TableHead>Bạn đã trả lời</TableHead>
                                )}
                                <TableHead aria-label="Thao tác" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((s, index) => (
                                <TableRow
                                    key={s._id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/surveys/${s._id}`)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {s.title}
                                    </TableCell>
                                    {canViewAll && (
                                        <>
                                            <TableCell>
                                                <div>{surveyCreatorName(s)}</div>
                                                {surveyCoEditorNames(s).length >
                                                    0 && (
                                                    <div className="text-xs text-text_2">
                                                        Đồng chủ biên:{" "}
                                                        {surveyCoEditorNames(
                                                            s,
                                                        ).join(", ")}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <SurveyTargetSummary survey={s} />
                                            </TableCell>
                                        </>
                                    )}
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
                                    {showRespondedColumn && (
                                        <TableCell>
                                            {s.status !== "dang_mo" ||
                                            !s.isEligible ? (
                                                <span className="text-text_3">
                                                    —
                                                </span>
                                            ) : s.hasResponded ? (
                                                <Badge tone="green">
                                                    Đã trả lời
                                                </Badge>
                                            ) : (
                                                <Badge tone="gray">
                                                    Chưa trả lời
                                                </Badge>
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            {isOwnerOrCoEditor(s) && (
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
                                            )}
                                            {canAnswerSurvey(s) && (
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
                                            {canPublishSurvey(s) && (
                                                <SurveyStatusToggleButton
                                                    survey={s}
                                                    isCreatorOrCoEditor={isSurveyCreatorOrCoEditor(
                                                        s,
                                                        currentUser?.id,
                                                    )}
                                                    onChanged={() => load(page)}
                                                />
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
                onOpenChange={open => {
                    if (!open) {
                        setRespondingSurvey(null);
                        // Dong hop thoai co the vi vua gui cau tra loi thanh
                        // cong - tai lai trang de cot "Bạn đã trả lời" phan
                        // anh dung trang thai moi nhat.
                        load(page);
                    }
                }}
            />
        </div>
    );
};

export default SurveyListPage;
