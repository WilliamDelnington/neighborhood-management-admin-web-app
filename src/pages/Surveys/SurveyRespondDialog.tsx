import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { AppError, Survey } from "@dts";
import { respondToSurvey, SurveyAnswerInput } from "@service/surveyApi";

type AnswerState = Record<
    string,
    { selectedOptions: string[]; otherText: string }
>;

const buildInitialAnswers = (survey: Survey): AnswerState => {
    const state: AnswerState = {};
    survey.questions.forEach(q => {
        if (q._id) state[q._id] = { selectedOptions: [], otherText: "" };
    });
    return state;
};

export interface SurveyRespondDialogProps {
    survey: Survey | null;
    onOpenChange: (open: boolean) => void;
}

/**
 * Man tra loi khao sat danh cho tai khoan nhan vien (neighborhood_leader,
 * secretary, regional_police...) - cac vai tro nay co quyen "surveys.respond"
 * va la nguoi nhan hop le theo eligibleRoles, nhung admin web app truoc day
 * khong co man tra loi nao ca (chi co man quan ly/sua/xem ket qua), khien ho
 * khong co cach nao tra loi khao sat nham vao chinh vai tro cua minh. Doi
 * xung voi SurveyAnswerForm cua Mini App (neighborhood-management repo).
 */
const SurveyRespondDialog: React.FC<SurveyRespondDialogProps> = ({
    survey,
    onOpenChange,
}) => {
    const [answers, setAnswers] = useState<AnswerState>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [alreadyAnswered, setAlreadyAnswered] = useState(false);

    // Reset noi bo moi khi mo mot khao sat khac.
    const [loadedSurveyId, setLoadedSurveyId] = useState<string | null>(null);
    if (survey && survey._id !== loadedSurveyId) {
        setLoadedSurveyId(survey._id);
        setAnswers(buildInitialAnswers(survey));
        setSubmitted(false);
        setAlreadyAnswered(false);
    }

    const setSingleChoice = (questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], selectedOptions: [value] },
        }));
    };

    const toggleMultiChoice = (questionId: string, value: string) => {
        setAnswers(prev => {
            const current = prev[questionId]?.selectedOptions || [];
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return {
                ...prev,
                [questionId]: { ...prev[questionId], selectedOptions: next },
            };
        });
    };

    const setOtherText = (questionId: string, text: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], otherText: text },
        }));
    };

    const validate = (): string | null => {
        if (!survey) return null;
        for (const question of survey.questions) {
            if (!question.required || !question._id) continue;
            const answer = answers[question._id];
            if (question.type === "y_kien_khac") {
                if (!answer?.otherText.trim()) {
                    return `Vui lòng trả lời câu hỏi: "${question.question}"`;
                }
            } else if (!answer || answer.selectedOptions.length === 0) {
                return `Vui lòng trả lời câu hỏi: "${question.question}"`;
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        if (!survey) return;
        const validationError = validate();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        const payload: SurveyAnswerInput[] = survey.questions
            .filter(q => !!q._id)
            .map(question => {
                const answer = answers[question._id as string];
                if (question.type === "y_kien_khac") {
                    return {
                        questionId: question._id as string,
                        selectedOptions: [],
                        otherText: answer?.otherText.trim(),
                    };
                }
                return {
                    questionId: question._id as string,
                    selectedOptions: answer?.selectedOptions || [],
                };
            });

        try {
            setSubmitting(true);
            await respondToSurvey(survey._id, payload);
            setSubmitted(true);
            toast.success("Đã gửi câu trả lời khảo sát");
        } catch (err) {
            const appError = err as AppError;
            if (appError.status === 409) {
                setAlreadyAnswered(true);
                toast.warning(appError.message);
            } else {
                toast.error(appError.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const disabled = submitted || alreadyAnswered;

    return (
        <Dialog open={!!survey} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{survey?.title}</DialogTitle>
                </DialogHeader>
                {survey?.description && (
                    <p className="text-sm text-text_2">{survey.description}</p>
                )}

                {survey && (
                    <div className="flex flex-col gap-3">
                        {survey.questions.map((question, index) => {
                            const questionId = question._id as string;
                            const answer = answers[questionId] || {
                                selectedOptions: [],
                                otherText: "",
                            };
                            return (
                                <div
                                    key={questionId}
                                    className="rounded-lg border border-divider_01 p-3"
                                >
                                    <p className="text-sm font-medium">
                                        {index + 1}. {question.question}
                                        {question.required && (
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        )}
                                    </p>
                                    <div className="mt-2">
                                        {question.type ===
                                            "dong_y_khong_dong_y" && (
                                            <RadioGroup
                                                value={
                                                    answer.selectedOptions[0] ||
                                                    ""
                                                }
                                                onValueChange={v =>
                                                    setSingleChoice(
                                                        questionId,
                                                        v,
                                                    )
                                                }
                                                disabled={disabled}
                                            >
                                                {["Đồng ý", "Không đồng ý"].map(
                                                    option => (
                                                        <label
                                                            key={option}
                                                            className="flex items-center gap-2 py-1 text-sm"
                                                        >
                                                            <RadioGroupItem
                                                                value={option}
                                                            />
                                                            {option}
                                                        </label>
                                                    ),
                                                )}
                                            </RadioGroup>
                                        )}

                                        {question.type === "chon_mot" && (
                                            <RadioGroup
                                                value={
                                                    answer.selectedOptions[0] ||
                                                    ""
                                                }
                                                onValueChange={v =>
                                                    setSingleChoice(
                                                        questionId,
                                                        v,
                                                    )
                                                }
                                                disabled={disabled}
                                            >
                                                {question.options.map(
                                                    option => (
                                                        <label
                                                            key={option}
                                                            className="flex items-center gap-2 py-1 text-sm"
                                                        >
                                                            <RadioGroupItem
                                                                value={option}
                                                            />
                                                            {option}
                                                        </label>
                                                    ),
                                                )}
                                            </RadioGroup>
                                        )}

                                        {question.type === "chon_nhieu" &&
                                            question.options.map(option => (
                                                <label
                                                    key={option}
                                                    className="flex items-center gap-2 py-1 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={answer.selectedOptions.includes(
                                                            option,
                                                        )}
                                                        disabled={disabled}
                                                        onCheckedChange={() =>
                                                            toggleMultiChoice(
                                                                questionId,
                                                                option,
                                                            )
                                                        }
                                                    />
                                                    {option}
                                                </label>
                                            ))}

                                        {question.type === "y_kien_khac" && (
                                            <Textarea
                                                placeholder="Nhập ý kiến của bạn..."
                                                value={answer.otherText}
                                                disabled={disabled}
                                                onChange={e =>
                                                    setOtherText(
                                                        questionId,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <DialogFooter>
                    {disabled ? (
                        <p className="text-sm font-medium text-primary">
                            {submitted
                                ? "Bạn đã gửi câu trả lời thành công"
                                : "Bạn đã trả lời khảo sát này rồi"}
                        </p>
                    ) : (
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            Gửi câu trả lời
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SurveyRespondDialog;
