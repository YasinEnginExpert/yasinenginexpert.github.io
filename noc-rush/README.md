# NOC Rush - Kurulum ve Çalıştırma Rehberi

Bu proje **React** ve **Vite** kullanılarak geliştirilmiştir. Çalıştırmak için bilgisayarınızda **Node.js** yüklü olmalıdır.

## 1. Node.js Kurulumu (Eğer Yüklü Değilse)

Eğer terminalde `node -v` yazdığınızda hata alıyorsanız, Node.js yüklü değildir.

1.  [Node.js Resmi Sitesine Gidin (nodejs.org)](https://nodejs.org/)
2.  **LTS (Long Term Support)** sürümünü indirin (Önerilen).
3.  İndirilen dosyayı çalıştırın ve kurulumu tamamlayın.
    *   **Önemli:** Kurulum sırasında "Add to PATH" seçeneğinin işaretli olduğundan emin olun (varsayılan olarak işaretlidir).
4.  Kurulum bittikten sonra **açık olan tüm terminalleri kapatıp yeniden açın**.

## 2. Projeyi Hazırlama

Terminali açın ve proje klasörüne gidin:

```powershell
cd noc-rush
```

Gerekli paketleri/kütüphaneleri yüklemek için şu komutu çalıştırın:

```powershell
npm install
```

*(Bu işlem internet hızınıza bağlı olarak birkaç dakika sürebilir. `node_modules` klasörü oluşturulacaktır.)*

## 3. Uygulamayı Başlatma

Kurulum tamamlandıktan sonra uygulamayı çalıştırmak için:

```powershell
npm run dev
```

Terminalde size bir link verilecektir (örneğin: `http://localhost:5173`). Bu linke **Ctrl + Tık** yaparak tarayıcıda açabilirsiniz.

## Sorun Giderme

-   Eğer `npm` komutu bulunamadı hatası alırsanız, Node.js kurulumundan sonra bilgisayarınızı veya terminali yeniden başlatmanız gerekebilir.
-   Eğer port hatası alırsanız, `npm run dev -- --port 3000` gibi farklı bir port deneyebilirsiniz.
