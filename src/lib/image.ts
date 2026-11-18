/** Downscale a camera photo on the device before storing it (and, later, before uploading to R2). */
export async function resizePhoto(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not process photo'))), 'image/jpeg', quality));
}

const urlCache = new WeakMap<Blob, string>();
export function blobUrl(b: Blob) {
  let u = urlCache.get(b);
  if (!u) {
    u = URL.createObjectURL(b);
    urlCache.set(b, u);
  }
  return u;
}
