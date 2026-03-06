import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from '@/lib/firebase';

function inferContentType(uri: string): { ext: string; contentType: string } {
  const match = uri.toLowerCase().match(/\.([a-z0-9]+)(\?|#|$)/);
  const ext = match?.[1] ?? 'jpg';

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return { ext: 'jpg', contentType: 'image/jpeg' };
    case 'png':
      return { ext: 'png', contentType: 'image/png' };
    case 'webp':
      return { ext: 'webp', contentType: 'image/webp' };
    case 'heic':
      return { ext: 'heic', contentType: 'image/heic' };
    default:
      return { ext: 'jpg', contentType: 'image/jpeg' };
  }
}


function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onerror = () => reject(new Error(`Failed to read image data from URI: ${uri}`));
    xhr.onload = () => resolve(xhr.response as Blob);

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

function makeFilename(ext: string): string {
  const rand = Math.random().toString(16).slice(2);
  return `${Date.now()}-${rand}.${ext}`;
}


export async function createPost(params: {
  imageUri: string;
  caption: string;
  userId: string;
}): Promise<{ postId: string; imageUrl: string }> {
  const { imageUri, caption, userId } = params;

  // 1) Convert local device URI -> Blob
  const { ext, contentType } = inferContentType(imageUri);
  const blob = await uriToBlob(imageUri);

  try {
    // 2) Upload to storage
    const filename = makeFilename(ext);
    const storagePath = `posts/${userId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, { contentType });

    // 3) Get public URL
    const imageUrl = await getDownloadURL(storageRef);

    // 4) Create Firestore document
    const docRef = await addDoc(collection(db, 'posts'), {
      imageUrl,
      caption: caption.trim(),
      createdAt: serverTimestamp(),
      createdBy: userId,
    });

    return { postId: docRef.id, imageUrl };
  } finally {
    // Some RN Blob implementations support close() to release memory.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (blob as any)?.close?.();
  }
}
