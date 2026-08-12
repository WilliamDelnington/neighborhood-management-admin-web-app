import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Checkbox } from "@components/ui/checkbox";
import { Badge } from "@components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { AppError, RequestFormField, RequestTypeDefinition } from "@dts";
import { usePermission } from "@store/authStore";
import {
    archiveRequestTypeDefinition,
    createRequestTypeDefinition,
    fetchRequestTypeDefinitions,
    fetchRequestTypeRoles,
    RequestTypeRoleOption,
    updateRequestTypeDefinition,
} from "@service/requestTypeApi";

type FieldDraft = RequestFormField & { optionsText: string };
type FormState = {
    key: string;
    name: string;
    description: string;
    active: boolean;
    dataEntryMode: "sender" | "recipient";
    allowedSenderRoles: string[];
    allowedReceiverRoles: string[];
    fields: FieldDraft[];
};

const EMPTY_FORM: FormState = {
    key: "",
    name: "",
    description: "",
    active: true,
    dataEntryMode: "recipient",
    allowedSenderRoles: [],
    allowedReceiverRoles: [],
    fields: [],
};

const EMPTY_FIELD: FieldDraft = {
    key: "",
    label: "",
    type: "text",
    required: false,
    options: [],
    optionsText: "",
    classification: "internal",
};

const RequestTypeListPage: React.FC = () => (
    <AdminGuard permissions={["request_types.read"]}>
        <RequestTypeListContent />
    </AdminGuard>
);

