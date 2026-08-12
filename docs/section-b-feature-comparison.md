# Đối soát Section B — Đối tượng Tổ dân phố

**Nguồn yêu cầu:** `refered-documents/Tổ dân phố.xlsx`, sheet **Tổng quan tính năng**, Section B (B01–B14).  
**Phạm vi kiểm tra:** `neighborhood-management` (Zalo mini app), `neighborhood-management-backend-app`, và `neighborhood-management-admin-web-app`.  
**Ngày kiểm tra:** 2026-08-09.

## Quy ước đánh giá

| Trạng thái | Tiêu chí |
| --- | --- |
| Available | Người dùng Tổ có thể hoàn thành toàn bộ luồng nêu trong Section B: giao diện phù hợp, API/dữ liệu, phân quyền và đầu ra/liên thông cần thiết. |
| Partially available | Có phần nền tảng hoặc một số bước của luồng, nhưng thiếu ít nhất một bước nghiệp vụ, màn hình Tổ, phạm vi dữ liệu, hay liên thông lên/xuống. |
| Unavailable | Không có model/API/UI có thể thực hiện luồng này. |

> “Có API” hoặc “cán bộ phường thao tác được trên web admin” không tự động được tính là Available cho Tổ dân phố.

## Kết quả theo phân hệ

| Mã | Phân hệ của Section B | Trạng thái | Đánh giá end-to-end |
| --- | --- | --- | --- |
| B01 | Trang chủ – Dashboard Tổ | **Partially available** | Mini app có trang chủ, thông báo mới, badge họp và các tiện ích theo quyền. Chưa có dashboard riêng của Tổ với nhiệm vụ, hạn xử lý, phản ánh, rà soát và báo cáo đến hạn. |
| B02 | Quản lý địa bàn Tổ | **Partially available** | Có bản ghi Tổ, mã, trạng thái, liên hệ và gán Tổ trưởng; có danh mục đường và danh sách nhà. Chưa có Tổ phó, ranh giới/bản đồ, ngõ/hẻm, hoặc nhật ký địa bàn; Tổ cũng không có trang tự quản lý thông tin của mình. |
| B03 | Quản lý Nhà số trong Tổ | **Partially available** | Có danh sách/chi tiết Nhà số theo phạm vi quyền, dữ liệu địa chỉ, trạng thái và lịch sử audit; mini app có mục quản trị Nhà số cho người được cấp quyền. Thiếu các luồng đề nghị tạo/chỉnh sửa/điều chuyển dành riêng cho Tổ, màn hình xác minh theo danh sách, và lịch sử tương tác hợp nhất. |
| B04 | Nhận và triển khai nhiệm vụ | **Partially available** | `Request` có người nhận, hạn và tệp đính kèm; admin web có tạo/gửi/yêu cầu và backend có endpoint “my requests”. Chưa có giao diện Tổ để xác nhận nhận việc, phân công nội bộ, giao xuống Nhà số, nhắc việc, nộp tổng hợp hoặc bổ sung theo yêu cầu. |
| B05 | Phản ánh – kiến nghị | **Partially available** | Mini app có hộp thư phản ánh cho nhân viên/Tổ theo phạm vi; backend có phân công, trạng thái, tệp và timeline; admin web có danh sách/chi tiết. Thiếu quy trình Tổ xác minh hiện trường có ảnh/ghi chú chuẩn, kiến nghị của Tổ, chuyển Phường theo hành động rõ ràng, và gửi kết quả trở lại Nhà số. |
| B06 | Thông báo | **Partially available** | Có tạo/publish thông báo, tệp đính kèm, đối tượng nhận theo Tổ/nhà/người dùng, giao nhận thông báo và đánh dấu đã đọc trong mini app. Chưa có workspace Tổ để chuyển tiếp/chọn Nhà số và theo dõi xác nhận/đọc theo thông báo; “đã nhận” và “đã đọc” chưa là hai bước nghiệp vụ riêng ở UI Tổ. |
| B07 | Rà soát – chiến dịch | **Unavailable** | Không có model, API, màn hình hoặc luồng giao đợt rà soát, biểu mẫu, minh chứng, nhắc thực hiện và tổng hợp/gửi Phường. |
| B08 | Khảo sát – lấy ý kiến | **Partially available** | Có tạo khảo sát, chọn phạm vi/Tổ, công bố/đóng, trả lời và xem kết quả; mini app cho người dùng tham gia. Tổ chưa có vai trò phát khảo sát xuống Nhà số, nhắc tham gia, theo dõi tỷ lệ trong Tổ, tổng hợp hoặc gửi ý kiến bổ sung lên Phường. |
| B09 | Họp dân – sinh hoạt Tổ | **Partially available** | Có tạo lịch họp, nội dung, tệp/biên bản, phân nhóm người nhận và đăng ký tham dự. Mini app chủ yếu là xem/đăng ký; chưa có luồng Tổ lập họp, điểm danh, ghi ý kiến, biểu quyết, tạo kiến nghị sau họp hoặc báo cáo Phường. |
| B10 | Yêu cầu hỗ trợ | **Partially available** | Có tạo, theo dõi, cập nhật trạng thái và phản hồi ticket hỗ trợ. Đây là luồng người dân ↔ hệ thống chung, chưa hỗ trợ Tổ kiểm tra/xác minh, yêu cầu bổ sung, đề xuất phương án, chuyển Phường và thông báo kết quả cho Nhà số. |
| B11 | Hạ tầng – sự cố địa bàn | **Unavailable** | Có module PCCC/an ninh riêng trên admin web, nhưng không có sổ hạ tầng theo Tổ (đèn, đường, cống, cây, rác...), tiếp nhận báo hỏng, ảnh hiện trường hay theo dõi khắc phục. |
| B12 | Báo cáo | **Unavailable** | Backend/admin web có các báo cáo thống kê phục vụ cán bộ và xuất dữ liệu, nhưng không có báo cáo tuần/tháng/quý/năm do Tổ lập, nộp Phường và bổ sung theo yêu cầu. |
| B13 | Xác minh dữ liệu Nhà số | **Partially available** | Có dữ liệu Nhà số, trạng thái, lịch sử audit và thao tác quản lý nhà cho tài khoản được cấp quyền. Thiếu hàng đợi xác minh dành cho Tổ, ghi nhận sai lệch/đề nghị cập nhật, xác minh lại và gửi kết quả Phường. |
| B14 | Trao đổi – nhắc việc | **Unavailable** | Không có model/API/UI cho hội thoại theo ngữ cảnh nhiệm vụ, phản ánh hoặc rà soát; ghi chú/trạng thái đơn lẻ không thay thế được thread, tệp đính kèm và biên nhận đọc. |

