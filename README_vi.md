# Hòa Bình Admin — Trang quản trị Tổ dân phố Hòa Bình

Ứng dụng web quản trị (SPA) dành cho cán bộ Tổ dân phố Hòa Bình, dùng để quản lý hộ khẩu, nhân khẩu, phản ánh của cư dân, PCCC, an ninh trật tự, họp tổ, thông báo, khảo sát, tài chính và báo cáo tổng hợp. Xây dựng bằng **React + TypeScript + Vite**, giao tiếp với [Hòa Bình Backend App](../quan-ly-to-dan-pho-hoa-binh-backend-app) qua REST API, xác thực bằng JWT và phân quyền chi tiết theo từng module (RBAC).

## Mục lục

- [Tổng quan tính năng](#tổng-quan-tính-năng)
- [Kiến trúc & công nghệ](#kiến-trúc--công-nghệ)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Chạy dự án](#chạy-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Alias đường dẫn](#alias-đường-dẫn)
- [Xác thực & phân quyền](#xác-thực--phân-quyền)
- [Giao tiếp với API](#giao-tiếp-với-api)
- [Ví dụ sử dụng](#ví-dụ-sử-dụng)
- [Quy ước code style](#quy-ước-code-style)

## Tổng quan tính năng

Sidebar hiển thị các module theo quyền hạn (`permission`) mà tài khoản đăng nhập sở hữu (xem [src/constants/modules.ts](src/constants/modules.ts)):

| Module | Đường dẫn | Quyền yêu cầu |
| --- | --- | --- |
| Bảng điều khiển | `/` | `dashboard.read` |
| Nhà số | `/houses` | `houses.read` |
| Loại hình kinh doanh | `/business-types` | `business_types.read` |
| Phản ánh | `/complaints` | `complaints.read` |
| PCCC | `/pccc` | `pccc.read` |
| An ninh, tạm trú | `/security` | `security.read` |
| Cuộc họp | `/meetings` | `meetings.read` |
| Thông báo | `/announcements` | `announcements.read` |
| Khảo sát | `/surveys` | `surveys.read` |
| Biểu mẫu & tệp tin | `/files` | `files.read` |
| Tài chính | `/finance` | `finance.read` |
| Báo cáo | `/reports` | `reports.read` |
| Người dùng & vai trò | `/users` | `users.read` |
| Vai trò & phân quyền | `/roles` | `roles.read` |
| Cài đặt | `/settings` | `settings.read` |

Mỗi module danh sách đều hỗ trợ tìm kiếm, phân trang, và (tuỳ module) tạo/sửa/xoá, xem chi tiết hộ khẩu/nhà, gán xử lý phản ánh, xem kết quả khảo sát, xuất báo cáo...

## Kiến trúc & công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Framework | React 18 + TypeScript, dựng bằng Vite 5 |
| Routing | React Router v6 (lazy-load từng trang bằng `React.lazy`) |
| State quản lý phiên đăng nhập | Zustand (`useAuthStore`), token lưu trong `localStorage` |
| UI component | Radix UI primitives (`@radix-ui/*`) kết hợp Tailwind CSS, theo mô hình shadcn/ui (`components.json`) |
| Style | Tailwind CSS + `tailwindcss-animate`, tiện ích gộp class qua `clsx` + `tailwind-merge` (hàm `cn` trong `@lib/utils`) |
| Icon | lucide-react |
| Thông báo (toast) | sonner |
| Ngày tháng | date-fns |
| Gọi API | `fetch` thuần, bọc trong helper `request()` tại [src/service/request.ts](src/service/request.ts) |
| Lint/Format | ESLint (airbnb config) + Prettier |

## Yêu cầu hệ thống

- Node.js 18+ (khuyến nghị 20+)
- npm
- Một instance của [Hòa Bình Backend App](../quan-ly-to-dan-pho-hoa-binh-backend-app) đang chạy (mặc định tại `http://localhost:4000`) để cung cấp dữ liệu

## Cài đặt

```bash
git clone <repo-url>
cd quan-ly-to-dan-pho-hoa-binh-admin
npm install
```

## Cấu hình biến môi trường

Sao chép file mẫu và điền giá trị phù hợp:

```bash
cp .env.example .env.development
```

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `VITE_BASE_URL` | ✅ | Base URL của backend API, ví dụ `http://localhost:4000` (dev) hoặc domain thật khi deploy production |

Vite tự động nạp file `.env.development` khi chạy `npm run dev` và `.env.production` khi build production (xem [Vite env modes](https://vitejs.dev/guide/env-and-mode.html)).

## Chạy dự án

```bash
# Chế độ phát triển (cổng 5173, xem vite.config.ts)
npm run dev

# Kiểm tra kiểu dữ liệu + build production vào thư mục dist/
npm run build

# Xem thử bản build production
npm run preview

# Lint toàn bộ src/
npm run lint

# Kiểm tra format (không sửa)
npm run check-format

# Format lại code (Prettier --write)
npm run format
```

Sau khi chạy `npm run dev`, mở `http://localhost:5173`, đăng nhập bằng tài khoản cán bộ (số điện thoại + mật khẩu) đã được seed/tạo phía backend.

## Cấu trúc thư mục

```
src/
  components/
    admin/        Component nghiệp vụ dùng chung (Pagination, StatCard, HousePicker, ...)
    auth/          Guard định tuyến: RequireAuth, RequireRole, RequirePermission, AdminGuard
    layout/        Khung giao diện chính (sidebar + header) — AdminLayout
    ui/            Component UI nền tảng theo shadcn/ui (button, dialog, table, select, ...)
  constants/       Hằng số: modules.ts (menu sidebar), domain.ts (nhãn enum), common.ts (route API)
  lib/             Tiện ích dùng chung (hàm cn() gộp class Tailwind)
  pages/           Mỗi module nghiệp vụ một thư mục con (List/Form/Detail page)
  service/         Một file *Api.ts cho mỗi nhóm API, dùng chung helper request()
  store/           Zustand store (authStore.ts — token, user, trạng thái bootstrap)
  types/           Định nghĩa TypeScript dùng chung (User, Role, ApiResponse, ...)
  App.tsx          Khai báo route, bọc AdminGuard cho khu vực cần đăng nhập
  main.tsx         Điểm khởi chạy ứng dụng
```

## Alias đường dẫn

Cấu hình tại [vite.config.ts](vite.config.ts) và [tsconfig.json](tsconfig.json):

| Alias | Trỏ tới |
| --- | --- |
| `@components/*` | `src/components/*` |
| `@constants/*` | `src/constants/*` |
| `@pages/*` | `src/pages/*` |
| `@service/*` | `src/service/*` |
| `@store/*` | `src/store/*` |
| `@lib/*` | `src/lib/*` |
| `@dts` / `@dts/*` | `src/types` |

## Xác thực & phân quyền

- Đăng nhập bằng số điện thoại + mật khẩu (`POST /api/auth/login`, xem [src/service/authApi.ts](src/service/authApi.ts)), backend trả về JWT. Token được lưu vào `localStorage` (khoá `hb_admin_token`) thông qua `useAuthStore`.
- Khi ứng dụng khởi động, nếu đã có token, `App.tsx` gọi `fetchMe()` để lấy lại thông tin người dùng (`GET /api/auth/me`); nếu thất bại (token hết hạn/không hợp lệ) sẽ tự đăng xuất.
- Mọi route trong khu vực quản trị được bọc bởi `AdminGuard` ([src/components/auth/AdminGuard.tsx](src/components/auth/AdminGuard.tsx)):
  - `RequireAuth`: chuyển hướng về `/login` nếu chưa đăng nhập.
  - `RequirePermission`: kiểm tra `user.permissions` có chứa quyền yêu cầu (dạng `module.action`, ví dụ `citizens.create`) hay không; nếu không có sẽ hiển thị `AccessDenied`.
  - `RequireRole`: cách kiểm tra theo vai trò cũ, giữ lại để tương thích ngược.
- Sidebar (`AdminLayout`) chỉ hiển thị các mục trong `MODULES` mà `user.permissions` chứa quyền tương ứng — ẩn hoàn toàn các module người dùng không có quyền truy cập, không chỉ chặn route.
- Muốn bảo vệ một trang mới theo quyền, bọc route đó bằng `<RequirePermission permissions={["module.action"]}>` hoặc thêm điều kiện tương tự như các route hiện có trong `App.tsx`.

## Giao tiếp với API

Toàn bộ request đi qua helper `request()` tại [src/service/request.ts](src/service/request.ts):

- Tự động gắn header `Authorization: Bearer <token>` khi `useAuth` (mặc định `true`).
- Với `GET`, các tham số object được chuyển thành query string (bỏ qua giá trị `undefined`/`null`/rỗng).
- Với các method khác, body được serialize JSON.
- Response backend luôn có dạng `{ success, data, message }` hoặc `{ success: false, error, message }` (`ApiResponse<T>`, xem `src/types/index.ts`); nếu `success: false` sẽ ném `RequestError`, và nếu status `401` sẽ tự động đăng xuất.

Danh sách endpoint được khai báo tập trung tại [src/constants/common.ts](src/constants/common.ts) (`API.*`), mỗi nhóm nghiệp vụ có một file `service/<name>Api.ts` riêng gọi vào các endpoint tương ứng.

## Ví dụ sử dụng

### Đăng nhập

```
Số điện thoại: 0912345678
Mật khẩu:      HoaBinh@2026   (mật khẩu seed mặc định phía backend — chỉ dùng cho dev/demo)
```

Sau khi đăng nhập thành công, ứng dụng điều hướng về trang trước đó (nếu bị chặn bởi `RequireAuth`) hoặc về `/`.

### Thêm một service API mới

```ts
// src/service/exampleApi.ts
import { API } from "@constants/common";
import { request } from "./request";
import { Example } from "@dts";

export const fetchExamples = (params: { page: number; limit: number }) =>
    request<{ items: Example[]; total: number }>("GET", API.EXAMPLES, params);

export const createExample = (payload: Partial<Example>) =>
    request<Example>("POST", API.EXAMPLES, payload);
```

### Thêm một trang mới có kiểm tra quyền

```tsx
// src/App.tsx
const ExampleListPage = React.lazy(() => import("@pages/Example/ExampleListPage"));

// Trong <Route element={<AdminGuard permissions={["dashboard.read"]}><AdminLayout /></AdminGuard>}>
<Route path="/examples" element={<ExampleListPage />} />
```

```ts
// src/constants/modules.ts — thêm vào mảng MODULES để hiện trên sidebar
{
    key: "examples",
    label: "Ví dụ",
    path: "/examples",
    icon: FileText,
    permission: "examples.read",
},
```

### Kiểm tra quyền trong component

```tsx
import { usePermission } from "@store/authStore";

const canCreate = usePermission("citizens.create");

{canCreate && <Button onClick={openCreateDialog}>Thêm nhân khẩu</Button>}
```

## Quy ước code style

- ESLint dựa trên `eslint-config-airbnb` + `eslint-config-prettier`, chạy bằng `npm run lint`.
- Prettier với cấu hình tại [.prettierrc.js](.prettierrc.js); chạy `npm run format` để tự động format, `npm run check-format` để chỉ kiểm tra.
- `npm run build` chạy `tsc --noEmit` trước khi build Vite — lỗi kiểu dữ liệu sẽ chặn build.
