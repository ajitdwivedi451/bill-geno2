// Ye code alag thread par chalega bina UI ko freez kiye
self.onmessage = (e: MessageEvent<{ imageData: ImageData; type: 'logo' | 'watermark' }>) => {
  const { imageData, type } = e.data;
  const data = imageData.data;

  // Loop through all pixels (RGBA)
  for (let i = 0; i < data.length; i += 4) {
    // Agar pixel almost white hai (RGB > 230)
    if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
      data[i + 3] = 0; // Alpha (Transparency) ko 0 kar do
    }
  }

  // Wapas main thread ko processed data bhej do
  self.postMessage({ processedData: imageData, type });
};