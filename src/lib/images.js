import { supabase } from "./supabase";

const BUCKET = "post-images";
export const MAX_RAW_BYTES = 15 * 1024 * 1024; // refuse anything over 15MB before we even shrink it

// shrink an image in the browser: longest side max 1600px, saved as WebP
export async function compressImage(file, max = 1600) {
  const bitmap = await createImageBitmap(file);                          // decode the picture
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height)); // never enlarge, only shrink
  const canvas = document.createElement("canvas");                       // invisible drawing board
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); // draw it smaller
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image"))),
      "image/webp", // small and sharp (older Safari silently falls back to PNG, which is fine)
      0.85          // quality: 85% looks identical for charts
    )
  );
}

// upload into post-images/{userId}/{timestamp}.webp and return the public link
export async function uploadPostImage(userId, blob) {
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;                          // your folder + unique name
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; // https://...supabase.co/.../post-images/...
}

// delete an uploaded image using its public link (used when a post is deleted)
export async function removePostImage(url) {
  if (!url) return;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;                                                  // not one of ours
  await supabase.storage.from(BUCKET).remove([url.slice(i + marker.length)]); // "userId/123.webp"
}