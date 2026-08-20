import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import type {
    AppError,
    InspectionChecklistInputType,
    InspectionChecklistItem,
    InspectionCreationOptions,
} from "@dts";
import {
    createInspectionCampaign,
    fetchInspectionCreationOptions,
    transitionInspectionCampaign,
} from "@service/inspectionApi";

const INPUT_TYPE_LABEL: Record<InspectionChecklistInputType, string> = {
    BOOLEAN: "Có / Không",
    TEXT: "Văn bản",
    NUMBER: "Số",
    SINGLE_SELECT: "Chọn một",
    MULTI_SELECT: "Chọn nhiều",
};

const newItemId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const toLocalDateTime = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const initialDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return toLocalDateTime(date);
};

const emptyChecklistItem = (): InspectionChecklistItem => ({
    itemId: newItemId(),
    label: "",
    inputType: "BOOLEAN",
    required: true,
});

const InspectionCampaignFormPage: React.FC = () => (
    <AdminGuard permissions={["inspections.create"]}>
        <InspectionCampaignFormContent />
    </AdminGuard>
);

const InspectionCampaignFormContent: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [purpose, setPurpose] = useState("");
    const [startAt, setStartAt] = useState(toLocalDateTime(new Date()));
    const [dueAt, setDueAt] = useState(initialDueDate());
    const [allowSelfDeclaration, setAllowSelfDeclaration] = useState(false);
    const [requiredEvidence, setRequiredEvidence] = useState(false);
    const [checklist, setChecklist] = useState<InspectionChecklistItem[]>([
        emptyChecklistItem(),
    ]);
    const [options, setOptions] = useState<InspectionCreationOptions | null>(null);
    const [selectedNeighborhoodIds, setSelectedNeighborhoodIds] = useState<string[]>([]);
    const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [optionsError, setOptionsError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadOptions = (neighborhoodIds: string[]) => {
        setLoadingOptions(true);
        setOptionsError(false);
        fetchInspectionCreationOptions(neighborhoodIds)
            .then(data => {
                setOptions(data);
                setSelectedHouseIds(data.houses.map(house => house._id));
            })
            .catch(() => setOptionsError(true))
            .finally(() => setLoadingOptions(false));
    };

    useEffect(() => {
        loadOptions([]);
    }, []);

    useEffect(() => {
        if (!options || selectedNeighborhoodIds.length === 0) {
            if (selectedNeighborhoodIds.length === 0) setSelectedHouseIds([]);
            return;
        }
        loadOptions(selectedNeighborhoodIds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNeighborhoodIds.join(",")]);

    const selectedHouseCountByNeighborhood = useMemo(() => {
        const counts = new Map<string, number>();
        for (const house of options?.houses || []) {
            if (!selectedHouseIds.includes(house._id)) continue;
            counts.set(house.neighborhoodId, (counts.get(house.neighborhoodId) || 0) + 1);
        }
        return counts;
    }, [options?.houses, selectedHouseIds]);

    const updateChecklist = (
        itemId: string,
        patch: Partial<InspectionChecklistItem>,
    ) => setChecklist(current => current.map(item =>
        item.itemId === itemId ? { ...item, ...patch } : item,
    ));

    const validate = (): string | null => {
        if (name.trim().length < 3) return "Vui lòng nhập tên chiến dịch";
        if (purpose.trim().length < 10) return "Vui lòng mô tả rõ mục tiêu chiến dịch";
        if (!startAt || !dueAt || new Date(dueAt) <= new Date(startAt)) {
            return "Thời hạn phải sau thời điểm bắt đầu";
        }
        if (checklist.length === 0 || checklist.some(item => item.label.trim().length < 2)) {
            return "Checklist phải có ít nhất một mục hợp lệ";
        }
        if (checklist.some(item =>
            ["SINGLE_SELECT", "MULTI_SELECT"].includes(item.inputType) &&
            (!item.options || item.options.length === 0),
        )) return "Các câu hỏi lựa chọn phải có phương án trả lời";
        if (selectedNeighborhoodIds.length === 0) return "Chọn ít nhất một Tổ dân phố";
        if (selectedHouseIds.length === 0) return "Chọn ít nhất một Nhà số";
        return null;
    };

    const submit = async (publish: boolean) => {
        const validationError = validate();
        if (validationError) {
            toast.error(validationError);
            return;
        }
        try {
            setSubmitting(true);
            const campaign = await createInspectionCampaign({
                name: name.trim(),
                purpose: purpose.trim(),
                checklistTemplate: checklist.map(item => ({
                    ...item,
                    label: item.label.trim(),
                    options: item.options?.map(option => option.trim()).filter(Boolean),
                })),
                allowSelfDeclaration,
                requiredEvidence,
                startAt: new Date(startAt).toISOString(),
                dueAt: new Date(dueAt).toISOString(),
                targetNeighborhoodIds: selectedNeighborhoodIds,
                targetHouseIds: selectedHouseIds,
            });
            if (publish) {
                await transitionInspectionCampaign(campaign._id, "publish");
                toast.success("Đã tạo và triển khai chiến dịch tới Tổ dân phố");
            } else {
                toast.success("Đã lưu bản nháp chiến dịch");
            }
            navigate(`/inspections/${campaign._id}`);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-4 pb-10">
            <div>
                <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate("/inspections")}>
                    <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
                </Button>
                <h1 className="text-xl font-semibold">Tạo chiến dịch rà soát</h1>
                <p className="mt-1 text-sm text-text_2">
                    Chiến dịch được lưu nháp trước; chỉ khi triển khai Tổ dân phố mới nhận thông báo.
                </p>
            </div>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Thông tin chung</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Label htmlFor="campaign-name">Tên chiến dịch *</Label>
                        <Input id="campaign-name" className="mt-2" value={name} onChange={event => setName(event.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="campaign-purpose">Mục tiêu, yêu cầu *</Label>
                        <Textarea id="campaign-purpose" className="mt-2" rows={4} value={purpose} onChange={event => setPurpose(event.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="campaign-start">Bắt đầu *</Label>
                        <Input id="campaign-start" type="datetime-local" className="mt-2" value={startAt} onChange={event => setStartAt(event.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="campaign-due">Thời hạn *</Label>
                        <Input id="campaign-due" type="datetime-local" className="mt-2" value={dueAt} onChange={event => setDueAt(event.target.value)} />
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg bg-ng_10 p-4">
                        <span>
                            <span className="block text-sm font-medium">Cho phép Nhà số tự khai</span>
                            <span className="text-xs text-text_2">Tổ có thể gửi biểu mẫu xuống Nhà.</span>
                        </span>
                        <Checkbox
                            id="allow-self-declaration"
                            aria-label="Cho phép Nhà số tự khai"
                            checked={allowSelfDeclaration}
                            onCheckedChange={checked => setAllowSelfDeclaration(checked === true)}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg bg-ng_10 p-4">
                        <span>
                            <span className="block text-sm font-medium">Bắt buộc minh chứng</span>
                            <span className="text-xs text-text_2">Không thể submit nếu chưa có ảnh/tệp.</span>
                        </span>
                        <Checkbox
                            id="required-evidence"
                            aria-label="Bắt buộc minh chứng"
                            checked={requiredEvidence}
                            onCheckedChange={checked => setRequiredEvidence(checked === true)}
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold">Checklist *</h2>
                        <p className="mt-1 text-xs text-text_2">Tổ không thể sửa checklist sau khi nhận.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setChecklist(current => [...current, emptyChecklistItem()])}>
                        <Plus className="h-4 w-4" /> Thêm mục
                    </Button>
                </div>
                <div className="mt-4 space-y-3">
                    {checklist.map((item, index) => (
                        <div key={item.itemId} className="rounded-lg border border-divider_01 p-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                                <div>
                                    <Label htmlFor={`checklist-${item.itemId}`}>Mục {index + 1}</Label>
                                    <Input
                                        id={`checklist-${item.itemId}`}
                                        className="mt-2"
                                        placeholder="Nội dung cần kiểm tra"
                                        value={item.label}
                                        onChange={event => updateChecklist(item.itemId, { label: event.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Kiểu trả lời</Label>
                                    <Select
                                        value={item.inputType}
                                        onValueChange={value => updateChecklist(item.itemId, {
                                            inputType: value as InspectionChecklistInputType,
                                            options: ["SINGLE_SELECT", "MULTI_SELECT"].includes(value)
                                                ? item.options || []
                                                : undefined,
                                        })}
                                    >
                                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(INPUT_TYPE_LABEL).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="mt-6 text-red-500"
                                    disabled={checklist.length === 1}
                                    onClick={() => setChecklist(current => current.filter(row => row.itemId !== item.itemId))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <Checkbox
                                    id={`required-${item.itemId}`}
                                    checked={item.required}
                                    onCheckedChange={checked => updateChecklist(item.itemId, { required: checked === true })}
                                />
                                <Label htmlFor={`required-${item.itemId}`}>Bắt buộc trả lời</Label>
                            </div>
                            {["SINGLE_SELECT", "MULTI_SELECT"].includes(item.inputType) && (
                                <div className="mt-3">
                                    <Label htmlFor={`options-${item.itemId}`}>Các phương án, cách nhau bằng dấu phẩy</Label>
                                    <Input
                                        id={`options-${item.itemId}`}
                                        className="mt-2"
                                        placeholder="Đạt, Chưa đạt, Không áp dụng"
                                        value={(item.options || []).join(", ")}
                                        onChange={event => updateChecklist(item.itemId, {
                                            options: event.target.value.split(",").map(value => value.trim()),
                                        })}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Tổ dân phố và Nhà số mục tiêu *</h2>
                <p className="mt-1 text-xs text-text_2">
                    Danh sách chỉ gồm các Tổ thuộc Phường/xã được gán cho tài khoản.
                </p>
                {loadingOptions && <LoadingState label="Đang tải phạm vi Nhà số..." />}
                {!loadingOptions && optionsError && <ErrorState onRetry={() => loadOptions(selectedNeighborhoodIds)} />}
                {!loadingOptions && !optionsError && options && (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-divider_01 p-3">
                            <div className="mb-2 text-sm font-medium">1. Chọn Tổ dân phố</div>
                            <div className="max-h-72 space-y-1 overflow-y-auto">
                                {options.neighborhoods.map(neighborhood => (
                                    <label key={neighborhood._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-ng_10">
                                        <Checkbox
                                            checked={selectedNeighborhoodIds.includes(neighborhood._id)}
                                            onCheckedChange={checked => setSelectedNeighborhoodIds(current =>
                                                checked
                                                    ? [...current, neighborhood._id]
                                                    : current.filter(id => id !== neighborhood._id),
                                            )}
                                        />
                                        <span className="text-sm">
                                            {neighborhood.code} · {neighborhood.name}
                                            {selectedHouseCountByNeighborhood.has(neighborhood._id) && (
                                                <span className="ml-2 text-xs text-text_2">
                                                    {selectedHouseCountByNeighborhood.get(neighborhood._id)} Nhà
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-lg border border-divider_01 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">2. Chọn Nhà số ({selectedHouseIds.length})</span>
                                {options.houses.length > 0 && (
                                    <button
                                        type="button"
                                        className="text-xs text-primary"
                                        onClick={() => setSelectedHouseIds(
                                            selectedHouseIds.length === options.houses.length
                                                ? []
                                                : options.houses.map(house => house._id),
                                        )}
                                    >
                                        {selectedHouseIds.length === options.houses.length ? "Bỏ chọn hết" : "Chọn tất cả"}
                                    </button>
                                )}
                            </div>
                            {selectedNeighborhoodIds.length === 0 && (
                                <p className="py-8 text-center text-sm text-text_2">Chọn Tổ dân phố trước.</p>
                            )}
                            {selectedNeighborhoodIds.length > 0 && options.houses.length === 0 && (
                                <p className="py-8 text-center text-sm text-text_2">Các Tổ đã chọn chưa có Nhà số.</p>
                            )}
                            <div className="max-h-72 space-y-1 overflow-y-auto">
                                {options.houses.map(house => (
                                    <label key={house._id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-ng_10">
                                        <Checkbox
                                            className="mt-0.5"
                                            checked={selectedHouseIds.includes(house._id)}
                                            onCheckedChange={checked => setSelectedHouseIds(current =>
                                                checked
                                                    ? [...current, house._id]
                                                    : current.filter(id => id !== house._id),
                                            )}
                                        />
                                        <span>
                                            <span className="block text-sm font-medium">{house.code}</span>
                                            <span className="block text-xs text-text_2">{house.address}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" loading={submitting} onClick={() => submit(false)}>
                    Lưu bản nháp
                </Button>
                <Button loading={submitting} onClick={() => submit(true)}>
                    Tạo và triển khai
                </Button>
            </div>
        </div>
    );
};

export default InspectionCampaignFormPage;
