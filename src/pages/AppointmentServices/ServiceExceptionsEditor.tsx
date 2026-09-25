import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    AppointmentService,
    AppointmentServiceExceptionType,
} from "@dts";
import { AppointmentServiceExceptionInput } from "@service/appointmentServiceApi";

export type ExceptionSlotDraft = {
    _id?: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    active: boolean;
};

export type ExceptionDraft = {
    _id?: string;
    date: string; // YYYY-MM-DD
    endDate: string; // "" = chi mot ngay
    type: AppointmentServiceExceptionType;
    note: string;
    timeSlots: ExceptionSlotDraft[];
};

export const EXCEPTION_TYPE_LABEL: Record<AppointmentServiceExceptionType, string> = {
    closed: "Nghỉ - không tiếp nhận",
    custom_hours: "Làm việc khác giờ",
};

const EMPTY_EXCEPTION_SLOT: ExceptionSlotDraft = {
    startTime: "08:00",
    endTime: "11:00",
    maxCapacity: 5,
    active: true,
};

export const exceptionsToDrafts = (
    exceptions: AppointmentService["exceptions"],
): ExceptionDraft[] =>
    (exceptions || []).map(e => ({
        _id: e._id,
        date: e.date.slice(0, 10),
        endDate: e.endDate ? e.endDate.slice(0, 10) : "",
        type: e.type,
        note: e.note || "",
        timeSlots: e.timeSlots.map(slot => ({ ...slot })),
    }));

/** Tra ve thong bao loi dau tien (neu co) - kiem tra truoc khi gui len backend. */
export const validateExceptionDrafts = (drafts: ExceptionDraft[]): string | null => {
    for (const e of drafts) {
        if (!e.date) return "Vui lòng chọn ngày cho mọi ngày ngoại lệ";
        if (e.endDate && e.endDate < e.date) {
            return "Ngày kết thúc của ngày ngoại lệ phải từ ngày bắt đầu trở đi";
        }
        if (e.type === "custom_hours") {
            if (e.timeSlots.length === 0) {
                return "Ngày làm việc khác giờ cần ít nhất một khung giờ";
            }
            if (e.timeSlots.some(s => !s.startTime || !s.endTime || s.startTime >= s.endTime)) {
                return "Khung giờ của ngày ngoại lệ: giờ kết thúc phải sau giờ bắt đầu";
            }
        }
    }
    const sorted = [...drafts].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < sorted.length; i += 1) {
        const prevEnd = sorted[i - 1].endDate || sorted[i - 1].date;
        if (sorted[i].date <= prevEnd) return "Các ngày ngoại lệ đang bị trùng nhau";
    }
    return null;
};

export const draftsToExceptionInput = (
    drafts: ExceptionDraft[],
): AppointmentServiceExceptionInput[] =>
    drafts.map(e => ({
        _id: e._id,
        date: e.date,
        endDate: e.endDate || undefined,
        type: e.type,
        note: e.note.trim() || undefined,
        timeSlots:
            e.type === "custom_hours"
                ? e.timeSlots.map(slot => ({
                      _id: slot._id,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      maxCapacity: slot.maxCapacity,
                      active: slot.active,
                  }))
                : [],
    }));

export interface ServiceExceptionsEditorProps {
    value: ExceptionDraft[];
    onChange: (next: ExceptionDraft[]) => void;
}

/**
 * Ngay ngoai le RIENG cua dich vu - khac trang "Ngày nghỉ / lễ" (ap dung cho ca
 * phuong/he thong). Ngoai le duoc uu tien hon ngay nghi/le chung, nen co the
 * dung de van tiep nhan (khac gio) vao mot ngay le.
 */
