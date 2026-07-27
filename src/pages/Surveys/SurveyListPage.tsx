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
import { usePermission } from "@store/authStore";
import {
    TRANG_THAI_KHAO_SAT_LABEL,
    TRANG_THAI_KHAO_SAT_TONE,
} from "@constants/domain";
import { AppError, Survey } from "@dts";
import { closeSurvey, fetchSurveys, openSurvey } from "@service/surveyApi";

const SurveyListPage: React.FC = () => (
    <AdminGuard permissions={["surveys.read"]}>
        <SurveyListContent />
    </AdminGuard>
);

const SurveyListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("surveys.create");
    const canEdit = usePermission("surveys.update");
    const canPublish = usePermission("surveys.publish");

    const [items, setItems] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchSurveys(false)
            .then(res => setItems(res.items))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

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
                {canCreate && (
                    <Button onClick={() => navigate("/surveys/create")}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm mới
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có khảo sát nào được tạo" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên khảo sát</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Số câu hỏi</TableHead>
                                <TableHead aria-label="Thao tác" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(s => (
                                <TableRow
                                    key={s._id}
                                    className={canEdit ? "cursor-pointer" : ""}
                                    onClick={
                                        canEdit
                                            ? () =>
                                                  navigate(
                                                      `/surveys/${s._id}/edit`,
                                                  )
                                            : undefined
                                    }
                                >
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
                                            {canPublish &&
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
        </div>
    );
};

export default SurveyListPage;
