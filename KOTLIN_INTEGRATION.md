# Hướng dẫn kết nối App Kotlin với Roblox Outfit Viewer

Tài liệu này hướng dẫn cách kết nối ứng dụng Android (Kotlin) với dự án Web này để hiển thị quần áo lên nhân vật 3D.

## 1. Cổng kết nối phía Web (JavaScript Bridge)

Bạn đã có sẵn các hàm sau trong file `public/js/app.js`:

- `window.setShirtFromBase64(base64)`: Đổi áo bằng chuỗi Base64.
- `window.setPantsFromBase64(base64)`: Đổi quần bằng chuỗi Base64.
- `window.clearShirt()`: Xóa áo.
- `window.clearPants()`: Xóa quần.

## 2. Cấu hình phía App Kotlin (Android Studio)

### Bước 1: Thiết lập WebView

```kotlin
val webView: WebView = findViewById(R.id.webView)
webView.settings.apply {
    javaScriptEnabled = true // Bắt buộc
    domStorageEnabled = true
}
webView.loadUrl("URL_TRANG_WEB_CUA_BAN")
```

### Bước 2: Gửi ảnh (Chuyển Bitmap sang Base64)

Sử dụng hàm này để gửi ảnh lên Web:

```kotlin
fun sendImageToWeb(bitmap: Bitmap, type: String) {
    // 1. Chuyển Bitmap thành chuỗi Base64
    val outputStream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
    val base64String = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

    // 2. Gọi hàm JS trên Web (chạy trên UI Thread)
    val method = if (type == "shirt") "setShirtFromBase64" else "setPantsFromBase64"
    runOnUiThread {
        webView.evaluateJavascript("window.$method('$base64String')", null)
    }
}
```

### Bước 3: Trường hợp chọn ảnh có sẵn trong App

Nếu ảnh nằm trong thư mục `res/drawable` của app:

```kotlin
fun sendResourceImage(resourceId: Int, type: String) {
    val bitmap = BitmapFactory.decodeResource(resources, resourceId)
    sendImageToWeb(bitmap, type)
}

// Cách dùng: khi nhấn vào nút chọn áo mẫu 1
// sendResourceImage(R.drawable.mau_ao_01, "shirt")
```

## 3. Lưu ý kỹ thuật

- **Ảnh PNG**: Luôn dùng định dạng PNG để giữ độ trong suốt.
- **Kích thước**: Chuẩn Roblox là 585x559 px.
- **Thời điểm gọi**: Chỉ gọi `evaluateJavascript` sau khi trang web đã tải xong (`onPageFinished`).
