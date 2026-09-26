import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { fetchCompanies } from "@service/companyApi";
import { Company } from "@dts";
import { LoadingState, EmptyState } from "./DataStates";

export interface CompanyPickerProps {
    value?: string;
    valueLabel?: string;
    onChange: (companyId: string | null, company?: Company) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Chon mot Company da ton tai (server tu loc theo pham vi actor, xem
 * companyService.listCompanies). Cong ty da lien ket to chuc khac van hien
 * nhung khong chon duoc - dung khi tao to chuc chu so huu tu cong ty co san
 * (xem OrganizationListPage).
 */
const CompanyPicker: React.FC<CompanyPickerProps> = ({
    value,
    valueLabel,
    onChange,
    label = "Chọn công ty",
    placeholder = "Chưa chọn công ty",
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const timer = setTimeout(() => {
            fetchCompanies({ page: 1, limit: 20, search: search || undefined })
                .then(res => setItems(res.items))
                .catch(() => setItems([]))
                .finally(() => setLoading(false));
        }, 250);
        // eslint-disable-next-line consistent-return
        return () => clearTimeout(timer);
    }, [open, search]);

    return (
        <div>
            <Label>{label}</Label>
            <div className="mt-1 flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex h-9 flex-1 items-center rounded-md border border-input bg-background px-3 text-left text-sm ${
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${value ? "" : "text-muted-foreground"}`}
                    onClick={() => setOpen(true)}
                >
                    {value ? valueLabel || value : placeholder}
                </button>
                {value && !disabled && (
                    <button
                        type="button"
                        className="text-text_3"
                        onClick={() => onChange(null)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chọn công ty</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm theo tên công ty..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading && <LoadingState />}
                        {!loading && items.length === 0 && (
                            <EmptyState label="Không tìm thấy công ty phù hợp" />
                        )}
                        {!loading &&
                            items.map(c => {
                                const linkedOrganization =
                                    c.organizationId &&
                                    typeof c.organizationId === "object"
                                        ? c.organizationId.name
                                        : c.organizationId;
                                const house =
                                    c.houseId && typeof c.houseId === "object"
                                        ? c.houseId
                                        : null;
                                return (
                                    <button
                                        key={c._id}
                                        type="button"
                                        disabled={!!linkedOrganization}
                                        className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ng_10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                                        onClick={() => {
                                            onChange(c._id, c);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="font-medium">{c.name}</div>
                                        <div className="text-xs text-text_2">
                                            MST {c.taxCode}
                                            {house && ` · Nhà ${house.code}`}
                                        </div>
                                        {linkedOrganization && (
                                            <div className="text-xs text-text_2">
                                                Đã liên kết tổ chức:{" "}
                                                {linkedOrganization}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CompanyPicker;
