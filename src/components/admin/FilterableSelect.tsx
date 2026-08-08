import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { EmptyState } from "./DataStates";

export interface FilterableSelectProps<T> {
    label: string;
    placeholder: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    items: T[];
    getId: (item: T) => string;
    getLabel: (item: T) => string;
    getSubLabel?: (item: T) => string;
    value?: string;
    valueLabel?: string;
    onChange: (id: string | null, item?: T) => void;
    disabled?: boolean;
    // Street thuong bat buoc (khong co lua chon "chua chon") - tat X/"chua
    // chon" khi false, giu nguyen hanh vi hien tai cua Select truoc day.
    clearable?: boolean;
    hint?: string;
}

/**
 * Picker co the go chu de loc danh sach - thay the <Select> thuong cho cac
 * danh sach dai (tinh/thanh pho, phuong/xa, duong/pho, to dan pho) ma nguoi
 * dung kho cuon tim bang tay. Loc client-side tren danh sach `items` da co san
 * (khong goi API rieng) - Radix Select khong ho tro tot mot input go chu ben
 * trong SelectContent (xung dot voi typeahead/roving-focus cua no), nen dung
 * lai pattern Dialog + o tim kiem da co san o OrganizationPicker.tsx thay vi
 * co nhoi vao Select.
 */
function FilterableSelect<T>({
    label,
    placeholder,
    searchPlaceholder = "Gõ để tìm kiếm...",
    emptyLabel = "Không tìm thấy kết quả phù hợp",
    items,
    getId,
    getLabel,
    getSubLabel,
    value,
    valueLabel,
    onChange,
    disabled,
    clearable = true,
    hint,
}: FilterableSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return items;
        return items.filter(item => {
            const label = getLabel(item).toLowerCase();
            const subLabel = getSubLabel?.(item)?.toLowerCase() || "";
            return label.includes(keyword) || subLabel.includes(keyword);
        });
    }, [items, search, getLabel, getSubLabel]);

    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex h-9 flex-1 items-center rounded-md border border-input bg-background px-3 text-left text-sm ${
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${value ? "" : "text-muted-foreground"}`}
                    onClick={() => {
                        if (disabled) return;
                        setSearch("");
                        setOpen(true);
                    }}
                >
                    {value ? valueLabel || value : placeholder}
                </button>
                {clearable && value && !disabled && (
                    <button
                        type="button"
                        className="text-text_3"
                        onClick={() => onChange(null)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{label}</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {filtered.length === 0 && (
                            <EmptyState label={emptyLabel} />
                        )}
                        {filtered.map(item => (
                            <button
                                key={getId(item)}
                                type="button"
                                className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ng_10"
                                onClick={() => {
                                    onChange(getId(item), item);
                                    setOpen(false);
                                }}
                            >
                                <div className="font-medium">
                                    {getLabel(item)}
                                </div>
                                {getSubLabel?.(item) && (
                                    <div className="text-xs text-text_2">
                                        {getSubLabel(item)}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default FilterableSelect;