**Tổng hợp theo 14 phân hệ:** 0 Available, 10 Partially available, 4 Unavailable.

## Bằng chứng chính trong ba ứng dụng

| Năng lực hiện có | Mini app | Backend | Admin web | Hạn chế so với Section B |
| --- | --- | --- | --- | --- |
| Phạm vi Tổ và Nhà số | Danh sách quản trị theo quyền tại `/admin`; trang chủ hiển thị tính năng theo permission. | `Neighborhood`, `HouseRecord`, gán Tổ trưởng và API neighborhoods/houses. | Quản lý Tổ, Nhà số, đường, hộ và người dân. | Chưa là workspace tự phục vụ cho Tổ. |
| Nhiệm vụ/yêu cầu | Không có trang Request/Tổ. | `Request`, `RequestRecipient`, recipients và “my requests”. | Tạo, gửi, lịch sử yêu cầu. | Thiếu toàn bộ các bước triển khai của Tổ. |
| Phản ánh | Tạo phản ánh, xem chi tiết/timeline; hộp thư nhân viên theo phạm vi phụ trách. | `Complaint`, `ComplaintTimeline`, attachment, assign/status. | Danh sách và chi tiết phản ánh. | Thiếu quy trình xác minh/chuyển Phường và phản hồi Nhà số của Tổ. |
| Thông báo | Danh sách, chi tiết, notification và đánh dấu đã đọc. | `Announcement`, `NotificationDelivery`, người nhận theo user/Tổ và attachments. | Tạo/công bố thông báo. | Không có màn hình Tổ chuyển tiếp và theo dõi delivery. |
| Khảo sát/họp | Tham gia khảo sát; xem và RSVP họp. | `Survey`/`SurveyResponse`; `Meeting`/`MeetingRegistration`. | Tạo khảo sát, xem kết quả, tạo/quản lý họp. | Chưa có điều phối/giám sát theo Tổ. |
| Hỗ trợ | Tạo và theo dõi ticket. | `SupportTicket` và trạng thái. | Danh sách/chi tiết ticket. | Không có pipeline Tổ → Phường. |

