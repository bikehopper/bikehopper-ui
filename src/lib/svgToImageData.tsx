export default function svgToImageData(
  svgContents: string,
  size: number,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([svgContents], { type: 'image/svg+xml' }),
    );
    const img = document.createElement('img');

    img.addEventListener('load', () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("can't create 2D draw context"));
        return;
      }
      canvas.width = size;
      canvas.height = size;
      try {
        ctx.drawImage(img, 0, 0, size, size);
        resolve(ctx.getImageData(0, 0, size, size));
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
