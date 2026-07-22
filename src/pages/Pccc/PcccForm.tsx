import React from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import HousePicker from "@components/admin/HousePicker";
import { MUC_NGUY_CO_PCCC_LABEL } from "@constants/domain";
import { House, MucNguyCoPccc } from "@dts";
import { PcccCheckInput } from "@service/pcccApi";

export interface PcccFormValues {
    houseId: string;
    houseLabel: string;
    hasFireExtinguisher: boolean;
    hasEmergencyExit: boolean;
    hasIndoorEvCharging: boolean;
    hasGasStoveOrStorageOrBusiness: boolean;
    isCrowdedRental: boolean;
    riskLevel: MucNguyCoPccc;
    remediationNeeded: string;
    inspectionDate: string;
    followUpStatus: string;
}

export const EMPTY_PCCC_FORM: PcccFormValues = {
    houseId: "",
    houseLabel: "",
    hasFireExtinguisher: false,
    hasEmergencyExit: false,
    hasIndoorEvCharging: false,
    hasGasStoveOrStorageOrBusiness: false,
    isCrowdedRental: false,
    riskLevel: "xanh",
    remediationNeeded: "",
    inspectionDate: "",
    followUpStatus: "",
};

export function toPcccInput(values: PcccFormValues): PcccCheckInput {
    return {
        houseId: values.houseId,
        hasFireExtinguisher: values.hasFireExtinguisher,
        hasEmergencyExit: values.hasEmergencyExit,
        hasIndoorEvCharging: values.hasIndoorEvCharging,
        hasGasStoveOrStorageOrBusiness: values.hasGasStoveOrStorageOrBusiness,
        isCrowdedRental: values.isCrowdedRental,
        riskLevel: values.riskLevel,
        remediationNeeded: values.remediationNeeded.trim() || undefined,
        inspectionDate: values.inspectionDate
            ? new Date(values.inspectionDate).toISOString()
            : "",
        followUpStatus: values.followUpStatus.trim() || undefined,
    };
}

export function isPcccFormValid(values: PcccFormValues): boolean {
    return !!(values.houseId && values.inspectionDate);
}

interface PcccFormProps {
    values: PcccFormValues;
    onChange: (values: PcccFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua dot kiem tra PCCC.
 */
const PcccForm: React.FC<PcccFormProps> = ({ values, onChange }) => {
    const set = <K extends keyof PcccFormValues>(
        key: K,
        value: PcccFormValues[K],
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
                    })
                }
            />
            <div className="space-y-1.5">
                <Label>Ngày kiểm tra</Label>
                <Input
                    type="date"
                    value={values.inspectionDate}
                    onChange={e => set("inspectionDate", e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="hasFireExtinguisher"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="hasFireExtinguisher"
                        checked={values.hasFireExtinguisher}
                        onCheckedChange={checked =>
                            set("hasFireExtinguisher", checked === true)
                        }
                    />
                    Có bình chữa cháy
                </label>
                <label
                    htmlFor="hasEmergencyExit"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="hasEmergencyExit"
                        checked={values.hasEmergencyExit}
                        onCheckedChange={checked =>
                            set("hasEmergencyExit", checked === true)
                        }
                    />
                    Có lối thoát hiểm
                </label>
                <label
                    htmlFor="hasIndoorEvCharging"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="hasIndoorEvCharging"
                        checked={values.hasIndoorEvCharging}
                        onCheckedChange={checked =>
                            set("hasIndoorEvCharging", checked === true)
                        }
                    />
                    Có sạc xe điện trong nhà
                </label>
                <label
                    htmlFor="hasGasStoveOrStorageOrBusiness"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="hasGasStoveOrStorageOrBusiness"
                        checked={values.hasGasStoveOrStorageOrBusiness}
                        onCheckedChange={checked =>
                            set(
                                "hasGasStoveOrStorageOrBusiness",
                                checked === true,
                            )
                        }
                    />
                    Có bếp gas / kho hàng / kinh doanh
                </label>
                <label
                    htmlFor="isCrowdedRental"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="isCrowdedRental"
                        checked={values.isCrowdedRental}
                        onCheckedChange={checked =>
                            set("isCrowdedRental", checked === true)
                        }
                    />
                    Nhà cho thuê đông người
                </label>
            </div>
            <div className="space-y-1.5">
                <Label>Mức nguy cơ</Label>
                <RadioGroup
                    className="flex flex-row gap-5"
                    value={values.riskLevel}
                    onValueChange={v => set("riskLevel", v as MucNguyCoPccc)}
                >
                    {(
                        Object.entries(MUC_NGUY_CO_PCCC_LABEL) as [
                            MucNguyCoPccc,
                            string,
                        ][]
                    ).map(([key, label]) => (
                        <label
                            key={key}
                            htmlFor={`riskLevel-${key}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <RadioGroupItem id={`riskLevel-${key}`} value={key} />
                            {label}
                        </label>
                    ))}
                </RadioGroup>
            </div>
            <div className="space-y-1.5">
                <Label>Việc cần khắc phục</Label>
                <Textarea
                    placeholder="Mô tả các việc cần khắc phục (nếu có)"
                    value={values.remediationNeeded}
                    onChange={e => set("remediationNeeded", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Tình trạng theo dõi</Label>
                <Input
                    placeholder="VD: Đã nhắc nhở, đang chờ khắc phục..."
                    value={values.followUpStatus}
                    onChange={e => set("followUpStatus", e.target.value)}
                />
            </div>
        </div>
    );
};

export default PcccForm;