## Những khoảng trống cần ưu tiên

1. **Tạo vai trò và workspace Tổ dân phố trong mini app.** Cần dashboard B01, phạm vi dữ liệu theo `neighborhoodId`, và điều hướng tới các việc được giao. Đây là tiền đề cho B03–B14.
2. **Hoàn chỉnh B04 — nhiệm vụ.** Bổ sung trạng thái nhận/đang làm/nộp/bổ sung, phân công nội bộ, chọn Nhà số, nộp kết quả và nhắc hạn. Đây là luồng có nền tảng backend gần nhất.
3. **Hoàn chỉnh B05/B06.** Chuẩn hóa xác minh và chuyển Phường cho phản ánh; thêm chuyển tiếp/thống kê nhận-đọc thông báo ở vai trò Tổ.
4. **Xây dựng các miền dữ liệu chưa tồn tại:** B07 rà soát/chiến dịch, B11 hạ tầng, B12 báo cáo nộp Phường, B14 trao đổi theo công việc.
5. **Mở rộng B08/B09/B10/B13 sau khi có workspace.** Tái sử dụng Survey, Meeting, SupportTicket và HouseRecord hiện có nhưng thêm hành động, quyền và dữ liệu riêng của Tổ.

## Backlog đề xuất: ưu tiên và có thể hoãn

Danh sách này chỉ gồm các hạng mục đang **Partially available** hoặc **Unavailable**. “Có thể hoãn” không có nghĩa là không hữu ích; đó là các hạng mục chưa cần để Tổ nhận việc, xử lý phản ánh, liên lạc với Nhà số và báo cáo cơ bản.

### Ưu tiên P0 — cần có để vận hành Tổ dân phố

| Hạng mục | Trạng thái hiện tại | Phạm vi tối thiểu cần hoàn thiện | Lý do ưu tiên |
| --- | --- | --- | --- |
| B01 — Workspace/Dashboard Tổ | Partially available | Trang chủ theo `neighborhoodId`: việc mới, quá hạn/sắp hạn, phản ánh mới, thông báo, liên kết đến các luồng công việc. | Là điểm vào và phạm vi dữ liệu cho toàn bộ vai trò Tổ. |
| B04 — Nhận và triển khai nhiệm vụ | Partially available | Danh sách việc của tôi/Tổ; xác nhận nhận; cập nhật tiến độ; nộp kết quả/tệp; yêu cầu bổ sung; nhắc hạn. | Kết nối việc giao từ Phường với việc triển khai của Tổ. Tận dụng `Request`/`RequestRecipient` hiện có. |
| B05 — Phản ánh và kiến nghị | Partially available | Inbox theo Tổ; tiếp nhận/xác minh; ảnh, GPS và ghi chú; chuyển Phường; trả kết quả cho Nhà số. | Đây là luồng phản hồi dân sinh có giá trị vận hành và hiển thị rõ hiệu quả của Tổ. |
| B06 — Thông báo | Partially available | Tổ tạo/chuyển tiếp thông báo đến Nhà số trong phạm vi; tệp đính kèm; danh sách đã nhận/đã đọc. | Là kênh truyền thông cơ bản; nền tảng Announcement/NotificationDelivery đã tồn tại. |
| B03 — Nhà số trong Tổ | Partially available | Tra cứu/lọc theo Tổ; xem vị trí và trạng thái; đề nghị chỉnh sửa/tạo/điều chuyển có quy trình duyệt. | Cần để chọn đúng Nhà số khi giao việc, gửi thông báo và xử lý phản ánh. |

