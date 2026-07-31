import React from "react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { StreetInput, UpdateStreetInput } from "@service/streetApi";

export interface StreetFormValues {
    name: string;
    code: string;
    active: boolean;
}

export const EMPTY_STREET_FORM: StreetFormValues = {
    name: "",
    code: "",
    active: true,
};

export function toStreetInput(values: StreetFormValues): StreetInput {
    return {
        name: values.name.trim(),
        code: values.code.trim(),
        active: values.active,
    };
}

// code la bat bien sau khi tao - khong gui len khi cap nhat.
export function toUpdateStreetInput(
    values: StreetFormValues,
): UpdateStreetInput {
    return {
        name: values.name.trim(),
        active: values.active,
    };
}

export function isStreetFormValid(
    values: StreetFormValues,
    mode: "create" | "edit",
): boolean {
    if (!values.name.trim()) return false;
    if (mode === "create" && !values.code.trim()) return false;
    return true;
}

interface StreetFormProps {
    values: StreetFormValues;
    onChange: (values: StreetFormValues) => void;
    mode?: "create" | "edit";
}

/**
 * Bo truong dung chung cho tao moi/chinh sua duong/pho. Ma chi duoc nhap luc
 * tao moi - bat bien sau do (khoa o che do edit), giong NeighborhoodForm.
 */
const StreetForm: React.FC<StreetFormProps> = ({
    values,
    onChange,
    mode = "create",
}) => {
    const set = <K extends keyof StreetFormValues>(
        key: K,
        value: StreetFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Tên đường/phố</Label>
                <Input
                    placeholder="VD: Nguyễn Trãi"
                    value={values.name}
                    onChange={e => set("name", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Mã đường/phố</Label>
                <Input
                    placeholder="VD: NGUYEN_TRAI"
                    value={values.code}
                    disabled={mode === "edit"}
                    onChange={e => set("code", e.target.value)}
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

export default StreetForm;
