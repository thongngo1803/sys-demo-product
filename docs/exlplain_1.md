Dưới đây là bài thuyết trình cho **Person C — Data & Trust**, tập trung vào 2 package: `@sys/consent` và `@sys/warp`.

---

## **Bài thuyết trình: Person C — Data & Trust**

Xin chào mọi người, hôm nay mình sẽ trình bày phần **Person C — Data & Trust**.

Vai trò của Person C tập trung vào hai vấn đề rất quan trọng trong hệ thống: **quản trị dữ liệu** và **niềm tin của người dùng**. Cụ thể, mình sẽ phụ trách hai package chính là:

- `@sys/consent`: hệ thống quản lý consent cho cookie và script.
- `@sys/warp`: công cụ kiểm tra và xác thực cấu hình dữ liệu.

Mục tiêu chung của phần này là đảm bảo rằng hệ thống không chỉ chạy được, mà còn chạy một cách **an toàn, minh bạch và có kiểm soát**.

---

## **Week 1 — `@sys/consent`: Cookie và Script Consent Engine**

Ở tuần đầu tiên, mình sẽ xây dựng package `@sys/consent`.

Đây là một engine dùng để quyết định:

> “Công nghệ này có được phép chạy trong hoàn cảnh hiện tại hay không?”

Ví dụ, một website có thể có nhiều loại script như:

- Script cần thiết cho hệ thống.
- Script phân tích hành vi người dùng.
- Script marketing.
- Cookie phục vụ đăng nhập hoặc bảo mật.

Tuy nhiên, không phải script nào cũng được phép chạy ngay lập tức. Một số công nghệ cần sự đồng ý của người dùng trước khi được kích hoạt.

Vì vậy, `@sys/consent` sẽ hoạt động như một engine thuần túy, trả về hai kết quả chính:

- `ALLOW`: được phép chạy.
- `DENY`: không được phép chạy.

Nguyên tắc mặc định của engine là **necessary-only**, tức là nếu chưa có consent rõ ràng từ người dùng, hệ thống chỉ cho phép những công nghệ thật sự cần thiết.

Một điểm quan trọng nữa là **policy version**. Nếu chính sách consent thay đổi, ví dụ từ version 1 sang version 2, thì consent cũ sẽ bị xem là không còn hợp lệ. Khi đó, hệ thống phải yêu cầu người dùng xác nhận lại.

Điều này giúp đảm bảo rằng người dùng luôn được thông báo khi chính sách dữ liệu thay đổi.

---

## **Phần Teach của Week 1: Vercel**

Trong tuần này, phần công nghệ được học và áp dụng là **Vercel**.

Mình sẽ dùng Vercel để:

- Deploy một web surface cho consent banner.
- Hiển thị demo ALLOW và DENY.
- Kiểm tra runtime logs sau khi deploy.

Vercel giúp mình nhanh chóng đưa giao diện consent lên môi trường thật, từ đó có thể kiểm tra hành vi của engine trong thực tế.

---

## **Artifact của Week 1**

Kết quả cuối cùng của tuần 1 là một consent banner hoặc consent surface đã được deploy.

Demo này cần thể hiện được ba hành vi chính:

1. Khi chưa có consent, hệ thống mặc định chỉ cho phép necessary technology.
2. Khi người dùng đồng ý, một số công nghệ được chuyển từ `DENY` sang `ALLOW`.
3. Khi policy version được bump lên, hệ thống bắt người dùng xác nhận lại consent.

Qua artifact này, ta chứng minh rằng `@sys/consent` không chỉ là logic nội bộ, mà có thể áp dụng vào một web surface thật.

---

## **Week 2 — `@sys/warp`: Config Cross-Validation**

Sang tuần thứ hai, mình sẽ xây dựng package `@sys/warp`.

Nếu `@sys/consent` tập trung vào niềm tin của người dùng, thì `@sys/warp` tập trung vào niềm tin trong cấu hình và dữ liệu của hệ thống.

Mục tiêu của `@sys/warp` là kiểm tra xem schema và config có hợp lệ hay không trước khi hệ thống vận hành.

Package này sẽ đóng vai trò như một **check runner**, chạy nhiều loại kiểm tra khác nhau, ví dụ:

- Kiểm tra referential integrity.
- Kiểm tra các mapping bắt buộc.
- Scan SQL để phát hiện banned-token.
- Đảm bảo schema không bị hard-code theo một domain quá cụ thể.

Nói cách khác, `@sys/warp` giúp phát hiện lỗi cấu hình sớm, trước khi lỗi đó trở thành bug trong production.

---

## **Phần Teach của Week 2: Supabase**

Trong tuần 2, công nghệ được học là **Supabase**.

Mình sẽ sử dụng Supabase để làm việc với:

- Postgres database.
- Schema.
- Validation trên dữ liệu thật.

Supabase phù hợp vì nó cung cấp một môi trường Postgres dễ triển khai, dễ quan sát và dễ kiểm thử.

Thông qua Supabase, mình có thể tạo một schema mẫu, sau đó chạy `@sys/warp` để kiểm tra xem schema đó có vấn đề gì không.

---

## **Artifact của Week 2**

Artifact của tuần 2 là một lần chạy `warp` trên Supabase schema.

Trong demo, mình sẽ cố tình “plant” một lỗi, ví dụ:

- Một quan hệ bị sai hoặc thiếu.
- Một mapping bắt buộc chưa được khai báo.
- Một naming issue.
- Một token bị cấm xuất hiện trong SQL.

Sau đó, `@sys/warp` sẽ phát hiện lỗi này và báo ra kết quả.

Điểm quan trọng là artifact không chỉ chứng minh rằng tool chạy được, mà còn chứng minh rằng tool thật sự bắt được lỗi có ý nghĩa.

---

## **Tóm tắt vai trò Person C**

Tóm lại, Person C phụ trách mảng **Data & Trust**, gồm hai package chính:

| Person | Focus | Package 1 | Package 2 |
|---|---|---|---|
| C | Data & Trust | `consent` | `warp` |

Trong đó:

- `@sys/consent` bảo vệ quyền lựa chọn của người dùng.
- `@sys/warp` bảo vệ tính đúng đắn của dữ liệu và cấu hình.
- Vercel được dùng để deploy consent surface.
- Supabase được dùng để kiểm tra schema và validation.

Hai package này cùng hướng tới một mục tiêu chung: xây dựng một hệ thống đáng tin cậy hơn, minh bạch hơn và an toàn hơn trước khi đưa vào vận hành thực tế.

Cảm ơn mọi người đã lắng nghe.