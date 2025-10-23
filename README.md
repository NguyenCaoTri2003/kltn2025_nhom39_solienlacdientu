
# IUHEdu - Ứng dụng sổ liên lạc điện tử

## 🚀 Bắt đầu

### Yêu cầu

- Node.js (phiên bản 18.x trở lên)
- pnpm (hoặc npm/yarn)
- Expo Go (phiên bản ~54.0.9)

### Cài đặt

1.  **Clone a repo:**

    ```bash
    git clone https://github.com/NguyenCaoTri2003/KLTNIUHEDU.git
    cd KLTNIUHEDU
    ```

2.  **Cài đặt các dependency:**

    ```bash
    pnpm install
    ```

3.  **Chạy chương trình:**

* Chạy web (http://localhost:3001) và api (http://localhost:3000):

    ```bash
    pnpm dev:web-api
    ```
* Chạy mobile

    ```bash
    pnpm dev:mobile
    ```

    hoặc 

    ```bash
    cd apps/mobile/
    ```

    ```bash
    npx expo start -c
    ```

### Setup .env.local

* Thêm vào api

```
NEXT_PUBLIC_SUPABASE_URL=https://ceocmvtxpdqgmremuqgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlb2NtdnR4cGRxZ21yZW11cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzc4NDYsImV4cCI6MjA3MDY1Mzg0Nn0._TewLybeTBvwJRFHTLldjiR5HJhvVZnLsZ3UTiAaeds
PORT=3000
JWT_SECRET=1ibdbWjLV3dRBHyvxYisAWrXJWPU2hKvb5idPkCUpwFknR6JPXwz2xRfU8DQomrmYMAsAvlEuqZXX2jfStC9gwy==
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nguyencaotri26092003@gmail.com
SMTP_PASS=
FROM_EMAIL="Hệ thống Sổ Liên Lạc IUH"
```

* Thêm vào mobile
.env

```
EXPO_PUBLIC_PORT=192.168.1.10
EXPO_PUBLIC_API_URL="http://192.168.1.5:3000"
EXPO_PUBLIC_SUPABASE_URL=https://ceocmvtxpdqgmremuqgb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlb2NtdnR4cGRxZ21yZW11cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzc4NDYsImV4cCI6MjA3MDY1Mzg0Nn0._TewLybeTBvwJRFHTLldjiR5HJhvVZnLsZ3UTiAaeds

```

vào cmd gõ ipconfig lấy link ở đây
  IPv4 Address. . . . . . . . . . . : 192.168.1.10

* Thêm vào web

```
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://ceocmvtxpdqgmremuqgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlb2NtdnR4cGRxZ21yZW11cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzc4NDYsImV4cCI6MjA3MDY1Mzg0Nn0._TewLybeTBvwJRFHTLldjiR5HJhvVZnLsZ3UTiAaeds
```

_Tài liệu này sẽ được cập nhật liên tục để phản ánh những thay đổi mới nhất của dự án._