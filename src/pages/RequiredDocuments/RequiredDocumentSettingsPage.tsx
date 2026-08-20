import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import RequiredDocumentRuleEditor from "@components/admin/RequiredDocumentRuleEditor";
import { AppError, DocumentType, RequiredDocumentRule, RoleRecord } from "@dts";
import { fetchDocumentTypes } from "@service/documentTypeApi";
import { fetchRoles } from "@service/roleApi";
import { RequiredDocumentRuleInput } from "@service/requiredDocumentApi";
import {
    fetchHouseRequiredDocumentRules,
    putHouseRequiredDocumentRules,
} from "@service/houseApi";
import {
    fetchHouseholdRequiredDocumentRules,
    putHouseholdRequiredDocumentRules,
} from "@service/householdApi";
import {
    fetchCompanyRequiredDocumentRules,
    putCompanyRequiredDocumentRules,
} from "@service/companyApi";

const RequiredDocumentSettingsPage: React.FC = () => (
    <AdminGuard
        permissions={[
            "houses.update",
            "households.update",
            "companies.update",
        ]}
    >
        <RequiredDocumentSettingsContent />
    </AdminGuard>
);

const RequiredDocumentSettingsContent: React.FC = () => {
    const canUpdateHouses = usePermission("houses.update");
    const canUpdateHouseholds = usePermission("households.update");
    const canUpdateCompanies = usePermission("companies.update");

    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);

    useEffect(() => {
        fetchDocumentTypes({ active: true, limit: 100 })
            .then(res => setDocumentTypes(res.items))
            .catch(() => setDocumentTypes([]));
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]));
    }, []);

    const defaultTab = canUpdateHouses
        ? "house"
        : canUpdateHouseholds
          ? "household"
          : "company";

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-lg font-semibold">
                    Yêu cầu giấy tờ chung
                </h1>
                <p className="text-sm text-text_2">
                    Cấu hình loại giấy tờ mà mọi nhà số / hộ dân / công ty đều
                    phải nộp - áp dụng chung cho toàn bộ danh mục, không khai
                    báo riêng cho từng bản ghi.
                </p>
            </div>

            <Tabs defaultValue={defaultTab}>
                <TabsList>
                    <TabsTrigger value="house">Nhà số</TabsTrigger>
                    <TabsTrigger value="household">Hộ dân</TabsTrigger>
                    <TabsTrigger value="company">Công ty</TabsTrigger>
                </TabsList>
                <TabsContent value="house">
                    <CategoryRuleEditor
                        canUpdate={canUpdateHouses}
                        documentTypes={documentTypes}
                        roles={roles}
                        verifyPermissionLabel="Duyệt / từ chối nhà số"
                        fetchRules={fetchHouseRequiredDocumentRules}
                        putRules={putHouseRequiredDocumentRules}
                    />
                </TabsContent>
                <TabsContent value="household">
                    <CategoryRuleEditor
                        canUpdate={canUpdateHouseholds}
                        documentTypes={documentTypes}
                        roles={roles}
                        verifyPermissionLabel="Duyệt / từ chối hộ dân"
                        fetchRules={fetchHouseholdRequiredDocumentRules}
                        putRules={putHouseholdRequiredDocumentRules}
                    />
                </TabsContent>
                <TabsContent value="company">
                    <CategoryRuleEditor
                        canUpdate={canUpdateCompanies}
                        documentTypes={documentTypes}
                        roles={roles}
                        verifyPermissionLabel="Duyệt / từ chối công ty"
                        fetchRules={fetchCompanyRequiredDocumentRules}
                        putRules={putCompanyRequiredDocumentRules}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

interface CategoryRuleEditorProps {
    canUpdate: boolean;
    documentTypes: DocumentType[];
    roles: RoleRecord[];
    verifyPermissionLabel: string;
    fetchRules: () => Promise<{
        requiredDocuments: RequiredDocumentRule[];
    }>;
    putRules: (
        requiredDocuments: RequiredDocumentRuleInput[],
    ) => Promise<unknown>;
}

const CategoryRuleEditor: React.FC<CategoryRuleEditorProps> = ({
    canUpdate,
    documentTypes,
    roles,
    verifyPermissionLabel,
    fetchRules,
    putRules,
}) => {
    const [rules, setRules] = useState<RequiredDocumentRuleInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchRules()
            .then(res =>
                setRules(
                    res.requiredDocuments.map(rule => ({
                        documentTypeId:
                            typeof rule.documentTypeId === "string"
                                ? rule.documentTypeId
                                : rule.documentTypeId._id,
                        isRequired: rule.isRequired,
                        warningBeforeDays: rule.warningBeforeDays,
                        reviewerRoles: rule.reviewerRoles,
                    })),
                ),
            )
            .catch(() => setRules([]))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        if (rules.some(r => !r.documentTypeId)) {
            toast.error("Vui lòng chọn loại giấy tờ cho tất cả các dòng");
            return;
        }
        try {
            setSaving(true);
            await putRules(rules);
            toast.success("Đã cập nhật yêu cầu giấy tờ");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-sm text-text_2">Đang tải...</p>;

    return (
        <div className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
            <RequiredDocumentRuleEditor
                rules={rules}
                documentTypes={documentTypes}
                roles={roles}
                onChange={setRules}
                verifyPermissionLabel={verifyPermissionLabel}
            />
            {canUpdate && (
                <Button
                    className="mt-3 w-full"
                    variant="outline"
                    loading={saving}
                    onClick={handleSave}
                >
                    Lưu yêu cầu giấy tờ
                </Button>
            )}
        </div>
    );
};

export default RequiredDocumentSettingsPage;