const RequestTypeListContent: React.FC = () => {
    const canManage = usePermission("request_types.manage");
    const [items, setItems] = useState<RequestTypeDefinition[]>([]);
    const [roles, setRoles] = useState<RequestTypeRoleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<RequestTypeDefinition | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            fetchRequestTypeDefinitions({ limit: 200 }),
            fetchRequestTypeRoles(),
        ])
            .then(([definitions, roleList]) => {
                setItems(definitions.items);
                setRoles(roleList);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (item: RequestTypeDefinition) => {
        setEditing(item);
        setForm({
            key: item.key,
            name: item.name,
            description: item.description || "",
            active: item.active !== false,
            dataEntryMode: item.dataEntryMode,
            allowedSenderRoles: item.allowedSenderRoles || [],
            allowedReceiverRoles: item.allowedReceiverRoles || [],
            fields: item.fields.map(field => ({
                ...field,
                optionsText: field.options.join(", "),
            })),
        });
        setOpen(true);
    };

    const toggleRole = (
        target: "allowedSenderRoles" | "allowedReceiverRoles",
        roleKey: string,
    ) => {
        setForm(current => ({
            ...current,
            [target]: current[target].includes(roleKey)
                ? current[target].filter(key => key !== roleKey)
                : [...current[target], roleKey],
        }));
    };

    const updateField = <K extends keyof FieldDraft>(
        index: number,
        key: K,
        value: FieldDraft[K],
    ) => {
        setForm(current => ({
            ...current,
            fields: current.fields.map((field, fieldIndex) =>
                fieldIndex === index ? { ...field, [key]: value } : field,
            ),
        }));
    };

    const handleSave = async () => {
        if (
            !form.name.trim() ||
            (!editing && !form.key.trim()) ||
            form.allowedSenderRoles.length === 0 ||
            form.allowedReceiverRoles.length === 0 ||
            form.fields.some(field => !field.key.trim() || !field.label.trim())
        ) {
            toast.error("Vui lòng nhập đủ tên, vai trò và các trường biểu mẫu");
            return;
        }
        const payload = {
            key: form.key.trim(),
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            active: form.active,
            dataEntryMode: form.dataEntryMode,
            allowedSenderRoles: form.allowedSenderRoles,
            allowedReceiverRoles: form.allowedReceiverRoles,
            fields: form.fields.map(({ optionsText, ...field }) => ({
                ...field,
                key: field.key.trim(),
                label: field.label.trim(),
                options:
                    field.type === "single_select" || field.type === "multi_select"
                        ? optionsText
                              .split(",")
                              .map(value => value.trim())
                              .filter(Boolean)
                        : [],
            })),
        };
        try {
            setSaving(true);
            if (editing?._id) {
                const { key: _key, ...update } = payload;
                await updateRequestTypeDefinition(editing._id, update);
                toast.success("Đã cập nhật loại nhiệm vụ");
            } else {
                await createRequestTypeDefinition(payload);
                toast.success("Đã tạo loại nhiệm vụ");
            }
            setOpen(false);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (item: RequestTypeDefinition) => {
        if (!item._id || !window.confirm(`Ngừng sử dụng “${item.name}”?`)) return;
        try {
            await archiveRequestTypeDefinition(item._id);
            toast.success("Đã ngừng sử dụng loại nhiệm vụ");
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">Loại nhiệm vụ & biểu mẫu</h1>
                    <p className="mt-1 text-sm text-text_2">
                        Tạo nghiệp vụ mới bằng cấu hình, không cần sửa mã nguồn.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" /> Thêm loại nhiệm vụ
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={load} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có loại nhiệm vụ tùy chỉnh" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên nghiệp vụ</TableHead>
                                <TableHead>Thu thập bởi</TableHead>
                                <TableHead>Số trường</TableHead>
                                <TableHead>Phiên bản</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                {canManage && <TableHead />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item._id || item.key}>
                                    <TableCell className="text-center text-text_2">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.key}</TableCell>
                                    <TableCell>
                                        <button
                                            className="text-left font-medium text-main hover:underline"
                                            onClick={() => canManage && openEdit(item)}
                                        >
                                            {item.name}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        {item.dataEntryMode === "recipient"
                                            ? "Người nhận"
                                            : "Người giao"}
                                    </TableCell>
                                    <TableCell>{item.fields.length}</TableCell>
                                    <TableCell>v{item.version}</TableCell>
                                    <TableCell>
                                        <Badge tone={item.active === false ? "gray" : "green"}>
                                            {item.active === false ? "Ngừng dùng" : "Hoạt động"}
                                        </Badge>
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-right">
                                            {item.active !== false && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Ngừng sử dụng"
                                                    onClick={() => void handleArchive(item)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>
                            {editing ? "Sửa loại nhiệm vụ" : "Thêm loại nhiệm vụ"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto py-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Mã cấu hình</Label>
                                <Input
                                    className="mt-1"
                                    value={form.key}
                                    disabled={!!editing}
                                    placeholder="ho_ngheo_2026"
                                    onChange={event =>
                                        setForm(current => ({
                                            ...current,
                                            key: event.target.value.toLowerCase(),
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>Tên nghiệp vụ</Label>
                                <Input
                                    className="mt-1"
                                    value={form.name}
                                    onChange={event =>
                                        setForm(current => ({ ...current, name: event.target.value }))
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Mô tả</Label>
                            <Textarea
                                className="mt-1"
                                value={form.description}
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Người nhập dữ liệu biểu mẫu</Label>
                            <Select
                                value={form.dataEntryMode}
                                onValueChange={value =>
                                    setForm(current => ({
                                        ...current,
                                        dataEntryMode: value as "sender" | "recipient",
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recipient">Người nhận nhiệm vụ</SelectItem>
                                    <SelectItem value="sender">Người giao nhiệm vụ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(["allowedSenderRoles", "allowedReceiverRoles"] as const).map(target => (
                            <div key={target}>
                                <Label>
                                    {target === "allowedSenderRoles"
                                        ? "Vai trò được giao nhiệm vụ"
                                        : "Vai trò được nhận nhiệm vụ"}
                                </Label>
                                <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                                    {roles.map(role => (
                                        <label key={role.key} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={form[target].includes(role.key)}
                                                onCheckedChange={() => toggleRole(target, role.key)}
                                            />
                                            {role.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <Label>Trường dữ liệu cần thu thập</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Payload được mã hóa trước khi lưu; sửa danh sách sẽ tăng phiên bản.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setForm(current => ({
                                            ...current,
                                            fields: [...current.fields, { ...EMPTY_FIELD }],
                                        }))
                                    }
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Thêm trường
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.fields.map((field, index) => (
                                    <div key={index} className="rounded-lg border p-3">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <Input
                                                value={field.key}
                                                placeholder="ma_truong"
                                                onChange={event => updateField(index, "key", event.target.value.toLowerCase())}
                                            />
                                            <Input
                                                value={field.label}
                                                placeholder="Tên hiển thị"
                                                onChange={event => updateField(index, "label", event.target.value)}
                                            />
                                            <Select
                                                value={field.type}
                                                onValueChange={value => updateField(index, "type", value as RequestFormField["type"])}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Văn bản ngắn</SelectItem>
                                                    <SelectItem value="long_text">Văn bản dài</SelectItem>
                                                    <SelectItem value="number">Số</SelectItem>
                                                    <SelectItem value="date">Ngày</SelectItem>
                                                    <SelectItem value="boolean">Có / Không</SelectItem>
                                                    <SelectItem value="single_select">Chọn một</SelectItem>
                                                    <SelectItem value="multi_select">Chọn nhiều</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={field.classification}
                                                onValueChange={value => updateField(index, "classification", value as RequestFormField["classification"])}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="internal">Nội bộ</SelectItem>
                                                    <SelectItem value="personal">Dữ liệu cá nhân</SelectItem>
                                                    <SelectItem value="sensitive">Dữ liệu nhạy cảm</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {(field.type === "single_select" || field.type === "multi_select") && (
                                            <Input
                                                className="mt-2"
                                                value={field.optionsText}
                                                placeholder="Các lựa chọn, cách nhau bằng dấu phẩy"
                                                onChange={event => updateField(index, "optionsText", event.target.value)}
                                            />
                                        )}
                                        <div className="mt-2 flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={field.required}
                                                    onCheckedChange={checked => updateField(index, "required", checked === true)}
                                                />
                                                Bắt buộc
                                            </label>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setForm(current => ({
                                                        ...current,
                                                        fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index),
                                                    }))
                                                }
                                            >
                                                Xóa trường
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button className="w-full" loading={saving} onClick={() => void handleSave()}>
                            Lưu cấu hình
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default RequestTypeListPage;
