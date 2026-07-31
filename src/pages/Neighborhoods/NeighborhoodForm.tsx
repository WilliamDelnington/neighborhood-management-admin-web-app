import React from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    NeighborhoodInput,
    UpdateNeighborhoodInput,
} from "@service/neighborhoodApi";

export interface NeighborhoodFormValues {
    name: string;
    code: string;
    sequence: string;
    active: boolean;
    address: string;
    description: string;
    contactPhone: string;
    notes: string;
}

export const EMPTY_NEIGHBORHOOD_FORM: NeighborhoodFormValues = {
    name: "",
    code: "",
    sequence: "",
    active: true,
    address: "",
    description: "",
    contactPhone: "",
    notes: "",
};

export function toNeighborhoodInput(
    values: NeighborhoodFormValues,
): NeighborhoodInput {
    return {
        name: values.name.trim(),
        code: values.code.trim(),
        sequence: Number(values.sequence),
        active: values.active,
        address: values.address.trim() || undefined,
        description: values.description.trim() || undefined,
        contactPhone: values.contactPhone.trim() || undefined,
        notes: values.notes.trim() || undefined,
    };
}

// code/sequence la bat bien sau khi tao - khong gui len khi cap nhat (API se
// bo qua neu co gui, nhung tot hon la khong dua vao payload).
export function toUpdateNeighborhoodInput(
    values: NeighborhoodFormValues,
): UpdateNeighborhoodInput {
    return {
        name: values.name.trim(),
        active: values.active,
        address: values.address.trim() || undefined,
        description: values.description.trim() || undefined,
        contactPhone: values.contactPhone.trim() || undefined,
        notes: values.notes.trim() || undefined,
    };
}

export function isNeighborhoodFormValid(
    values: NeighborhoodFormValues,
    mode: "create" | "edit",
): boolean {
    if (!values.name.trim()) return false;
    if (mode === "create") {
        if (!values.code.trim()) return false;
        const sequence = Number(values.sequence);
        if (!Number.isInteger(sequence) || sequence <= 0) return false;
    }
    return true;
}

interface NeighborhoodFormProps {
    values: NeighborhoodFormValues;
    onChange: (values: NeighborhoodFormValues) => void;
    mode?: "create" | "edit";
}

/**
 * Bo truong dung chung cho tao moi/chinh sua to dan pho. Ma va so thu tu chi
 * duoc nhap luc tao moi - bat bien sau do (khoa o che do edit).
 */
const NeighborhoodForm: React.FC<NeighborhoodFormProps> = ({
    values,
    onChange,
    mode = "create",
}) => {
    const set = <K extends keyof NeighborhoodFormValues>(
        key: K,
        value: NeighborhoodFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Tên tổ dân phố</Label>
                <Input
                    placeholder="VD: Tổ dân phố 01"
                    value={values.name}
                    onChange={e => set("name", e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Mã tổ dân phố</Label>
                    <Input
                        placeholder="VD: TDP-01"
                        value={values.code}
                        disabled={mode === "edit"}
                        onChange={e => set("code", e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Số thứ tự</Label>
                    <Input
                        type="number"
                        placeholder="1"
                        value={values.sequence}
                        disabled={mode === "edit"}
                        onChange={e => set("sequence", e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                    placeholder="Địa chỉ nhà văn hóa / trụ sở tổ dân phố"
                    value={values.address}
                    onChange={e => set("address", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số điện thoại liên hệ</Label>
                <Input
                    value={values.contactPhone}
                    onChange={e => set("contactPhone", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea
                    value={values.description}
                    onChange={e => set("description", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea
                    value={values.notes}
                    onChange={e => set("notes", e.target.value)}
                />
            </div>
            <label className="flex items-center gap-2 text-sm">
                <Checkbox
                    checked={values.active}
                    onCheckedChange={checked =>
                        set("active", checked === true)
                    }
                />
                Đang hoạt động
            </label>
        </div>
    );
};

export default NeighborhoodForm;
