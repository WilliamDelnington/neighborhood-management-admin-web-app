import React, { useEffect, useMemo, useState } from "react";
import { Landmark, Loader2, Search, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import type { AppError, Province, User, Ward } from "@dts";
import {
    fetchProvinces,
    fetchWardsByProvince,
} from "@service/administrativeDivisionApi";
import { fetchWardManagers, updateUser } from "@service/userApi";

const HANOI_PROVINCE_CODE = 1;
const roleLabel = (user: User) =>
    user.roles.includes("secretary") ? "Bí thư" : "Cán bộ UBND";

const WardManagementPage: React.FC = () => (
    <AdminGuard permissions={["wards.manage"]}>
        <WardManagementContent />
    </AdminGuard>
);

const WardManagementContent: React.FC = () => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [provinceCode, setProvinceCode] = useState(HANOI_PROVINCE_CODE);
    const [wards, setWards] = useState<Ward[]>([]);
    const [staff, setStaff] = useState<User[]>([]);
    const [selectedWardCode, setSelectedWardCode] = useState<number>();
    const [candidateId, setCandidateId] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string>();

    const loadStaff = async () => {
        setStaff(await fetchWardManagers());
    };

    useEffect(() => {
        Promise.all([fetchProvinces(), loadStaff()])
            .then(([items]) => setProvinces(items))
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchWardsByProvince(provinceCode)
            .then(items => {
                setWards(items);
                setSelectedWardCode(current =>
                    current && items.some(ward => ward.code === current)
                        ? current
                        : items[0]?.code,
                );
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setLoading(false));
    }, [provinceCode]);

    const province = provinces.find(item => item.code === provinceCode);
    const selectedWard = wards.find(ward => ward.code === selectedWardCode);
    const managers = staff.filter(user => user.wardCode === selectedWardCode);
    const candidates = staff.filter(user => user.wardCode !== selectedWardCode);
    const filteredWards = useMemo(() => {
        const term = search.trim().toLocaleLowerCase("vi");
        if (!term) return wards;
        return wards.filter(
            ward =>
                ward.name.toLocaleLowerCase("vi").includes(term) ||
                String(ward.code).includes(term),
        );
    }, [search, wards]);

    const assign = async () => {
        if (!selectedWard || !candidateId || !province) return;
        try {
            setSavingId(candidateId);
            await updateUser(candidateId, {
                provinceCode: province.code,
                provinceName: province.name,
                wardCode: selectedWard.code,
                wardName: selectedWard.name,
            });
            await loadStaff();
            setCandidateId("");
            toast.success("Đã phân công quản lý phường/xã");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingId(undefined);
        }
    };

    const unassign = async (userId: string) => {
        try {
            setSavingId(userId);
            await updateUser(userId, {
                provinceCode: null,
                provinceName: null,
                wardCode: null,
                wardName: null,
            });
            await loadStaff();
            toast.success("Đã bỏ phân công phường/xã");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingId(undefined);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-semibold">
                    <Landmark className="h-6 w-6" /> Quản lý phường / xã
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Phân công Bí thư và Cán bộ UBND theo phạm vi phường/xã.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <Card>
                    <CardHeader><CardTitle>Danh sách phường / xã</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tỉnh / thành phố</Label>
                                <Select value={String(provinceCode)} onValueChange={value => setProvinceCode(Number(value))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{provinces.map(item => <SelectItem key={item.code} value={String(item.code)}>{item.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tìm kiếm</Label>
                                <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tên hoặc mã phường/xã" /></div>
                            </div>
                        </div>
                        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                            <div className="max-h-[560px] overflow-auto rounded-md border">
                                <Table><TableHeader><TableRow><TableHead className="w-12 text-center">STT</TableHead><TableHead>Phường / xã</TableHead><TableHead>Mã</TableHead><TableHead>Người quản lý</TableHead></TableRow></TableHeader>
                                    <TableBody>{filteredWards.map((ward, index) => {
                                        const count = staff.filter(user => user.wardCode === ward.code).length;
                                        return <TableRow key={ward.code} className={`cursor-pointer ${ward.code === selectedWardCode ? "bg-muted" : ""}`} onClick={() => setSelectedWardCode(ward.code)}><TableCell className="text-center text-text_2">{index + 1}</TableCell><TableCell className="font-medium">{ward.name}</TableCell><TableCell>{ward.code}</TableCell><TableCell><Badge tone={count ? "green" : "gray"}>{count}</Badge></TableCell></TableRow>;
                                    })}</TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>{selectedWard?.name || "Chọn phường / xã"}</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        {selectedWard && <>
                            <div className="space-y-2"><Label>Thêm người quản lý</Label><Select value={candidateId} onValueChange={setCandidateId}><SelectTrigger><SelectValue placeholder="Chọn Bí thư hoặc Cán bộ UBND" /></SelectTrigger><SelectContent>{candidates.map(user => <SelectItem key={user.id} value={user.id}>{user.displayName} — {roleLabel(user)}</SelectItem>)}</SelectContent></Select><Button className="w-full" disabled={!candidateId || !!savingId} onClick={assign}><UserPlus className="mr-2 h-4 w-4" />Phân công</Button></div>
                            <div className="space-y-3"><Label>Đang quản lý ({managers.length})</Label>{managers.length === 0 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Chưa có người quản lý.</p> : managers.map(user => <div key={user.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">{user.displayName}</p><p className="text-sm text-muted-foreground">{user.phone} · {roleLabel(user)}</p></div><Button variant="outline" size="sm" disabled={savingId === user.id} onClick={() => unassign(user.id)}>{savingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}</Button></div>)}</div>
                        </>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WardManagementPage;
