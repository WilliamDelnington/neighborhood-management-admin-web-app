import React from "react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import HousePicker from "@components/admin/HousePicker";
import { LOAI_SO_HUU_LABEL } from "@constants/domain";
import { House, LoaiSoHuu } from "@dts";
import { ResidentRecordInput } from "@service/residentApi";

export interface ResidentFormValues {
    houseId: string;
    houseLabel: string;
    houseDeclarationNumber: string;
    ownershipType: LoaiSoHuu;
    renterCount: string;
    inspectionDate: string;
}

export const EMPTY_RESIDENT_FORM: ResidentFormValues = {
    houseId: "",
    houseLabel: "",
    houseDeclarationNumber: "",
    ownershipType: "chinh_chu",
    renterCount: "",
    inspectionDate: "",
};

export function toResidentInput(
    values: ResidentFormValues,
): ResidentRecordInput {
    return {
        houseId: values.houseId,
        ownershipType: values.ownershipType,
        renterCount: values.renterCount ? Number(values.renterCount) : undefined,
        inspectionDate: values.inspectionDate
            ? new Date(values.inspectionDate).toISOString()
            : "",
    };
}

export function isResidentFormValid(values: ResidentFormValues): boolean {
    return !!(values.houseId && values.inspectionDate);
}

interface ResidentFormProps {
    values: ResidentFormValues;
    onChange: (values: ResidentFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua ho so cu tru - tach ra tu
 * SecurityForm truoc day (chi giu lai phan lien quan cu tru, khong con
 * checkbox/muc do an ninh).
 */
const ResidentForm: React.FC<ResidentFormProps> = ({ values, onChange }) => {
    const set = <K extends keyof ResidentFormValues>(
        key: K,
        value: ResidentFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <HousePicker
                value={values.houseId}
                valueLabel={values.houseLabel}
                onChange={(houseId, house: House) =>
                    onChange({
                        ...values,
                        houseId,
                        houseLabel: `${house.code} — ${house.address}`,
                        houseDeclarationNumber:
                            house.residenceDeclarationNumber || "",
                    })
                }
            />
            <div className="space-y-1.5">
                <Label>Số khai báo cư trú</Label>
                <Input
                    disabled
                    value={
                        values.houseDeclarationNumber ||
                        "Chưa có (khai báo tại hồ sơ Nhà số)"
                    }
                />
            </div>
            <div className="space-y-1.5">
                <Label>Ngày kiểm tra</Label>
                <Input
                    type="date"
                    value={values.inspectionDate}
                    onChange={e => set("inspectionDate", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Hình thức sở hữu</Label>
                <RadioGroup
                    className="flex flex-row gap-5"
                    value={values.ownershipType}
                    onValueChange={v => set("ownershipType", v as LoaiSoHuu)}
                >
                    {(
                        Object.entries(LOAI_SO_HUU_LABEL) as [
                            LoaiSoHuu,
                            string,
                        ][]
                    ).map(([key, label]) => (
                        <label
                            key={key}
                            htmlFor={`ownershipType-${key}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <RadioGroupItem
                                id={`ownershipType-${key}`}
                                value={key}
                            />
                            {label}
                        </label>
                    ))}
                </RadioGroup>
            </div>
            <div className="space-y-1.5">
                <Label>Số người đang ở thực tế</Label>
                <Input
                    type="number"
                    value={values.renterCount}
                    onChange={e => set("renterCount", e.target.value)}
                />
            </div>
        </div>
    );
};

export default ResidentForm;
