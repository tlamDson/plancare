# Voyager Backend

## Security & Development Rules

### 🛡️ Pre-commit Security Scan

> [!IMPORTANT]
> **RULE: ZERO TRUST SCANNING**
> Trước khi thực hiện bất kỳ lệnh `git commit` nào, developer **BẮT BUỘC** phải:
>
> 1. Kiểm tra các file nhạy cảm (API Keys, Secrets) không vô tình bị thêm vào staging.
> 2. Chạy quét tính bảo mật (nếu có công cụ CI/CD cục bộ).
> 3. **XÁC MINH THỦ CÔNG**: Nếu phát hiện bất kỳ đoạn code nào có rủi ro (ví dụ: raw SQL, unsanitized AI output, exposed envs), phải xác minh và fix trước khi commit.

### 🧩 Architectural Guidelines

- **Rule of 200**: Không file nào vượt quá 200 dòng code. Nếu quá, phải refactor tách module.
- **Fail Fast**: Không sử dụng giá trị mặc định cho các biến môi trường quan trọng (ví dụ: `GEMINI_API_KEY`). Server phải crash ngay khi khởi động nếu thiếu cấu hình.
- **Sanitization**: Mọi dữ liệu từ AI hoặc User phải được sanitize trước khi lưu vào Database.