### Ưu tiên P1 — nên làm sau P0

| Hạng mục | Trạng thái hiện tại | Phạm vi tối thiểu cần hoàn thiện | Lý do |
| --- | --- | --- | --- |
| B13 — Xác minh dữ liệu Nhà số | Partially available | Hàng đợi cần xác minh; ghi sai lệch; đề nghị cập nhật; gửi kết quả Phường. | Tăng chất lượng dữ liệu sau khi Tổ đã có workspace và danh sách Nhà số. |
| B12 — Báo cáo Tổ nộp Phường | Unavailable | Mẫu báo cáo tuần/tháng và đột xuất; lưu nháp/nộp/bổ sung; danh sách Phường tiếp nhận. | Cần cho quản trị định kỳ nhưng không chặn luồng xử lý sự việc hằng ngày. |
| B10 — Yêu cầu hỗ trợ | Partially available | Tổ kiểm tra/xác minh/chuyển Phường và trả kết quả Nhà số. | Có thể mở rộng `SupportTicket` sau khi P0 đã định hình phân quyền và trạng thái. |
| B08 — Khảo sát theo Tổ | Partially available | Phát khảo sát, tỷ lệ phản hồi theo Tổ, nhắc tham gia và tổng hợp ý kiến. | Nền tảng Survey đã có; phù hợp cho giai đoạn tăng mức độ tương tác. |
| B09 — Họp dân/sinh hoạt Tổ | Partially available | Tổ lập lịch, mời Nhà số, RSVP/điểm danh, biên bản và kiến nghị sau họp. | Nền tảng Meeting đã có, nhưng tần suất sử dụng thường thấp hơn P0. |

### Có thể hoãn (P2) — chưa cần cho bản vận hành đầu tiên

| Hạng mục | Trạng thái hiện tại | Có thể hoãn vì |
| --- | --- | --- |
| B02 — Bản đồ, ranh giới và nhật ký địa bàn | Partially available | Thông tin Tổ, Tổ trưởng và đường đã có. Ranh giới GIS, hẻm/ngõ và nhật ký địa bàn không cần để vận hành P0. |
| B07 — Rà soát/chiến dịch | Unavailable | Cần một miền dữ liệu và form engine mới; nên triển khai sau khi luồng nhiệm vụ cơ bản đã ổn định. |
| B11 — Hạ tầng/sự cố địa bàn | Unavailable | Là một phân hệ tài sản/sự cố chuyên biệt, chi phí dữ liệu và quy trình lớn; phản ánh B05 có thể là kênh tạm thời. |
| B14 — Trao đổi/nhắc việc theo thread | Unavailable | Có thể dùng ghi chú, trạng thái, tệp đính kèm và thông báo trong P0 trước; thread đầy đủ cần thiết kế riêng về lưu trữ, quyền và biên nhận đọc. |

### Thứ tự triển khai khuyến nghị

1. Phân quyền `neighborhood_leader` + B01 workspace/phạm vi Tổ.
2. B04 nhiệm vụ, B03 Nhà số và B06 thông báo.
3. B05 phản ánh/kiến nghị.
4. B13 xác minh dữ liệu và B12 báo cáo.
5. B10 hỗ trợ, B08 khảo sát và B09 họp dân.
6. B02 bản đồ, B07 chiến dịch, B11 hạ tầng và B14 trao đổi theo thread.

## Lưu ý về kết luận

Đây là đánh giá từ mã nguồn hiện có, không bao gồm tính năng chỉ có ở một hệ thống bên ngoài, dữ liệu vận hành, hoặc quyền được cấp động nhưng không thể suy ra từ mã. Các mục “Partially available” nên được xác nhận thêm bằng kịch bản test với tài khoản `neighborhood_leader` trước khi dùng làm nghiệm thu.
