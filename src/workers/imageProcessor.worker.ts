// // Ye code alag thread par chalega bina UI ko freez kiye
// self.onmessage = (e: MessageEvent<{ imageData: ImageData; type: 'logo' | 'watermark' }>) => {
//   const { imageData, type } = e.data;
//   const data = imageData.data;

//   // Loop through all pixels (RGBA)
//   for (let i = 0; i < data.length; i += 4) {
//     // Agar pixel almost white hai (RGB > 230)
//     if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
//       data[i + 3] = 0; // Alpha (Transparency) ko 0 kar do
//     }
//   }

//   // Wapas main thread ko processed data bhej do
//   self.postMessage({ processedData: imageData, type });
// };

// src/workers/imageProcessor.worker.ts

self.onmessage = (e: MessageEvent) => {
  const { imageData, type } = e.data;
  const data = imageData.data;

  // Algorithm: White/Light background removal (Alpha transparency)
  // Ye signatures aur simple logos ko transparent banane ke liye best hai
  if (type === 'signature' || type === 'logo') {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Agar pixel almost white hai (R, G, B > 220), toh usko transparent (Alpha = 0) kar do
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0; 
      } else if (r > 180 && g > 180 && b > 180) {
        // Semi-transparent for smooth edges (Anti-aliasing handling)
        data[i + 3] = 150;
      }
    }
  }

  // Processed image data wapas main thread ko bhej do
  self.postMessage({ processedData: imageData, type });
};