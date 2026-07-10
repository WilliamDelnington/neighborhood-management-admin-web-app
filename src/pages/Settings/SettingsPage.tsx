import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import { AppError } from "@dts";
import { fetchAllSettings, upsertSetting } from "@service/settingsApi";

type EditableSetting = {
    key: string;
    isComplex: boolean;
    text: string;
    originalType: "string" | "number" | "boolean" | "object";
};

const buildEditable = (key: string, value: unknown): EditableSetting => {
    if (value !== null && typeof value === "object") {
        return {
            key,
            isComplex: true,
            text: JSON.stringify(value, null, 2),
            originalType: "object",
        };
    }
    if (typeof value === "number") {
        return {
            key,
            isComplex: false,
            text: String(value),
            originalType: "number",
        };
    }
    if (typeof value === "boolean") {
        return {
            key,
            isComplex: false,
            text: String(value),
            originalType: "boolean",
        };
    }
    return {
        key,
        isComplex: false,
        text: value === undefined || value === null ? "" : String(value),
        originalType: "string",
    };
};

const coerceValue = (setting: EditableSetting): unknown => {
    if (setting.isComplex) return JSON.parse(setting.text);
    if (setting.originalType === "number") return Number(setting.text);
    if (setting.originalType === "boolean") return setting.text === "true";
    return setting.text;
};

const SEED_KEY_EXAMPLES = ["app_identity", "oa_info", "emergency_contacts"];

const SettingsPage: React.FC = () => (
    <AdminGuard roles={["admin"]}>
        <SettingsContent />
    </AdminGuard>
);

const SettingsContent: React.FC = () => {
    const [settings, setSettings] = useState<Record<string, EditableSetting>>(
        {},
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [addingNew, setAddingNew] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchAllSettings()
            .then(data => {
                const mapped: Record<string, EditableSetting> = {};
                Object.entries(data || {}).forEach(([key, value]) => {
                    mapped[key] = buildEditable(key, value);
                });
                setSettings(mapped);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleTextChange = (key: string, text: string) => {
        setSettings(prev => ({ ...prev, [key]: { ...prev[key], text } }));
    };

    const handleSave = async (key: string) => {
        const setting = settings[key];
        if (!setting) return;
        let value: unknown;
        try {
            value = coerceValue(setting);
        } catch {
            toast.error("Giá trị JSON không hợp lệ");
            return;
        }
        try {
            setSavingKey(key);
            await upsertSetting(key, value);
            toast.success("Đã lưu cấu hình");
        } catch (err) {
            toast.error((err as AppError).message || "Có lỗi xảy ra");
        } finally {
            setSavingKey(null);
        }
    };

    const handleAddNew = async () => {
        if (!newKey.trim()) {
            toast.error("Vui lòng nhập khóa cấu hình (key)");
            return;
        }
        let value: unknown = newValue;
        try {
            value = JSON.parse(newValue);
        } catch {
            // Khong phai JSON hop le -> giu nguyen dang chuoi text
            value = newValue;
        }
        try {
            setAddingNew(true);
            await upsertSetting(
                newKey.trim(),
                value,
                newDescription.trim() || undefined,
            );
            toast.success("Đã thêm cấu hình mới");
            setShowAddForm(false);
            setNewKey("");
            setNewValue("");
            setNewDescription("");
            load();
        } catch (err) {
            toast.error((err as AppError).message || "Có lỗi xảy ra");
        } finally {
            setAddingNew(false);
        }
    };

    const entries = Object.values(settings);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Cài đặt</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && (
                <>
                    {entries.length === 0 && !showAddForm && (
                        <EmptyState
                            label={`Chưa có cấu hình nào. Có thể thêm các khóa gợi ý như: ${SEED_KEY_EXAMPLES.join(
                                ", ",
                            )}`}
                        />
                    )}

                    {entries.map(setting => (
                        <div
                            key={setting.key}
                            className="mb-3 rounded-2xl border border-divider_01 bg-white p-4 shadow-sm"
                        >
                            <h2 className="mb-2 text-sm font-semibold">
                                {setting.key}
                            </h2>
                            {setting.isComplex ? (
                                <Textarea
                                    rows={5}
                                    value={setting.text}
                                    onChange={e =>
                                        handleTextChange(
                                            setting.key,
                                            e.target.value,
                                        )
                                    }
                                />
                            ) : (
                                <Input
                                    value={setting.text}
                                    onChange={e =>
                                        handleTextChange(
                                            setting.key,
                                            e.target.value,
                                        )
                                    }
                                />
                            )}
                            <div className="mt-2">
                                <Button
                                    size="sm"
                                    loading={savingKey === setting.key}
                                    onClick={() => handleSave(setting.key)}
                                >
                                    Lưu
                                </Button>
                            </div>
                        </div>
                    ))}

                    {showAddForm ? (
                        <div className="mb-3 rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold">
                                Thêm cấu hình mới
                            </h2>
                            <div className="mb-3">
                                <Label>Khóa (key)</Label>
                                <Input
                                    className="mt-1"
                                    placeholder={`Ví dụ: ${SEED_KEY_EXAMPLES[0]}`}
                                    value={newKey}
                                    onChange={e => setNewKey(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Giá trị (chuỗi hoặc JSON)</Label>
                                <Textarea
                                    className="mt-1"
                                    rows={4}
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Mô tả (nếu có)</Label>
                                <Input
                                    className="mt-1"
                                    value={newDescription}
                                    onChange={e =>
                                        setNewDescription(e.target.value)
                                    }
                                />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="w-full"
                                    loading={addingNew}
                                    onClick={handleAddNew}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setShowAddForm(true)}
                        >
                            + Thêm cấu hình
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default SettingsPage;
