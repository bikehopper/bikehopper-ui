export default function downloadImageData(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');

    img.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("can't create 2D draw context"));
        return;
      }
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      try {
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
        resolve(ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight));
      } catch (err) {
        reject(err);
      }
    });

    img.addEventListener('error', (evt) => {
      URL.revokeObjectURL(url);
      reject(evt);
    });

    img.src = url;
  });
}
