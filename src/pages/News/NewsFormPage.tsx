import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Trash2, Upload } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { LOAI_TIN_TUC_LABEL } from "@constants/domain";
import { resolveAssetUrl } from "@constants/common";
import { AppError, LoaiTinTuc, TrangThaiTinTuc } from "@dts";
import {
    NewsInput,
    createNews,
    deleteNewsImage,
    fetchNewsDetail,
    publishNews,
    updateNews,
    uploadNewsImage,
} from "@service/newsApi";

const NewsFormPage: React.FC = () => (
    <AdminGuard permissions={["news.read"]}>
        <NewsFormContent />
    </AdminGuard>
);

const NewsFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canManage = usePermission(isEdit ? "news.update" : "news.create");
    const canPublish = usePermission("news.publish");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState<LoaiTinTuc>("chung");
    const [pinned, setPinned] = useState(false);
    const [status, setStatus] = useState<TrangThaiTinTuc>("nhap");

    const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
    const [images, setImages] = useState<string[]>([]);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(
        null,
    );
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const loadDetail = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchNewsDetail(id)
            .then(n => {
                setTitle(n.title);
                setContent(n.content);
                setCategory(n.category);
                setPinned(n.pinned);
                setStatus(n.status);
                setCoverImageUrl(n.coverImageUrl);
                setImages(n.images || []);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Vui lòng nhập tiêu đề và nội dung");
            return;
        }
        const input: NewsInput = {
            title: title.trim(),
            content: content.trim(),
            category,
            pinned,
        };
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateNews(id, input);
                toast.success("Đã cập nhật tin tức");
                navigate("/news");
            } else {
                const news = await createNews(input);
                toast.success("Đã tạo tin tức (bản nháp)");
                navigate(`/news/${news._id}/edit`);
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!id) return;
        try {
            setPublishing(true);
            await publishNews(id);
            toast.success("Đã đăng tin tức tới người dân");
            navigate("/news");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setPublishing(false);
        }
    };

    const handleCoverClick = () => coverInputRef.current?.click();
    const handleGalleryClick = () => galleryInputRef.current?.click();

    const handleCoverSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !id) return;
        try {
            setUploadingCover(true);
            const news = await uploadNewsImage(id, file, true);
            setCoverImageUrl(news.coverImageUrl);
            toast.success("Đã tải lên ảnh đại diện");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleGallerySelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !id) return;
        try {
            setUploadingGallery(true);
            const news = await uploadNewsImage(id, file, false);
            setImages(news.images || []);
            toast.success("Đã tải lên ảnh");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleDeleteImage = async (url: string) => {
        if (!id) return;
        try {
            setDeletingImageUrl(url);
            const news = await deleteNewsImage(id, url);
            setCoverImageUrl(news.coverImageUrl);
            setImages(news.images || []);
            toast.success("Đã xóa ảnh");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingImageUrl(null);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/news")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa tin tức" : "Thêm tin tức"}
                </h1>
            </div>

            <div className="max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                {isEdit && loading && <LoadingState />}
                {isEdit && !loading && loadError && (
                    <ErrorState onRetry={loadDetail} />
                )}
                {(!isEdit || (!loading && !loadError)) && (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <Label>Tiêu đề</Label>
                            <Input
                                placeholder="Nhập tiêu đề tin tức"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                placeholder="Nội dung tin tức"
                                rows={6}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Phân loại</Label>
                            <Select
                                value={category}
                                onValueChange={v =>
                                    setCategory(v as LoaiTinTuc)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(
                                            LOAI_TIN_TUC_LABEL,
                                        ) as [LoaiTinTuc, string][]
                                    ).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <label
                            htmlFor="pinned"
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="pinned"
                                checked={pinned}
                                onCheckedChange={checked =>
                                    setPinned(checked === true)
                                }
                            />
                            Ghim lên đầu danh sách
                        </label>

                        {canManage && (
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <Button loading={saving} onClick={handleSubmit}>
                                    {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                                </Button>
                                {isEdit && status === "nhap" && canPublish && (
                                    <Button
                                        variant="outline"
                                        loading={publishing}
                                        onClick={handlePublish}
                                    >
                                        Đăng tin tức
                                    </Button>
                                )}
                            </div>
                        )}

                        {isEdit && (
                            <div className="mt-2 border-t border-divider_01 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Ảnh đại diện
                                    </h3>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={uploadingCover}
                                            onClick={handleCoverClick}
                                        >
                                            <Upload className="mr-1 h-3.5 w-3.5" />
                                            {coverImageUrl
                                                ? "Thay ảnh"
                                                : "Tải lên"}
                                        </Button>
                                    )}
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={handleCoverSelected}
                                    />
                                </div>
                                {coverImageUrl ? (
                                    <div className="relative w-fit">
                                        <img
                                            src={resolveAssetUrl(
                                                coverImageUrl,
                                            )}
                                            alt=""
                                            className="h-32 w-48 rounded-lg object-cover"
                                        />
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="absolute right-1 top-1 !text-red-500"
                                                loading={
                                                    deletingImageUrl ===
                                                    coverImageUrl
                                                }
                                                onClick={() =>
                                                    handleDeleteImage(
                                                        coverImageUrl,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-ng_10 text-text_2">
                                        <ImagePlus className="h-6 w-6" />
                                    </div>
                                )}

                                <div className="mb-3 mt-6 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Thư viện ảnh
                                    </h3>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={uploadingGallery}
                                            onClick={handleGalleryClick}
                                        >
                                            <Upload className="mr-1 h-3.5 w-3.5" />
                                            Tải lên
                                        </Button>
                                    )}
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={handleGallerySelected}
                                    />
                                </div>
                                {images.length === 0 ? (
                                    <p className="text-sm text-text_2">
                                        Chưa có ảnh nào trong thư viện
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {images.map(url => (
                                            <div
                                                key={url}
                                                className="relative"
                                            >
                                                <img
                                                    src={resolveAssetUrl(url)}
                                                    alt=""
                                                    className="h-24 w-full rounded-lg object-cover"
                                                />
                                                {canManage && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="absolute right-1 top-1 !text-red-500"
                                                        loading={
                                                            deletingImageUrl ===
                                                            url
                                                        }
                                                        onClick={() =>
                                                            handleDeleteImage(
                                                                url,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsFormPage;
