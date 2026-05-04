# Nền tảng Thương mại Điện tử Mộc-EcoPure

Mộc-EcoPure là một nền tảng thương mại điện tử hiện đại, toàn diện được xây dựng bằng **MERN stack (MongoDB, Express.js, React, Node.js)** và tích hợp **Trí tuệ Nhân tạo (AI) bằng Python** để phân tích da chuyên sâu. Dự án này được thiết kế nhằm mang lại trải nghiệm mua sắm liền mạch cho các sản phẩm chăm sóc da tự nhiên và thân thiện với môi trường, được cá nhân hóa cho từng khách hàng thông qua các đề xuất từ AI.

## 🚀 Các Tính Năng Nổi Bật

### 1. Hệ Thống Phân Tích Da & Đề Xuất Bằng AI
- **Phân Tích Khuôn Mặt:** Tích hợp mô hình học máy (Machine Learning) bằng Python (sử dụng các thư viện như OpenCV, TensorFlow/Keras) để phân tích hình ảnh khuôn mặt do người dùng tải lên.
- **Phát Hiện & Chấm Điểm Mụn:** Nhận diện mụn chính xác và đưa ra điểm số/phần trăm về tình trạng sức khỏe của da.
- **Đề Xuất Sản Phẩm Động (Dynamic Recommendations):** Tự động gợi ý lộ trình chăm sóc da cá nhân hóa và các sản phẩm cụ thể dựa trên kết quả phân tích AI riêng biệt của từng người dùng (ví dụ: các chiến lược Đề xuất 1 hãng, Hỗn hợp, hoặc Luân phiên).

### 2. Chức Năng Thương Mại Điện Tử Hoàn Chỉnh
- **Quản Lý Sản Phẩm:** Xử lý toàn bộ vòng đời sản phẩm bao gồm danh mục, kho hàng và giá cả động.
- **Điều Hướng Chuyên Sâu:** Tích hợp Mega Menu 3 cấp độ giúp người dùng dễ dàng tìm kiếm và khám phá sản phẩm.
- **Giỏ Hàng & Thanh Toán:** Quản lý giỏ hàng mượt mà, thân thiện trên mọi thiết bị và quy trình thanh toán (checkout) tối ưu.
- **Theo Dõi Đơn Hàng:** Người dùng có thể xem lịch sử mua hàng và trạng thái đơn hàng hiện tại.

### 3. Trang Quản Trị (Admin Dashboard)
- **Kiểm Soát Tập Trung:** Một ứng dụng React dành riêng cho quản trị viên (`client-admin`) để quản lý cửa hàng.
- **Quản Lý Dữ Liệu:** Giao diện trực quan để thêm, sửa, xóa sản phẩm và danh mục.
- **Xử Lý Đơn Hàng:** Công cụ để quản lý các đơn đặt hàng của khách và cập nhật trạng thái giao hàng.

## 🛠️ Công Nghệ Sử Dụng

**Frontend (Giao diện người dùng):**
- **React.js:** Dùng để xây dựng cả giao diện dành cho khách hàng (`client-customer`) và trang quản trị (`client-admin`).
- **React Router:** Điều hướng trang mượt mà theo kiến trúc SPA (Single-page application).
- **Context API:** Quản lý state (trạng thái) hiệu quả giữa các component.
- **CSS3 / HTML5:** Thiết kế giao diện hiện đại, đẹp mắt và Responsive (tương thích mọi kích thước màn hình).

**Backend (Hệ thống máy chủ):**
- **Node.js & Express.js:** Kiến trúc API RESTful mạnh mẽ phục vụ cho cả hai ứng dụng frontend.
- **Python:** Giao tiếp liên tiến trình (IPC) để chạy mô hình AI phân tích da song song với server Node.js.

**Cơ Sở Dữ Liệu:**
- **MongoDB:** Cơ sở dữ liệu NoSQL linh hoạt, mở rộng tốt, dùng để lưu trữ sản phẩm, người dùng, đơn hàng và lịch sử phân tích da.

**Học Máy (Machine Learning - AI):**
- **Python Data Science Stack:** Sử dụng `train_model.py` và Jupyter notebooks (`acne_detection.ipynb`) để huấn luyện mô hình nhận diện mụn.

## 💡 Điểm Sáng Cho CV / Portfolio

Dự án này thể hiện năng lực và kỹ năng của bạn trong:
- **Full-Stack Development:** Kết nối thành công kiến trúc backend phức tạp với giao diện frontend tương tác tốt.
- **System Integration (Tích hợp hệ thống):** Kết nối web server Node.js với script Machine Learning Python để mang lại tính năng AI phân tích ảnh thực tế.
- **Problem Solving (Giải quyết vấn đề):** Xử lý các thách thức khó như lỗi OOM (Hết bộ nhớ) trên server khi chạy AI, giao tiếp giữa các tiến trình (IPC), và quản lý hiệu năng.
- **UI/UX Design:** Tạo ra một giao diện người dùng bóng bẩy, thu hút, đáp ứng tiêu chuẩn của một thương hiệu thương mại điện tử hiện đại.

---
*Dự án được xây dựng và phát triển như một đồ án/portfolio chuyên nghiệp.*
