import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    FileText,
    GalleryHorizontal,
    ImagePlus,
    Info,
    Pin,
    Tag,
    Trash2,
    Upload,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import RichTextEditor, {
    RichTextEditorHandle,
    isRichContentEmpty,
} from "@components/admin/RichTextEditor";
import { Checkbox } from "@components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/ui/card";
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

// Header dung chung cho tung khoi (Card) - dong bo bo cuc voi cac form khac
// (Soan van ban, Them khao sat): icon tron + tieu de + mo ta ngan.
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue_10 text-primary">
                {icon}
            </div>
            <div>
                <CardTitle className="text-sm">{title}</CardTitle>
                {description && (
                    <CardDescription className="mt-0.5">
                        {description}
                    </CardDescription>
                )}
            </div>
        </div>
        {action}
    </CardHeader>
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
    const [uploadingContentImage, setUploadingContentImage] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const contentImageInputRef = useRef<HTMLInputElement>(null);
    const richEditorRef = useRef<RichTextEditorHandle>(null);

    // Chua co tin tuc (chua co id) khong the goi API tai anh ngay (can id
    // that su) - anh dai dien chon o man tao moi duoc giu tam o day (kem URL
    // xem truoc cuc bo), roi tai len that su ngay sau khi createNews() thanh
    // cong trong handleSubmit. Cung mau voi pendingFiles o CorrespondenceFormPage.
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(
        null,
    );
    const [pendingCoverPreviewUrl, setPendingCoverPreviewUrl] = useState<
        string | null
    >(null);

    useEffect(() => {
        if (!pendingCoverFile) {
            setPendingCoverPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(pendingCoverFile);
        setPendingCoverPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingCoverFile]);

    // Cung mau voi anh dai dien: anh thu vien chon o man tao moi duoc giu
    // tam o day, tai len ngay sau khi createNews() thanh cong. Rieng "chen
    // anh vao noi dung" van bat buoc luu nhap truoc vi can URL that su.
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>(
        [],
    );
    const [pendingGalleryPreviewUrls, setPendingGalleryPreviewUrls] =
        useState<string[]>([]);

    useEffect(() => {
        if (pendingGalleryFiles.length === 0) {
            setPendingGalleryPreviewUrls([]);
            return undefined;
        }
        const urls = pendingGalleryFiles.map(file =>
            URL.createObjectURL(file),
        );
        setPendingGalleryPreviewUrls(urls);
        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, [pendingGalleryFiles]);

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
        if (!title.trim() || isRichContentEmpty(content)) {
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
                // Tai len ngay anh dai dien + anh thu vien da chon o man tao
                // (neu co) - chi co the goi API dinh kem SAU khi da co id
                // that su.
                if (pendingCoverFile) {
                    await uploadNewsImage(
                        news._id,
                        pendingCoverFile,
                        true,
                    ).catch(() => {
                        toast.error(
                            "Đã tạo tin tức nhưng tải ảnh đại diện thất bại - vui lòng thử lại ở bước tiếp theo",
                        );
                    });
                }
                if (pendingGalleryFiles.length > 0) {
                    const results = await Promise.allSettled(
                        pendingGalleryFiles.map(file =>
                            uploadNewsImage(news._id, file, false),
                        ),
                    );
                    const failures = results.filter(
                        r => r.status === "rejected",
                    ).length;
                    if (failures > 0) {
                        toast.error(
                            `Đã tạo tin tức nhưng ${failures} ảnh thư viện tải lên thất bại - vui lòng thử lại ở bước tiếp theo`,
                        );
                    }
                }
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
        if (!file) return;
        if (!id) {
            setPendingCoverFile(file);
            return;
        }
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
        if (!file) return;
        if (!id) {
            setPendingGalleryFiles(prev => [...prev, file]);
            return;
        }
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

    const handleRemovePendingGalleryFile = (index: number) => {
        setPendingGalleryFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleInsertContentImageClick = () => {
        if (!id) {
            toast.error("Vui lòng lưu bản nháp trước khi chèn ảnh");
            return;
        }
        contentImageInputRef.current?.click();
    };

    const handleContentImageSelected = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !id) return;
        try {
            setUploadingContentImage(true);
            const news = await uploadNewsImage(id, file, false);
            setImages(news.images || []);
            const uploadedUrl = news.images?.[news.images.length - 1];
            if (uploadedUrl) {
                richEditorRef.current?.insertImage(
                    resolveAssetUrl(uploadedUrl),
                );
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploadingContentImage(false);
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

    const coverPreview = coverImageUrl
        ? resolveAssetUrl(coverImageUrl)
        : pendingCoverPreviewUrl;

    return (
        <div>
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/news")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {isEdit ? "Sửa tin tức" : "Thêm tin tức"}
                        </h1>
                        <p className="text-sm text-text_2">
                            Soạn nội dung, chọn ảnh đại diện và đăng tới cư
                            dân.
                        </p>
                    </div>
                </div>
                {canManage && (
                    <div className="flex shrink-0 items-center gap-2">
                        {isEdit && status === "nhap" && canPublish && (
                            <Button
                                size="lg"
                                variant="outline"
                                loading={publishing}
                                onClick={handlePublish}
                            >
                                Đăng tin tức
                            </Button>
                        )}
                        <Button
                            size="lg"
                            loading={saving}
                            onClick={handleSubmit}
                        >
                            {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                        </Button>
                    </div>
                )}
            </div>

            {isEdit && loading && (
                <Card className="p-6">
                    <LoadingState />
                </Card>
            )}
            {isEdit && !loading && loadError && (
                <Card className="p-6">
                    <ErrorState onRetry={loadDetail} />
                </Card>
            )}

            {(!isEdit || (!loading && !loadError)) && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="flex flex-col gap-4 lg:col-span-2">
                        <Card>
                            <SectionHeader
                                icon={<FileText className="h-4 w-4" />}
                                title="Nội dung tin tức"
                                description="Tiêu đề và nội dung sẽ hiển thị cho cư dân."
                            />
                            <CardContent className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label>Tiêu đề</Label>
                                    <Input
                                        placeholder="Nhập tiêu đề tin tức"
                                        value={title}
                                        onChange={e =>
                                            setTitle(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Nội dung</Label>
                                    <RichTextEditor
                                        ref={richEditorRef}
                                        value={content}
                                        onChange={setContent}
                                        placeholder="Nội dung tin tức"
                                        onInsertImageClick={
                                            handleInsertContentImageClick
                                        }
                                        insertImageDisabled={
                                            uploadingContentImage
                                        }
                                        insertImageTitle={
                                            isEdit
                                                ? "Chèn ảnh vào bài viết"
                                                : "Lưu bản nháp trước khi chèn ảnh"
                                        }
                                    />
                                    <input
                                        ref={contentImageInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={handleContentImageSelected}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit">
                        <Card>
                            <SectionHeader
                                icon={<ImagePlus className="h-4 w-4" />}
                                title="Ảnh đại diện"
                                description="Hiển thị ở danh sách tin tức và bản xem trước."
                            />
                            <CardContent>
                                {coverPreview ? (
                                    <div className="relative">
                                        <img
                                            src={coverPreview}
                                            alt=""
                                            className="aspect-video w-full rounded-lg object-cover"
                                        />
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="absolute right-2 top-2 !text-red-500"
                                                loading={
                                                    deletingImageUrl ===
                                                    coverImageUrl
                                                }
                                                onClick={() =>
                                                    coverImageUrl
                                                        ? handleDeleteImage(
                                                              coverImageUrl,
                                                          )
                                                        : setPendingCoverFile(
                                                              null,
                                                          )
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    canManage && (
                                        <button
                                            type="button"
                                            onClick={handleCoverClick}
                                            className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-divider_01 text-text_2 transition-colors hover:border-primary hover:bg-ng_10"
                                        >
                                            <ImagePlus className="h-6 w-6" />
                                            <span className="text-xs">
                                                Bấm để chọn ảnh đại diện
                                            </span>
                                        </button>
                                    )
                                )}
                                {canManage && coverPreview && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 w-full"
                                        loading={uploadingCover}
                                        onClick={handleCoverClick}
                                    >
                                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                                        Thay ảnh khác
                                    </Button>
                                )}
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={handleCoverSelected}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <SectionHeader
                                icon={<Tag className="h-4 w-4" />}
                                title="Phân loại & hiển thị"
                            />
                            <CardContent className="flex flex-col gap-4">
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
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <label
                                    htmlFor="pinned"
                                    className="flex items-center gap-2 rounded-lg border border-divider_01 px-3 py-2 text-sm"
                                >
                                    <Checkbox
                                        id="pinned"
                                        checked={pinned}
                                        onCheckedChange={checked =>
                                            setPinned(checked === true)
                                        }
                                    />
                                    <Pin className="h-3.5 w-3.5 text-text_2" />
                                    Ghim lên đầu danh sách
                                </label>
                            </CardContent>
                        </Card>

                        <Card>
                            <SectionHeader
                                icon={
                                    <GalleryHorizontal className="h-4 w-4" />
                                }
                                title="Thư viện ảnh"
                                description="Ảnh phụ để chèn vào nội dung bài viết."
                                action={
                                    canManage && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={uploadingGallery}
                                            onClick={handleGalleryClick}
                                        >
                                            <Upload className="mr-1 h-3.5 w-3.5" />
                                            Tải lên
                                        </Button>
                                    )
                                }
                            />
                            <CardContent>
                                {!isEdit && (
                                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-ng_10 p-2.5 text-xs text-text_2">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            Ảnh chọn ở đây sẽ được tải lên
                                            ngay sau khi lưu bản nháp. Muốn
                                            chèn ảnh vào nội dung thì cần lưu
                                            bản nháp trước.
                                        </span>
                                    </div>
                                )}
                                {images.length === 0 &&
                                pendingGalleryFiles.length === 0 ? (
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
                                                    src={resolveAssetUrl(
                                                        url,
                                                    )}
                                                    alt=""
                                                    className="aspect-square w-full rounded-lg object-cover"
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
                                        {pendingGalleryPreviewUrls.map(
                                            (url, index) => (
                                                <div
                                                    key={url}
                                                    className="relative"
                                                >
                                                    <img
                                                        src={url}
                                                        alt=""
                                                        className="aspect-square w-full rounded-lg object-cover"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="absolute right-1 top-1 !text-red-500"
                                                        onClick={() =>
                                                            handleRemovePendingGalleryFile(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={handleGallerySelected}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsFormPage;
