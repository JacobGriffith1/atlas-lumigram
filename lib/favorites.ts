import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export type FavoritePostInput = {
  id: string; // postId
  imageUrl: string;
  caption: string;
  createdAt: Timestamp | null;
  createdBy: string;
};

/**
 * Calling repeatedly leaves the post favorited.
 */
export async function addFavorite(userId: string, post: FavoritePostInput): Promise<void> {
  const ref = doc(db, 'users', userId, 'favorites', post.id);

  await setDoc(
    ref,
    {
      postId: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      createdAt: post.createdAt ?? null,
      createdBy: post.createdBy,
      favoritedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
