import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Checkbox } from "@components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import {
    MINI_APP_FEATURE_CATALOG,
    MiniAppFeatureConfigEntry,
    mergeFeatureConfig,
} from "@constants/miniAppFeatures";
import { AppError } from "@dts";
import { fetchPublicSettings, upsertSetting } from "@service/settingsApi";

const SETTING_KEY = "mini_app_features";

const labelOf = (key: string): string =>
    MINI_APP_FEATURE_CATALOG.find(f => f.key === key)?.label || key;

const MiniAppFeaturesPage: React.FC = () => (
    <AdminGuard permissions={["settings.read"]}>
        <MiniAppFeaturesContent />
    </AdminGuard>
);

const MiniAppFeaturesContent: React.FC = () => {
    const canSave = usePermission("settings.update");

    const [rows, setRows] = useState<MiniAppFeatureConfigEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchPublicSettings()
            .then(settings => {
                const config = settings[SETTING_KEY] as
                    | MiniAppFeatureConfigEntry[]
                    | undefined;
                setRows(mergeFeatureConfig(config));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const setRow = (key: string, patch: Partial<MiniAppFeatureConfigEntry>) => {
        setRows(prev =>
            prev.map(r => (r.key === key ? { ...r, ...patch } : r)),
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await upsertSetting(
                SETTING_KEY,
                rows.map(({ key, order, visible }) => ({ key, order, visible })),
                "Thứ tự & hiển thị tính năng trên trang chủ Mini App",
            );
            toast.success("Đã lưu thứ tự tính năng Mini App");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const sortedRows = [...rows].sort((a, b) => a.order - b.order);

    return (
        <div>
            <PageHeader
                title="Tính năng Mini App"
                description="Quản lý tính năng hiển thị trên Mini App cho cư dân."
                action={
                    canSave && (
                        <Button loading={saving} onClick={handleSave}>
                            Lưu thay đổi
                        </Button>
                    )
                }
            />

            <p className="mb-4 text-sm text-text_2">
                6 tính năng có thứ tự nhỏ nhất sẽ hiện sẵn trên trang chủ; các
                tính năng còn lại nằm sau nút "Xem thêm". Tính năng bị bỏ chọn
                "Hiển thị" sẽ không xuất hiện trên Mini App.
            </p>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tính năng</TableHead>
                                <TableHead>Hiển thị trên Mini App</TableHead>
                                <TableHead>Thứ tự</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRows.map((row, index) => (
                                <TableRow key={row.key}>
                                    <TableCell className="text-center text-text_2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {labelOf(row.key)}
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={row.visible}
                                            disabled={!canSave}
                                            onCheckedChange={checked =>
                                                setRow(row.key, {
                                                    visible: checked === true,
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="w-24"
                                            disabled={!canSave}
                                            value={row.order}
                                            onChange={e =>
                                                setRow(row.key, {
                                                    order:
                                                        Number(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default MiniAppFeaturesPage;
