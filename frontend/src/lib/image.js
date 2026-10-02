import { saveBlob } from "./api.js";

// Shrinks photos in the browser before upload: faster on slow mobile data, same result.

const toBlob = (canvas, quality) => new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));

/** Draws a source (ImageBitmap, video or image) onto a canvas no larger than `max` px. */
export function drawScaled(source, w, h, max) {
  const s = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** File -> JPEG Blob, long side at most `max` px. Keeps the original if it cannot be decoded here. */
export async function shrinkFile(file, max = 1280) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const blob = await toBlob(drawScaled(bmp, bmp.width, bmp.height, max), 0.9);
    bmp.close();
    return blob;
  } catch {
    return file;
  }
}

/** Current video frame -> JPEG Blob. */
export const grabFrame = (video, max, quality = 0.8) =>
  toBlob(drawScaled(video, video.videoWidth, video.videoHeight, max), quality);

/** Save a photo to the phone: share sheet when possible ("Save image"), else a download. */
export async function savePhoto(blob) {
  const file = new File([blob], `dragon-fruit-${Date.now()}.jpg`, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  saveBlob(file, file.name);
}
