import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    CheckSquare,
    CircleDot,
    Copy,
    FileText,
    GripVertical,
    ListChecks,
    MessageSquare,
    Plus,
    Share2,
    SlidersHorizontal,
    Target,
    ThumbsUp,
    Trash2,
    X,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { Switch } from "@components/ui/switch";
import { Badge } from "@components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import {
    LOAI_CAU_HOI_KHAO_SAT_LABEL,
    SURVEY_AUDIT_ACTION_LABEL,
} from "@constants/domain";
import { AppError, AssignableStaff, BusinessType, LoaiCauHoiKhaoSat, Neighborhood, RoleRecord, Street, SurveyQuestion } from "@dts";
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
import { fetchAssignableStaff } from "@service/userApi";

const idOf = (ref: string | { _id: string }): string =>
    typeof ref === "string" ? ref : ref._id;

// Header dung chung cho tung khoi (Card) cua form, dam bao cac muc co cung
// bo cuc icon trong tron + tieu de + mo ta ngan, thay vi chi la mot dong
// chu in dam nhu ban cu (kho phan biet cac khoi voi nhau).
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue_10 text-primary">
                {icon}
            </div>
            <div>
                <CardTitle className="text-sm">{title}</CardTitle>
                {description && (
                    <CardDescription className="mt-0.5">
                        {description}
                    </CardDescription>
                )}
            </div>
        </div>
        {action}
    </CardHeader>
);

// clientKey: dinh danh on dinh o phia client cho React (khong gui len server) -
// can thiet vi index khong con on dinh khi cho phep keo-tha/nhan ban cau hoi.
type DraftQuestion = SurveyQuestion & { clientKey: string };

let draftKeySeq = 0;
const nextDraftKey = () => {
    draftKeySeq += 1;
    return `draft-${Date.now()}-${draftKeySeq}`;
};

const createEmptyQuestion = (): DraftQuestion => ({
    question: "",
    type: "chon_mot",
    options: ["", ""],
    required: true,
    clientKey: nextDraftKey(),
});

const OPTIONS_TYPES: LoaiCauHoiKhaoSat[] = ["chon_mot", "chon_nhieu"];

// Icon rieng cho tung loai cau hoi (giong Google Form) - de nguoi dung nhan
// dang nhanh loai cau hoi ma khong can doc chu.
const QUESTION_TYPE_ICON: Record<
    LoaiCauHoiKhaoSat,
    React.ComponentType<{ className?: string }>
