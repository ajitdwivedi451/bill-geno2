/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',       // Static HTML/CSS/JS एक्सपोर्ट के लिए
  trailingSlash: true,    // 🟢 एंड्रॉइड WebView में रूटिंग एरर से बचने के लिए सबसे ज़रूरी लाइन
  images: {
    unoptimized: true,    // इमेज कंवर्जन को ऑफलाइन ऐप के अनुकूल बनाने के लिए
  },
};

export default nextConfig;
