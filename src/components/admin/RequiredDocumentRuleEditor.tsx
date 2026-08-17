import React from "react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { DocumentType, RoleRecord } from "@dts";
import { RequiredDocumentRuleInput } from "@service/requiredDocumentApi";

export interface RequiredDocumentRuleEditorProps {
    rules: RequiredDocumentRuleInput[];
    documentTypes: DocumentType[];
    roles: RoleRecord[];
    onChange: (rules: RequiredDocumentRuleInput[]) => void;
    /** Hien thi trong goi y "de trong = dung quyen X mac dinh", vd "Duyệt / từ chối nhà số". */
    verifyPermissionLabel: string;
    emptyLabel?: string;
}

/**
 * Editor danh sach dong luat "giay to bat buoc/tuy chon" - tach ra tu
 * BusinessTypeListPage (noi dong luat nam tren BusinessType dung chung cho
 * nhieu Business) de dung lai cho RequiredDocumentSettingsPage (dong luat AP
 * DUNG CHUNG cho ca category House/Household/Company, khong phai tung ban
 * ghi). Component chi quan ly UI/state cuc bo cua danh sach dong luat - viec
 * luu (goi API) do trang cha thuc hien qua onChange + nut Luu rieng cua trang
 * cha.
 */
const RequiredDocumentRuleEditor: React.FC<RequiredDocumentRuleEditorProps> = ({
    rules,
    documentTypes,
    roles,
    onChange,
    verifyPermissionLabel,
    emptyLabel = "Chưa có yêu cầu giấy tờ nào.",
}) => {
    const documentTypeById = (id: string) =>
        documentTypes.find(dt => dt._id === id);

    const addRule = () => {
        onChange([
            ...rules,
            {
                documentTypeId: "",
                isRequired: true,
                warningBeforeDays: undefined,
                reviewerRoles: [],
            },
        ]);
    };

    const removeRule = (index: number) => {
        onChange(rules.filter((_, i) => i !== index));
    };

    const updateRule = (
        index: number,
        patch: Partial<RequiredDocumentRuleInput>,
    ) => {
        onChange(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    };

    const toggleReviewerRole = (index: number, roleKey: string) => {
        onChange(
            rules.map((r, i) => {
                if (i !== index) return r;
                const has = r.reviewerRoles.includes(roleKey);
                return {
                    ...r,
                    reviewerRoles: has
                        ? r.reviewerRoles.filter(k => k !== roleKey)
                        : [...r.reviewerRoles, roleKey],
                };
            }),
        );
    };

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Giấy tờ yêu cầu</h3>
                <Button size="sm" variant="outline" onClick={addRule}>
                    + Thêm giấy tờ
                </Button>
            </div>

            {rules.length === 0 && (
                <p className="text-sm text-text_2">{emptyLabel}</p>
            )}

            <div className="flex flex-col gap-3">
                {rules.map((rule, index) => {
                    const dt = documentTypeById(rule.documentTypeId);
                    const usedElsewhere = new Set(
                        rules
                            .filter((_, i) => i !== index)
                            .map(r => r.documentTypeId),
                    );
                    return (
                        <div
                            key={index}
                            className="rounded-lg border border-divider_01 p-3"
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <Select
                                    value={rule.documentTypeId || undefined}
                                    onValueChange={val =>
                                        updateRule(index, {
                                            documentTypeId: val,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại giấy tờ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes
                                            .filter(
                                                d =>
                                                    !usedElsewhere.has(d._id),
                                            )
                                            .map(d => (
                                                <SelectItem
                                                    key={d._id}
                                                    value={d._id}
                                                >
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="!text-red-500"
                                    onClick={() => removeRule(index)}
                                >
                                    Xóa
                                </Button>
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                                <Checkbox
                                    checked={rule.isRequired}
                                    onCheckedChange={checked =>
                                        updateRule(index, {
                                            isRequired: !!checked,
                                        })
                                    }
                                />
                                <Label className="text-sm font-normal">
                                    Bắt buộc
                                </Label>
                            </div>

                            {dt?.hasExpiryDate && (
                                <div className="mb-2 space-y-1.5">
                                    <Label className="text-xs">
                                        Cảnh báo trước hết hạn (ngày)
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={rule.warningBeforeDays ?? ""}
                                        onChange={e =>
                                            updateRule(index, {
                                                warningBeforeDays: e.target
                                                    .value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            <div>
                                <Label className="text-xs">
                                    Vai trò được duyệt (để trống = dùng quyền
                                    &quot;{verifyPermissionLabel}&quot; mặc
                                    định)
                                </Label>
                                <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                    {roles.map(role => (
                                        <div
                                            key={role.key}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={rule.reviewerRoles.includes(
                                                    role.key,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleReviewerRole(
                                                        index,
                                                        role.key,
                                                    )
                                                }
                                            />
                                            <Label className="text-sm font-normal">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RequiredDocumentRuleEditor;
