import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { useAuth } from '@/contexts/auth';
import { db } from '@/lib/firebase';

type Post = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: Timestamp | null;
  createdBy: string;
};

const PAGE_SIZE = 8;

async function addFavorite(params: { userId: string; post: Post }): Promise<void> {
  const { userId, post } = params;
  const favoriteRef = doc(db, 'users', userId, 'favorites', post.id);

  await setDoc(
    favoriteRef,
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

function FeedItem({ item, userId }: { item: Post; userId: string | null }) {
  const [showCaption, setShowCaption] = useState(false);

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(350)
        .onStart(() => setShowCaption(true))
        .onFinalize(() => setShowCaption(false))
        .runOnJS(true),
    []
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(250)
        .onEnd((_evt, success) => {
          if (!success) return;

          if (!userId) {
            Alert.alert('Not logged in', 'Please log in again.');
            return;
          }

          void addFavorite({ userId, post: item });
        })
        .runOnJS(true),
    [item, userId]
  );

  const combined = useMemo(() => Gesture.Simultaneous(doubleTap, longPress), [doubleTap, longPress]);

  return (
    <View style={styles.card}>
      <GestureDetector gesture={combined}>
        <View>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />

          {showCaption ? (
            <View style={styles.captionOverlay}>
              <Text style={styles.captionText}>
                {item.caption?.trim() ? item.caption : 'Placeholder caption'}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFirstPage, setLoadingFirstPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // FlashList can call onEndReached during initial layout; we “remember” it.
  const endReachedWhileLoadingRef = useRef(false);

  // Cursor refs avoid timing issues between state updates and callbacks.
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchPage = useCallback(async (opts: { reset: boolean }) => {
    const base = collection(db, 'posts');

    // Stable ordering: createdAt desc + document id desc (tie-breaker)
    const order = [orderBy('createdAt', 'desc'), orderBy('__name__', 'desc')] as const;

    const q =
      opts.reset || !cursorRef.current
        ? query(base, ...order, limit(PAGE_SIZE))
        : query(base, ...order, startAfter(cursorRef.current), limit(PAGE_SIZE));

    const snap = await getDocs(q);

    const nextItems: Post[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        imageUrl: String(data.imageUrl ?? ''),
        caption: String(data.caption ?? ''),
        createdAt: (data.createdAt as Timestamp) ?? null,
        createdBy: String(data.createdBy ?? ''),
      };
    });

    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

    if (opts.reset) setPosts(nextItems);
    else setPosts((prev) => [...prev, ...nextItems]);

    cursorRef.current = nextCursor;
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, []);

  const loadFirstPage = useCallback(async () => {
    setLoadingFirstPage(true);
    try {
      cursorRef.current = null;
      setHasMore(true);
      await fetchPage({ reset: true });
    } finally {
      setLoadingFirstPage(false);
    }
  }, [fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      cursorRef.current = null;
      setHasMore(true);
      await fetchPage({ reset: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingFirstPage || refreshing || loadingMore) return;
    if (!hasMore || !cursorRef.current) return;

    setLoadingMore(true);
    try {
      await fetchPage({ reset: false });
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingFirstPage, loadingMore, refreshing]);

  const handleEndReached = useCallback(() => {
    if (loadingFirstPage) {
      endReachedWhileLoadingRef.current = true;
      return;
    }
    void loadMore();
  }, [loadMore, loadingFirstPage]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  // If FlashList hit end during initial load, fetch again once the first page is ready.
  useEffect(() => {
    if (!loadingFirstPage && endReachedWhileLoadingRef.current) {
      endReachedWhileLoadingRef.current = false;
      void loadMore();
    }
  }, [loadingFirstPage, loadMore]);

  return (
    <View style={styles.screen}>
      <FlashList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedItem item={item} userId={user?.uid ?? null} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loadingFirstPage ? (
            <Text style={styles.emptyText}>Loading…</Text>
          ) : (
            <Text style={styles.emptyText}>No posts yet.</Text>
          )
        }
        ListFooterComponent={loadingMore ? <Text style={styles.footerText}>Loading more…</Text> : <View />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingVertical: 12 },

  card: { paddingHorizontal: 12, paddingVertical: 10 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12 },

  captionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  captionText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  emptyText: { textAlign: 'center', marginTop: 24, opacity: 0.7 },
  footerText: { textAlign: 'center', paddingVertical: 16, opacity: 0.7 },
});
