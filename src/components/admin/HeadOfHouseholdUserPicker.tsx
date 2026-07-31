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
import { fetchUsers } from "@service/userApi";
import { User } from "@dts";
import { LoadingState, EmptyState } from "./DataStates";

export interface HeadOfHouseholdUserPickerProps {
    value?: string;
    valueLabel?: string;
    onChange: (userId: string | null, user?: User) => void;
    disabled?: boolean;
}

/**
 * Chon tai khoan (phai co vai tro house_owner) de lien ket lam chu ho thuc su
 * (Household.headOfHouseholdUserId), thay vi chi go ten chu ho dang text tu do.
 */
const HeadOfHouseholdUserPicker: React.FC<HeadOfHouseholdUserPickerProps> = ({
    value,
    valueLabel,
    onChange,
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const timer = setTimeout(() => {
            fetchUsers(1, 20, search || undefined, "house_owner")
                .then(res => setItems(res.items))
                .catch(() => setItems([]))
                .finally(() => setLoading(false));
        }, 250);
        // eslint-disable-next-line consistent-return
        return () => clearTimeout(timer);
    }, [open, search]);

    return (
        <div>
            <Label>Liên kết tài khoản chủ hộ (nếu có)</Label>
            <div className="mt-1 flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex h-9 flex-1 items-center rounded-md border border-input bg-background px-3 text-left text-sm ${
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${value ? "" : "text-muted-foreground"}`}
                    onClick={() => setOpen(true)}
                >
                    {value ? valueLabel || value : "Chưa liên kết tài khoản..."}
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
                        <DialogTitle>Chọn tài khoản chủ hộ</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm theo tên hoặc số điện thoại..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading && <LoadingState />}
                        {!loading && items.length === 0 && (
                            <EmptyState label="Không tìm thấy tài khoản Chủ hộ phù hợp" />
                        )}
                        {!loading &&
                            items.map(u => (
                                <button
                                    key={u.id}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ng_10"
                                    onClick={() => {
                                        onChange(u.id, u);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="font-medium">
                                        {u.displayName}
                                    </div>
                                    {u.phone && (
                                        <div className="text-xs text-text_2">
                                            {u.phone}
                                        </div>
                                    )}
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HeadOfHouseholdUserPicker;
