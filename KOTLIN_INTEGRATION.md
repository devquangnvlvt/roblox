# Hướng dẫn kết nối App Kotlin với Roblox Outfit Viewer

Dự án web này hoạt động như một **3D Viewer** nhúng vào WebView. App Kotlin xử lý toàn bộ UI chọn quần áo, sau đó gửi ảnh sang web để hiển thị lên nhân vật 3D.

---

## 1. Chuẩn bị: Đưa web vào Assets

Copy toàn bộ thư mục dự án vào `app/src/main/assets/`:

```
app/src/main/assets/
  └── codex/
       ├── index.html
       └── public/
            ├── js/app.js
            ├── js/lib/          ← Three.js (offline, không cần mạng)
            ├── css/style.css
            ├── image/
            └── models/r15.glb
```

---

## 2. Thiết lập WebView trong Kotlin

```kotlin
val webView: WebView = findViewById(R.id.webView)

webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    allowFileAccess = true
    allowFileAccessFromFileURLs = true
    allowUniversalAccessFromFileURLs = true
}

// Load từ assets (không cần mạng)
webView.loadUrl("file:///android_asset/codex/index.html")
```

---

## 3. Gửi ảnh từ App sang 3D Viewer

### Hàm tiện ích: Bitmap → Base64 → WebView

```kotlin
fun sendImageToWeb(bitmap: Bitmap, type: String) {
    val outputStream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
    val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)

    val method = if (type == "shirt") "setShirtFromBase64" else "setPantsFromBase64"
    runOnUiThread {
        webView.evaluateJavascript("window.$method('$base64')", null)
    }
}
```

> ⚠️ Chỉ gọi sau khi trang đã load xong (`webViewClient.onPageFinished`)

### Gọi từ drawable (ảnh trong res/)

```kotlin
val bitmap = BitmapFactory.decodeResource(resources, R.drawable.ten_ao)
sendImageToWeb(bitmap, "shirt")   // hoặc "pants"
```

---

## 4. Các lệnh điều khiển (JavaScript Bridge)

| Kotlin gọi | Tác dụng |
|---|---|
| `window.setShirtFromBase64('...')` | Mặc áo từ chuỗi Base64 |
| `window.setPantsFromBase64('...')` | Mặc quần từ chuỗi Base64 |
| `window.clearShirt()` | Xóa áo |
| `window.clearPants()` | Xóa quần |

---

## 5. Lưu ý kỹ thuật

- **Định dạng ảnh**: PNG (giữ độ trong suốt).
- **Kích thước chuẩn Roblox**: 585 × 559 px.
- **Android WebView**: Cần phiên bản 89+ (Android 9 trở lên) để hỗ trợ `importmap`.
- **Thời điểm gọi**: Chỉ gọi `evaluateJavascript` sau khi `onPageFinished` được kích hoạt.