const ServiceExceptionsEditor: React.FC<ServiceExceptionsEditorProps> = ({
    value,
    onChange,
}) => {
    const update = (index: number, patch: Partial<ExceptionDraft>) =>
        onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));

    const updateSlot = (
        index: number,
        slotIndex: number,
        patch: Partial<ExceptionSlotDraft>,
    ) =>
        update(index, {
            timeSlots: value[index].timeSlots.map((slot, i) =>
                i === slotIndex ? { ...slot, ...patch } : slot,
            ),
        });

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                    <Label>Ngày ngoại lệ</Label>
                    <p className="text-xs text-muted-foreground">
                        Ngày dịch vụ nghỉ hoặc làm việc khác giờ so với lịch hàng tuần.
                        Được ưu tiên hơn ngày nghỉ/lễ chung của phường.
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        onChange([
                            ...value,
                            {
                                date: "",
                                endDate: "",
                                type: "closed",
                                note: "",
                                timeSlots: [],
                            },
                        ])
                    }
                >
                    <Plus className="mr-1 h-4 w-4" /> Thêm ngày
                </Button>
            </div>
            {value.length === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                    Chưa có ngày ngoại lệ - dịch vụ luôn theo khung giờ hàng tuần và
                    ngày nghỉ/lễ chung.
                </p>
            )}
            <div className="space-y-3">
                {value.map((exception, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={exception._id || `new-${index}`} className="rounded-lg border p-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div>
                                <span className="text-xs text-muted-foreground">Từ ngày</span>
                                <Input
                                    type="date"
                                    value={exception.date}
                                    onChange={e => update(index, { date: e.target.value })}
                                />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">
                                    Đến ngày (không bắt buộc)
                                </span>
                                <Input
                                    type="date"
                                    min={exception.date || undefined}
                                    value={exception.endDate}
                                    onChange={e => update(index, { endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Loại</span>
                                <Select
                                    value={exception.type}
                                    onValueChange={type =>
                                        update(index, {
                                            type: type as AppointmentServiceExceptionType,
                                            timeSlots:
                                                type === "custom_hours" &&
                                                exception.timeSlots.length === 0
                                                    ? [{ ...EMPTY_EXCEPTION_SLOT }]
                                                    : exception.timeSlots,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(
                                            Object.keys(EXCEPTION_TYPE_LABEL) as AppointmentServiceExceptionType[]
                                        ).map(type => (
                                            <SelectItem key={type} value={type}>
                                                {EXCEPTION_TYPE_LABEL[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-muted-foreground">
                                Ghi chú / lý do
                            </span>
                            <Input
                                placeholder="VD: Trực lễ buổi sáng, Tạm ngưng để kiểm kê..."
                                value={exception.note}
                                onChange={e => update(index, { note: e.target.value })}
                            />
                        </div>

                        {exception.type === "custom_hours" && (
                            <div className="mt-3 space-y-2 rounded-md bg-ng_10 p-2">
                                {exception.timeSlots.map((slot, slotIndex) => (
                                    <div
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={slot._id || `slot-${slotIndex}`}
                                        className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
                                    >
                                        <div>
                                            <span className="text-xs text-muted-foreground">
                                                Giờ bắt đầu
                                            </span>
                                            <Input
                                                type="time"
                                                value={slot.startTime}
                                                onChange={e =>
                                                    updateSlot(index, slotIndex, {
                                                        startTime: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">
                                                Giờ kết thúc
                                            </span>
                                            <Input
                                                type="time"
                                                value={slot.endTime}
                                                onChange={e =>
                                                    updateSlot(index, slotIndex, {
                                                        endTime: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">
                                                Số lượt tối đa
                                            </span>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={slot.maxCapacity}
                                                onChange={e =>
                                                    updateSlot(index, slotIndex, {
                                                        maxCapacity: Number(e.target.value) || 0,
                                                    })
                                                }
                                            />
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label="Xóa khung giờ"
                                            onClick={() =>
                                                update(index, {
                                                    timeSlots: exception.timeSlots.filter(
                                                        (_, i) => i !== slotIndex,
                                                    ),
                                                })
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        update(index, {
                                            timeSlots: [
                                                ...exception.timeSlots,
                                                { ...EMPTY_EXCEPTION_SLOT },
                                            ],
                                        })
                                    }
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Thêm khung giờ cho ngày này
                                </Button>
                            </div>
                        )}

                        <div className="mt-2 flex justify-end">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onChange(value.filter((_, i) => i !== index))}
                            >
                                Xóa ngày ngoại lệ
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServiceExceptionsEditor;
