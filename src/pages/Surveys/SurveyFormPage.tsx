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
import { LOAI_CAU_HOI_KHAO_SAT_LABEL } from "@constants/domain";
import { AppError, LoaiCauHoiKhaoSat, SurveyQuestion } from "@dts";
import {
    createSurvey,
    fetchSurveyDetail,
    SurveyInput,
    updateSurvey,
} from "@service/surveyApi";

type DraftQuestion = Omit<SurveyQuestion, "_id">;

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
                              question: q.question,
                              type: q.type,
                              options: q.options?.length ? q.options : ["", ""],
                              required: q.required,
                          }))
                        : [{ ...EMPTY_QUESTION }],
                );
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
        </div>
    );
};

export default SurveyFormPage;
