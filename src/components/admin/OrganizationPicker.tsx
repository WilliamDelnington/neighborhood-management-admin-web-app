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
import { fetchOrganizations } from "@service/organizationApi";
import { Organization } from "@dts";
import { LoadingState, EmptyState } from "./DataStates";

export interface OrganizationPickerProps {
    value?: string;
    valueLabel?: string;
    onChange: (organizationId: string | null, organization?: Organization) => void;
    disabled?: boolean;
}

/**
 * Chon to chuc (trong so cac to chuc ma minh la nguoi dai dien - server tu
 * loc theo actor, xem organizationService.listOrganizations) de dang ky nha
 * so duoi ten to chuc do, thay vi dung ten ca nhan minh.
 */
const OrganizationPicker: React.FC<OrganizationPickerProps> = ({
    value,
    valueLabel,
    onChange,
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const timer = setTimeout(() => {
            fetchOrganizations({ page: 1, limit: 20, search: search || undefined, active: true })
                .then(res => setItems(res.items))
                .catch(() => setItems([]))
                .finally(() => setLoading(false));
        }, 250);
        // eslint-disable-next-line consistent-return
        return () => clearTimeout(timer);
    }, [open, search]);

    return (
        <div>
            <Label>Đăng ký dưới tên tổ chức (nếu có)</Label>
            <div className="mt-1 flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex h-9 flex-1 items-center rounded-md border border-input bg-background px-3 text-left text-sm ${
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${value ? "" : "text-muted-foreground"}`}
                    onClick={() => setOpen(true)}
                >
                    {value ? valueLabel || value : "Đăng ký bằng cá nhân (mặc định)"}
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
                        <DialogTitle>Chọn tổ chức</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm theo tên hoặc mã số thuế..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading && <LoadingState />}
                        {!loading && items.length === 0 && (
                            <EmptyState label="Không tìm thấy tổ chức phù hợp" />
                        )}
                        {!loading &&
                            items.map(o => (
                                <button
                                    key={o._id}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ng_10"
                                    onClick={() => {
                                        onChange(o._id, o);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="font-medium">{o.name}</div>
                                    <div className="text-xs text-text_2">
                                        {o.taxCode}
                                    </div>
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrganizationPicker;
