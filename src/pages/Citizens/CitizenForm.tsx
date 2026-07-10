import React from "react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import HouseholdPicker from "@components/admin/HouseholdPicker";
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { GioiTinh, Household, LoaiCuTru } from "@dts";
import { CitizenInput } from "@service/citizenApi";

export interface CitizenFormValues {
    fullName: string;
    phone: string;
    cccd: string;
    birthDate: string;
    gender: GioiTinh;
    relationToHead: string;
    householdId: string;
    householdLabel: string;
    residenceType: LoaiCuTru;
    isElderly: boolean;
    isChild: boolean;
    isDisabledOrSupportNeeded: boolean;
    isPartyMember: boolean;
    isUnionMember: boolean;
}

export const EMPTY_CITIZEN_FORM: CitizenFormValues = {
    fullName: "",
    phone: "",
    cccd: "",
    birthDate: "",
    gender: "nam",
    relationToHead: "",
    householdId: "",
    householdLabel: "",
    residenceType: "thuong_tru",
    isElderly: false,
    isChild: false,
    isDisabledOrSupportNeeded: false,
    isPartyMember: false,
    isUnionMember: false,
};

export function toCitizenInput(values: CitizenFormValues): CitizenInput {
    return {
        fullName: values.fullName.trim(),
        householdId: values.householdId,
        phone: values.phone.trim() || undefined,
        cccd: values.cccd.trim() || undefined,
        birthDate: values.birthDate
            ? new Date(values.birthDate).toISOString()
            : undefined,
        gender: values.gender,
        relationToHead: values.relationToHead.trim() || undefined,
        residenceType: values.residenceType,
        isElderly: values.isElderly,
        isChild: values.isChild,
        isDisabledOrSupportNeeded: values.isDisabledOrSupportNeeded,
        isPartyMember: values.isPartyMember,
        isUnionMember: values.isUnionMember,
    };
}

export function isCitizenFormValid(values: CitizenFormValues): boolean {
    return !!(values.fullName.trim() && values.householdId);
}

interface CitizenFormProps {
    values: CitizenFormValues;
    onChange: (values: CitizenFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua nhan khau.
 */
const CitizenForm: React.FC<CitizenFormProps> = ({ values, onChange }) => {
    const set = <K extends keyof CitizenFormValues>(
        key: K,
        value: CitizenFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <HouseholdPicker
                value={values.householdId}
                valueLabel={values.householdLabel}
                onChange={(householdId, household: Household) =>
                    onChange({
                        ...values,
                        householdId,
                        householdLabel: `${household.code} — ${household.address}`,
                    })
                }
            />
            <div className="space-y-1.5">
                <Label>Họ tên</Label>
                <Input
                    placeholder="Họ và tên"
                    value={values.fullName}
                    onChange={e => set("fullName", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input
                    value={values.phone}
                    onChange={e => set("phone", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số CCCD</Label>
                <Input
                    value={values.cccd}
                    onChange={e => set("cccd", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Ngày sinh</Label>
                <Input
                    type="date"
                    value={values.birthDate}
                    onChange={e => set("birthDate", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <RadioGroup
                    className="flex flex-row gap-5"
                    value={values.gender}
                    onValueChange={v => set("gender", v as GioiTinh)}
                >
                    {(
                        Object.entries(GIOI_TINH_LABEL) as [GioiTinh, string][]
                    ).map(([key, label]) => (
                        <label
                            key={key}
                            htmlFor={`gender-${key}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <RadioGroupItem id={`gender-${key}`} value={key} />
                            {label}
                        </label>
                    ))}
                </RadioGroup>
            </div>
            <div className="space-y-1.5">
                <Label>Quan hệ với chủ hộ</Label>
                <Input
                    placeholder="VD: Con, vợ, chồng..."
                    value={values.relationToHead}
                    onChange={e => set("relationToHead", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Loại cư trú</Label>
                <RadioGroup
                    className="flex flex-row gap-5"
                    value={values.residenceType}
                    onValueChange={v => set("residenceType", v as LoaiCuTru)}
                >
                    {(
                        Object.entries(LOAI_CU_TRU_LABEL) as [
                            LoaiCuTru,
                            string,
                        ][]
                    ).map(([key, label]) => (
                        <label
                            key={key}
                            htmlFor={`residenceType-${key}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <RadioGroupItem
                                id={`residenceType-${key}`}
                                value={key}
                            />
                            {label}
                        </label>
                    ))}
                </RadioGroup>
            </div>
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="isElderly"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="isElderly"
                        checked={values.isElderly}
                        onCheckedChange={checked =>
                            set("isElderly", checked === true)
                        }
                    />
                    Người cao tuổi
                </label>
                <label
                    htmlFor="isChild"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="isChild"
                        checked={values.isChild}
                        onCheckedChange={checked =>
                            set("isChild", checked === true)
                        }
                    />
                    Trẻ em
                </label>
                <label
                    htmlFor="isDisabledOrSupportNeeded"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="isDisabledOrSupportNeeded"
                        checked={values.isDisabledOrSupportNeeded}
                        onCheckedChange={checked =>
                            set(
                                "isDisabledOrSupportNeeded",
                                checked === true,
                            )
                        }
                    />
                    Khuyết tật / cần hỗ trợ
                </label>
                <label
                    htmlFor="isPartyMember"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="isPartyMember"
                        checked={values.isPartyMember}
                        onCheckedChange={checked =>
                            set("isPartyMember", checked === true)
                        }
                    />
                    Đảng viên
                </label>
                <label
                    htmlFor="isUnionMember"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="isUnionMember"
                        checked={values.isUnionMember}
                        onCheckedChange={checked =>
                            set("isUnionMember", checked === true)
                        }
                    />
                    Đoàn viên / hội viên
                </label>
            </div>
        </div>
    );
};

export default CitizenForm;