> = {
    dong_y_khong_dong_y: ThumbsUp,
    chon_mot: CircleDot,
    chon_nhieu: CheckSquare,
    y_kien_khac: MessageSquare,
};

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
        createEmptyQuestion(),
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
    const [coEditorCandidates, setCoEditorCandidates] = useState<
        AssignableStaff[]
    >([]);
    const [coEditorUserIds, setCoEditorUserIds] = useState<string[]>([]);
    const [coEditorDialogOpen, setCoEditorDialogOpen] = useState(false);
    const [audienceDialogOpen, setAudienceDialogOpen] = useState(false);
    const [audienceTab, setAudienceTab] = useState("roles");

    // Keo-tha sap xep lai cau hoi (giong Google Form) - chi luu index dang
    // keo/dang hover, khong dung thu vien ngoai vi HTML5 drag-and-drop la du
    // cho danh sach 1 chieu don gian nay.
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
                              clientKey: q._id || nextDraftKey(),
                              question: q.question,
                              type: q.type,
                              options: q.options?.length ? q.options : ["", ""],
                              required: q.required,
                          }))
                        : [createEmptyQuestion()],
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
                setCoEditorUserIds((s.coEditorUserIds || []).map(idOf));
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
        fetchAssignableStaff("surveys.update")
            .then(setCoEditorCandidates)
            .catch(() => setCoEditorCandidates([]));
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
        setQuestions(prev => [...prev, createEmptyQuestion()]);
    };

    const duplicateQuestion = (index: number) => {
        setQuestions(prev => {
            const source = prev[index];
            const clone: DraftQuestion = {
                ...source,
                _id: undefined,
                clientKey: nextDraftKey(),
                options: [...source.options],
            };
            const next = [...prev];
            next.splice(index + 1, 0, clone);
            return next;
        });
    };

    // Xoa co the hoan tac: xoa ngay khoi state nhung giu ban ghi vua xoa de
    // toast "Hoan tac" chen lai dung vi tri neu nguoi dung bam nham.
    const removeQuestion = (index: number) => {
        const removed = questions[index];
        setQuestions(prev => prev.filter((_, i) => i !== index));
        toast("Đã xóa câu hỏi", {
            action: {
                label: "Hoàn tác",
                onClick: () => {
                    setQuestions(prev => {
                        const next = [...prev];
                        next.splice(
                            Math.min(index, next.length),
                            0,
                            removed,
                        );
                        return next;
                    });
                },
            },
        });
    };

    const moveQuestion = (from: number, to: number) => {
        if (from === to) return;
        setQuestions(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
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

        const preparedQuestions: SurveyQuestion[] = questions.map(q => ({
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
            coEditorUserIds,
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

    // Danh sach 4 tieu chi doi tuong tra loi, gop chung lai de render dang
    // luoi 2 cot (thay vi 4 khoi xep chong nhu ban cu) va bo sung dem so
    // luong da chon cho de theo doi.
    const audienceGroups: {
        key: string;
        label: string;
        emptyLabel: string;
        options: { key: string; name: string }[];
        selected: string[];
        onToggle: (key: string) => void;
    }[] = [
        {
            key: "roles",
            label: "Vai trò",
            emptyLabel: "Chưa có vai trò nào",
            options: roles.map(r => ({ key: r.key, name: r.name })),
            selected: eligibleRoles,
            onToggle: k => toggleId(eligibleRoles, setEligibleRoles, k),
        },
        {
            key: "streets",
            label: "Đường / phố",
            emptyLabel: "Chưa có đường/phố nào",
            options: streets.map(s => ({ key: s._id, name: s.name })),
            selected: eligibleStreetIds,
            onToggle: k =>
                toggleId(eligibleStreetIds, setEligibleStreetIds, k),
        },
        {
            key: "neighborhoods",
            label: "Tổ dân phố",
            emptyLabel: "Chưa có tổ dân phố nào",
            options: neighborhoods.map(n => ({ key: n._id, name: n.name })),
            selected: eligibleNeighborhoodIds,
            onToggle: k =>
                toggleId(
                    eligibleNeighborhoodIds,
                    setEligibleNeighborhoodIds,
                    k,
                ),
        },
        {
            key: "businessTypes",
            label: "Loại hình kinh doanh",
            emptyLabel: "Chưa có loại hình kinh doanh nào",
            options: businessTypes.map(bt => ({ key: bt._id, name: bt.name })),
            selected: eligibleBusinessTypeIds,
            onToggle: k =>
                toggleId(
                    eligibleBusinessTypeIds,
                    setEligibleBusinessTypeIds,
                    k,
                ),
        },
    ];

    return (
        <div>
            <div className="mb-5 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/surveys")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">
                        {isEdit ? "Sửa khảo sát" : "Thêm khảo sát"}
                    </h1>
                    <p className="text-sm text-text_2">
                        {isEdit
                            ? "Cập nhật nội dung, phạm vi và câu hỏi của khảo sát."
                            : "Điền thông tin, chọn đối tượng và thêm câu hỏi để tạo khảo sát mới."}
                    </p>
                </div>
            </div>

            {isEdit && loading && (
                <Card className="p-6">
                    <LoadingState />
                </Card>
            )}
            {isEdit && !loading && loadError && (
                <Card className="p-6">
                    <ErrorState onRetry={loadDetail} />
                </Card>
            )}
            {(!isEdit || (!loading && !loadError)) && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div className="flex flex-col gap-4 lg:col-span-2">
                        <Card>
                            <SectionHeader
                                icon={<ListChecks className="h-4 w-4" />}
                                title="Danh sách câu hỏi"
                                description="Nội dung, loại câu trả lời và các lựa chọn cho từng câu hỏi."
                                action={
                                    <Badge tone="blue">
                                        {questions.length} câu hỏi
                                    </Badge>
                                }
                            />
                            <CardContent className="flex flex-col gap-3">
                                {questions.map((q, qIndex) => {
                                    const TypeIcon =
                                        QUESTION_TYPE_ICON[q.type];
                                    return (
                                    <div
                                        key={q.clientKey}
                                        onDragOver={e => {
                                            if (draggingIndex === null) return;
                                            e.preventDefault();
                                            setDragOverIndex(qIndex);
                                        }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            if (draggingIndex !== null) {
                                                moveQuestion(
                                                    draggingIndex,
                                                    qIndex,
                                                );
                                            }
                                            setDraggingIndex(null);
                                            setDragOverIndex(null);
                                        }}
                                        className={`rounded-lg border p-4 transition-colors ${
                                            dragOverIndex === qIndex &&
                                            draggingIndex !== null &&
                                            draggingIndex !== qIndex
                                                ? "border-primary ring-2 ring-primary/30"
                                                : "border-divider_01"
                                        } ${
                                            draggingIndex === qIndex
                                                ? "opacity-40"
                                                : ""
                                        }`}
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    title="Kéo để sắp xếp"
                                                    draggable
                                                    onDragStart={() =>
                                                        setDraggingIndex(
                                                            qIndex,
                                                        )
                                                    }
                                                    onDragEnd={() => {
                                                        setDraggingIndex(
                                                            null,
                                                        );
                                                        setDragOverIndex(
                                                            null,
                                                        );
                                                    }}
                                                    className="cursor-grab rounded-md p-1 text-text_3 hover:bg-ng_10 hover:text-text_1 active:cursor-grabbing"
                                                >
                                                    <GripVertical className="h-4 w-4" />
                                                </button>
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ng_10 text-xs font-semibold text-text_2">
                                                    {qIndex + 1}
                                                </span>
                                                <span className="text-sm font-medium">
                                                    Câu hỏi {qIndex + 1}
                                                </span>
                                                <TypeIcon className="h-3.5 w-3.5 text-text_3" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    title="Nhân bản câu hỏi"
                                                    className="rounded-md p-1 text-text_3 hover:bg-ng_10 hover:text-text_1"
                                                    onClick={() =>
                                                        duplicateQuestion(
                                                            qIndex,
                                                        )
                                                    }
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                {questions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        title="Xóa câu hỏi"
                                                        className="rounded-md p-1 text-text_3 hover:bg-danger-soft hover:text-red-500"
                                                        onClick={() =>
                                                            removeQuestion(
                                                                qIndex,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Input
                                                placeholder="Nhập nội dung câu hỏi"
                                                value={q.question}
                                                onChange={e =>
                                                    updateQuestion(qIndex, {
                                                        question:
                                                            e.target.value,
                                                    })
                                                }
                                            />

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                                <div className="flex-1 space-y-1.5">
                                                    <Label>Loại câu hỏi</Label>
                                                    <Select
                                                        value={q.type}
                                                        onValueChange={val =>
                                                            updateQuestion(
                                                                qIndex,
                                                                {
                                                                    type: val as LoaiCauHoiKhaoSat,
                                                                    options:
                                                                        OPTIONS_TYPES.includes(
                                                                            val as LoaiCauHoiKhaoSat,
                                                                        ) &&
                                                                        q
                                                                            .options
                                                                            .length <
                                                                            2
                                                                            ? [
                                                                                  "",
                                                                                  "",
                                                                              ]
                                                                            : q.options,
                                                                },
                                                            )
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
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    label,
                                                                ]) => {
                                                                    const ItemIcon =
                                                                        QUESTION_TYPE_ICON[
                                                                            key
                                                                        ];
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                key
                                                                            }
                                                                            value={
                                                                                key
                                                                            }
                                                                        >
                                                                            <span className="flex items-center gap-2">
                                                                                <ItemIcon className="h-3.5 w-3.5 text-text_3" />
                                                                                {
                                                                                    label
                                                                                }
                                                                            </span>
                                                                        </SelectItem>
                                                                    );
                                                                },
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <label
                                                    htmlFor={`required-${q.clientKey}`}
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-divider_01 px-3 text-sm"
                                                >
                                                    <Switch
                                                        id={`required-${q.clientKey}`}
                                                        checked={q.required}
                                                        onCheckedChange={checked =>
                                                            updateQuestion(
                                                                qIndex,
                                                                {
                                                                    required:
                                                                        checked,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    Bắt buộc trả lời
                                                </label>
                                            </div>

                                            {OPTIONS_TYPES.includes(
                                                q.type,
                                            ) && (
                                                <div className="rounded-lg bg-ng_10 p-3">
                                                    <Label className="mb-2 block">
                                                        Các lựa chọn
                                                    </Label>
                                                    <div className="flex flex-col gap-2">
                                                        {q.options.map(
                                                            (
                                                                opt,
                                                                optIndex,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        optIndex
                                                                    }
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Input
                                                                        className="flex-1 bg-ui_bg"
                                                                        placeholder={`Lựa chọn ${
                                                                            optIndex +
                                                                            1
                                                                        }`}
                                                                        value={
                                                                            opt
                                                                        }
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
                                                                            title="Xóa lựa chọn"
                                                                            className="rounded-md p-1.5 text-text_3 hover:bg-ui_bg hover:text-red-500"
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
                                        </div>
                                    </div>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    onClick={addQuestion}
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm câu hỏi
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit">
                        <Card>
                            <SectionHeader
                                icon={<FileText className="h-4 w-4" />}
                                title="Thông tin chung"
                                description="Tên và mô tả mục đích của khảo sát."
                            />
                            <CardContent className="flex flex-col gap-4">
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
                            </CardContent>
                        </Card>

                        <Card>
                            <SectionHeader
                                icon={<Target className="h-4 w-4" />}
                                title="Đối tượng được trả lời"
                                description="Mặc định khảo sát áp dụng cho tất cả mọi người, có thể giới hạn theo tiêu chí."
                            />
                            <CardContent>
                                <label className="flex items-center gap-2 rounded-lg border border-divider_01 bg-ng_10 px-3 py-2.5 text-sm font-medium">
                                    <Checkbox
                                        checked={eligibleAll}
                                        onCheckedChange={checked =>
                                            setEligibleAll(checked === true)
                                        }
                                    />
                                    Áp dụng cho tất cả mọi người
                                </label>

                                {!eligibleAll && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {audienceGroups.map(group => (
                                                <Badge
                                                    key={group.key}
                                                    tone={
                                                        group.selected
                                                            .length > 0
                                                            ? "blue"
                                                            : "gray"
                                                    }
                                                >
                                                    {group.label}
                                                    {group.selected.length >
                                                        0 &&
                                                        `: ${group.selected.length}`}
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-fit"
                                            onClick={() =>
                                                setAudienceDialogOpen(true)
                                            }
                                        >
                                            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                                            Chọn đối tượng cụ thể
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Tóm tắt khảo sát
                                </CardTitle>
                                <CardDescription>
                                    Kiểm tra lại trước khi lưu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text_2">
                                        Số câu hỏi
                                    </span>
                                    <span className="font-medium">
                                        {questions.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text_2">
                                        Đồng chủ biên
                                    </span>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                                        onClick={() =>
                                            setCoEditorDialogOpen(true)
                                        }
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                        {coEditorUserIds.length > 0
                                            ? `${coEditorUserIds.length} người`
                                            : "Chia sẻ"}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text_2">
                                        Đối tượng trả lời
                                    </span>
                                    <span className="font-medium">
                                        {eligibleAll
                                            ? "Tất cả mọi người"
                                            : "Giới hạn theo tiêu chí"}
                                    </span>
                                </div>

                                <div className="mt-1 flex flex-col gap-2 border-t border-divider_01 pt-3">
                                    {canSave && (
                                        <Button
                                            size="lg"
                                            className="w-full"
                                            loading={saving}
                                            onClick={handleSubmit}
                                        >
                                            {isEdit
                                                ? "Lưu thay đổi"
                                                : "Tạo khảo sát"}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate("/surveys")}
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {isEdit && id && (
                            <RecordHistorySection
                                className="rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm"
                                fetchHistory={params =>
                                    fetchSurveyAuditLogs(id, params)
                                }
                                actionLabels={SURVEY_AUDIT_ACTION_LABEL}
                                historyHref={`/surveys/${id}/history`}
                            />
                        )}
                    </div>
                </div>
            )}

            <Dialog
                open={coEditorDialogOpen}
                onOpenChange={setCoEditorDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chia sẻ quyền chỉnh sửa</DialogTitle>
                        <DialogDescription>
                            Ngoài bạn (người tạo), chỉ các tài khoản được chọn
                            dưới đây mới được sửa, mở, đóng hoặc xóa khảo sát
                            này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
                        {coEditorCandidates.length === 0 && (
                            <span className="p-2 text-xs text-text_2">
                                Không có tài khoản nào khác có quyền chỉnh sửa
                                khảo sát
                            </span>
                        )}
                        {coEditorCandidates.map(u => (
                            <label
                                key={u.id}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ng_10"
                            >
                                <Checkbox
                                    checked={coEditorUserIds.includes(u.id)}
                                    onCheckedChange={() =>
                                        toggleId(
                                            coEditorUserIds,
                                            setCoEditorUserIds,
                                            u.id,
                                        )
                                    }
                                />
                                <span className="truncate">
                                    {u.displayName}
                                </span>
                            </label>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setCoEditorDialogOpen(false)}>
                            Xong
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={audienceDialogOpen}
                onOpenChange={setAudienceDialogOpen}
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Chọn đối tượng được trả lời</DialogTitle>
                        <DialogDescription>
                            Người trả lời phải khớp vai trò đã chọn (nếu có) VÀ
                            khớp ít nhất một trong các tiêu chí đường/phố, tổ
                            dân phố, hoặc loại hình kinh doanh (nếu có chọn).
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs value={audienceTab} onValueChange={setAudienceTab}>
                        <TabsList className="h-auto w-full flex-wrap justify-start">
                            {audienceGroups.map(group => (
                                <TabsTrigger
                                    key={group.key}
                                    value={group.key}
                                    className="gap-1.5"
                                >
                                    {group.label}
                                    {group.selected.length > 0 && (
                                        <Badge
                                            tone="blue"
                                            className="h-4 px-1.5 text-[10px]"
                                        >
                                            {group.selected.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {audienceGroups.map(group => (
                            <TabsContent key={group.key} value={group.key}>
                                <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-divider_01 p-2">
                                    {group.options.length === 0 && (
                                        <span className="p-2 text-xs text-text_2">
                                            {group.emptyLabel}
                                        </span>
                                    )}
                                    {group.options.map(opt => (
                                        <label
                                            key={opt.key}
                                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ng_10"
                                        >
                                            <Checkbox
                                                checked={group.selected.includes(
                                                    opt.key,
                                                )}
                                                onCheckedChange={() =>
                                                    group.onToggle(opt.key)
                                                }
                                            />
                                            <span className="truncate">
                                                {opt.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                    <DialogFooter>
                        <Button onClick={() => setAudienceDialogOpen(false)}>
                            Xong
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SurveyFormPage;
