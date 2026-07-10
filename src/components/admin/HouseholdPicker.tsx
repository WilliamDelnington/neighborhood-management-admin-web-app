import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { fetchHouseholds } from "@service/householdApi";
import { Household } from "@dts";
import { LoadingState, EmptyState } from "./DataStates";

export interface HouseholdPickerProps {
    label?: string;
    value?: string;
    valueLabel?: string;
    onChange: (householdId: string, household: Household) => void;
    disabled?: boolean;
}

const HouseholdPicker: React.FC<HouseholdPickerProps> = ({
    label = "Hộ dân",
    value,
    valueLabel,
    onChange,
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Household[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const timer = setTimeout(() => {
            fetchHouseholds({ page: 1, limit: 20, search: search || undefined })
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
            <button
                type="button"
                disabled={disabled}
                className={`mt-1 flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-left text-sm ${
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${value ? "" : "text-muted-foreground"}`}
                onClick={() => setOpen(true)}
            >
                {value ? valueLabel || value : "Chọn hộ dân..."}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chọn hộ dân</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm theo mã hộ, địa chỉ, chủ hộ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading && <LoadingState />}
                        {!loading && items.length === 0 && (
                            <EmptyState label="Không tìm thấy hộ dân phù hợp" />
                        )}
                        {!loading &&
                            items.map(h => (
                                <button
                                    key={h._id}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ng_10"
                                    onClick={() => {
                                        onChange(h._id, h);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="font-medium">
                                        {h.code} — {h.address}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        Chủ hộ: {h.headOfHousehold} · Cụm {h.cluster}
                                    </div>
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HouseholdPicker;
