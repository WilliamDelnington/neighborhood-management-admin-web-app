import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Trash2, X } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import {
    LOAI_CAU_HOI_KHAO_SAT_LABEL,
    SURVEY_AUDIT_ACTION_LABEL,
} from "@constants/domain";
import { AppError, BusinessType, LoaiCauHoiKhaoSat, Neighborhood, RoleRecord, Street, SurveyQuestion } from "@dts";
import {
    createSurvey,
    fetchSurveyAuditLogs,
    fetchSurveyDetail,
    SurveyInput,
    updateSurvey,
} from "@service/surveyApi";
import { fetchStreets } from "@service/streetApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import { fetchBusinessTypes } from "@service/businessTypeApi";
import { fetchRoles } from "@service/roleApi";

const idOf = (ref: string | { _id: string }): string =>
    typeof ref === "string" ? ref : ref._id;

type DraftQuestion = SurveyQuestion;

const EMPTY_QUESTION: DraftQuestion = {
    question: "",
    type: "chon_mot",
    options: ["", ""],
    required: true,
};

const OPTIONS_TYPES: LoaiCauHoiKhaoSat[] = ["chon_mot", "chon_nhieu"];

const SurveyFormPage: React.FC = () => (
    <AdminGuard permissions={["surveys.create", "surveys.update"]}>
        <SurveyFormContent />
    </AdminGuard>
);

const SurveyFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canSave = usePermission(isEdit ? "surveys.update" : "surveys.create");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<DraftQuestion[]>([
        { ...EMPTY_QUESTION },
    ]);

    const [eligibleAll, setEligibleAll] = useState(true);
    const [eligibleRoles, setEligibleRoles] = useState<string[]>([]);
    const [eligibleStreetIds, setEligibleStreetIds] = useState<string[]>([]);
    const [eligibleNeighborhoodIds, setEligibleNeighborhoodIds] = useState<
        string[]
    >([]);
    const [eligibleBusinessTypeIds, setEligibleBusinessTypeIds] = useState<
        string[]
    >([]);

    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [streets, setStreets] = useState<Street[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

    const loadDetail = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchSurveyDetail(id)
            .then(s => {
                setTitle(s.title);
                setDescription(s.description || "");
                setQuestions(
                    s.questions.length > 0
                        ? s.questions.map(q => ({
                              _id: q._id,
                              question: q.question,
                              type: q.type,
                              options: q.options?.length ? q.options : ["", ""],
                              required: q.required,
                          }))
                        : [{ ...EMPTY_QUESTION }],
                );
                setEligibleAll(s.eligibleAll ?? true);
                setEligibleRoles(s.eligibleRoles || []);
                setEligibleStreetIds((s.eligibleStreetIds || []).map(idOf));
                setEligibleNeighborhoodIds(
                    (s.eligibleNeighborhoodIds || []).map(idOf),
                );
                setEligibleBusinessTypeIds(
                    (s.eligibleBusinessTypeIds || []).map(idOf),
                );
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        fetchRoles({ limit: 100, active: true })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
        fetchStreets({ limit: 200, active: true })
            .then(res => setStreets(res.items))
            .catch(() => setStreets([]));
        fetchNeighborhoods({ limit: 200, active: true })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
        fetchBusinessTypes({ limit: 200, active: true })
            .then(res => setBusinessTypes(res.items))
            .catch(() => setBusinessTypes([]));
    }, []);

    const toggleId = (
        list: string[],
        setList: (v: string[]) => void,
        id2: string,
    ) => {
        setList(
            list.includes(id2) ? list.filter(x => x !== id2) : [...list, id2],
        );
    };

    const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
        setQuestions(prev =>
            prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
        );
    };

    const addQuestion = () => {
        setQuestions(prev => [...prev, { ...EMPTY_QUESTION }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        setQuestions(prev =>
            prev.map((q, i) =>
                i === qIndex
                    ? {
                          ...q,
                          options: q.options.map((o, j) =>
                              j === optIndex ? value : o,
                          ),
                      }
                    : q,
            ),
        );
    };

    const addOption = (qIndex: number) => {
        setQuestions(prev =>
            prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ""] } : q,
            ),
        );
    };

    const removeOption = (qIndex: number, optIndex: number) => {
        setQuestions(prev =>
            prev.map((q, i) =>
                i === qIndex
                    ? {
                          ...q,
                          options: q.options.filter((_, j) => j !== optIndex),
                      }
                    : q,
            ),
        );
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Vui lòng nhập tên khảo sát");
            return;
        }
        if (questions.length === 0 || questions.some(q => !q.question.trim())) {
            toast.error("Vui lòng nhập đầy đủ nội dung câu hỏi");
            return;
        }
        for (const q of questions) {
            if (
                OPTIONS_TYPES.includes(q.type) &&
                q.options.filter(o => o.trim()).length < 2
            ) {
                toast.error(`Câu hỏi "${q.question}" cần ít nhất 2 lựa chọn`);
                return;
            }
        }

        const preparedQuestions: DraftQuestion[] = questions.map(q => ({
            _id: q._id,
            question: q.question.trim(),
            type: q.type,
            required: q.required,
            options: OPTIONS_TYPES.includes(q.type)
                ? q.options.map(o => o.trim()).filter(Boolean)
                : [],
        }));

        const input: SurveyInput = {
            title: title.trim(),
            description: description.trim() || undefined,
            questions: preparedQuestions,
            eligibleAll,
            eligibleRoles: eligibleAll ? [] : eligibleRoles,
            eligibleStreetIds: eligibleAll ? [] : eligibleStreetIds,
            eligibleNeighborhoodIds: eligibleAll ? [] : eligibleNeighborhoodIds,
            eligibleBusinessTypeIds: eligibleAll ? [] : eligibleBusinessTypeIds,
        };

        try {
            setSaving(true);
            if (isEdit && id) {
                await updateSurvey(id, input);
                toast.success("Đã cập nhật khảo sát");
            } else {
                await createSurvey(input);
                toast.success("Đã tạo khảo sát");
            }
            navigate("/surveys");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/surveys")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa khảo sát" : "Thêm khảo sát"}
                </h1>
            </div>

            <div className="max-w-2xl">
                {isEdit && loading && (
                    <div className="rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                        <LoadingState />
                    </div>
                )}
                {isEdit && !loading && loadError && (
                    <div className="rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                        <ErrorState onRetry={loadDetail} />
                    </div>
                )}
                {(!isEdit || (!loading && !loadError)) && (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Tên khảo sát</Label>
                                    <Input
                                        placeholder="Nhập tên khảo sát"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Mô tả (nếu có)</Label>
                                    <Textarea
                                        placeholder="Mô tả mục đích khảo sát"
                                        rows={3}
                                        value={description}
                                        onChange={e =>
                                            setDescription(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                            <h2 className="mb-3 text-sm font-semibold">
                                Đối tượng được trả lời
                            </h2>

                            <label className="mb-3 flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={eligibleAll}
                                    onCheckedChange={checked =>
                                        setEligibleAll(checked === true)
                                    }
                                />
                                Áp dụng cho tất cả mọi người
                            </label>

                            {!eligibleAll && (
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <Label className="mb-1.5 block">
                                            Vai trò
                                        </Label>
                                        <div className="flex flex-wrap gap-3">
                                            {roles.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có vai trò nào
                                                </span>
                                            )}
                                            {roles.map(r => (
                                                <label
                                                    key={r.key}
                                                    className="flex items-center gap-1.5 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={eligibleRoles.includes(
                                                            r.key,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleId(
                                                                eligibleRoles,
                                                                setEligibleRoles,
                                                                r.key,
                                                            )
                                                        }
                                                    />
                                                    {r.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Đường / phố
                                        </Label>
                                        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {streets.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có đường/phố nào
                                                </span>
                                            )}
                                            {streets.map(s => (
                                                <label
                                                    key={s._id}
                                                    className="flex items-center gap-1.5 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={eligibleStreetIds.includes(
                                                            s._id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleId(
                                                                eligibleStreetIds,
                                                                setEligibleStreetIds,
                                                                s._id,
                                                            )
                                                        }
                                                    />
                                                    {s.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Tổ dân phố
                                        </Label>
                                        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {neighborhoods.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có tổ dân phố nào
                                                </span>
                                            )}
                                            {neighborhoods.map(n => (
                                                <label
                                                    key={n._id}
                                                    className="flex items-center gap-1.5 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={eligibleNeighborhoodIds.includes(
                                                            n._id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleId(
                                                                eligibleNeighborhoodIds,
                                                                setEligibleNeighborhoodIds,
                                                                n._id,
                                                            )
                                                        }
                                                    />
                                                    {n.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-1.5 block">
                                            Loại hình kinh doanh
                                        </Label>
                                        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                            {businessTypes.length === 0 && (
                                                <span className="text-xs text-text_2">
                                                    Chưa có loại hình kinh doanh nào
                                                </span>
                                            )}
                                            {businessTypes.map(bt => (
                                                <label
                                                    key={bt._id}
                                                    className="flex items-center gap-1.5 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={eligibleBusinessTypeIds.includes(
                                                            bt._id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleId(
                                                                eligibleBusinessTypeIds,
                                                                setEligibleBusinessTypeIds,
                                                                bt._id,
                                                            )
                                                        }
                                                    />
                                                    {bt.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-text_2">
                                        Người trả lời phải khớp vai trò đã chọn
                                        (nếu có) VÀ khớp ít nhất một trong các
                                        tiêu chí đường/phố, tổ dân phố, hoặc
                                        loại hình kinh doanh (nếu có chọn).
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="mb-2 text-sm font-semibold">
                                Danh sách câu hỏi
                            </h2>

                            <div className="flex flex-col gap-3">
                                {questions.map((q, qIndex) => (
                                    <div
                                        key={qIndex}
                                        className="rounded-2xl border border-divider_01 bg-white p-4 shadow-sm"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-medium text-text_2">
                                                Câu hỏi {qIndex + 1}
                                            </span>
                                            {questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="text-red-500"
                                                    onClick={() =>
                                                        removeQuestion(qIndex)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <Input
                                            placeholder="Nhập nội dung câu hỏi"
                                            value={q.question}
                                            onChange={e =>
                                                updateQuestion(qIndex, {
                                                    question: e.target.value,
                                                })
                                            }
                                        />

                                        <div className="mt-3 space-y-1.5">
                                            <Label>Loại câu hỏi</Label>
                                            <Select
                                                value={q.type}
                                                onValueChange={val =>
                                                    updateQuestion(qIndex, {
                                                        type: val as LoaiCauHoiKhaoSat,
                                                        options:
                                                            OPTIONS_TYPES.includes(
                                                                val as LoaiCauHoiKhaoSat,
                                                            ) &&
                                                            q.options.length < 2
                                                                ? ["", ""]
                                                                : q.options,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(
                                                        Object.entries(
                                                            LOAI_CAU_HOI_KHAO_SAT_LABEL,
                                                        ) as [
                                                            LoaiCauHoiKhaoSat,
                                                            string,
                                                        ][]
                                                    ).map(([key, label]) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={key}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {OPTIONS_TYPES.includes(q.type) && (
                                            <div className="mt-3">
                                                <Label className="mb-1 block">
                                                    Các lựa chọn
                                                </Label>
                                                <div className="flex flex-col gap-2">
                                                    {q.options.map(
                                                        (opt, optIndex) => (
                                                            <div
                                                                key={optIndex}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Input
                                                                    className="flex-1"
                                                                    placeholder={`Lựa chọn ${
                                                                        optIndex +
                                                                        1
                                                                    }`}
                                                                    value={opt}
                                                                    onChange={e =>
                                                                        updateOption(
                                                                            qIndex,
                                                                            optIndex,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                {q.options
                                                                    .length >
                                                                    2 && (
                                                                    <button
                                                                        type="button"
                                                                        className="text-text_3"
                                                                        onClick={() =>
                                                                            removeOption(
                                                                                qIndex,
                                                                                optIndex,
                                                                            )
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="mt-2 text-xs font-medium text-primary"
                                                    onClick={() =>
                                                        addOption(qIndex)
                                                    }
                                                >
                                                    + Thêm lựa chọn
                                                </button>
                                            </div>
                                        )}

                                        <label
                                            htmlFor={`required-${qIndex}`}
                                            className="mt-3 flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                id={`required-${qIndex}`}
                                                checked={q.required}
                                                onCheckedChange={checked =>
                                                    updateQuestion(qIndex, {
                                                        required:
                                                            checked === true,
                                                    })
                                                }
                                            />
                                            Bắt buộc trả lời
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="mt-3 w-full"
                                variant="outline"
                                onClick={addQuestion}
                            >
                                + Thêm câu hỏi
                            </Button>
                        </div>

                        {canSave && (
                            <div className="mt-2">
                                <Button loading={saving} onClick={handleSubmit}>
                                    {isEdit ? "Lưu thay đổi" : "Tạo khảo sát"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isEdit && id && (
                <RecordHistorySection
                    className="mt-4 max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm"
                    fetchHistory={params => fetchSurveyAuditLogs(id, params)}
                    actionLabels={SURVEY_AUDIT_ACTION_LABEL}
                    historyHref={`/surveys/${id}/history`}
                />
            )}
        </div>
    );
};

export default SurveyFormPage;
