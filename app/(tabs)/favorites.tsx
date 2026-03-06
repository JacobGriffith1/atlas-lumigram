import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { useAuth } from '@/contexts/auth';
import { db } from '@/lib/firebase';

type Favorite = {
  id: string; // doc id = postId
  postId: string;
  imageUrl: string;
  caption: string;
  createdAt: Timestamp | null;
  createdBy: string;
  favoritedAt: Timestamp | null;
};

const PAGE_SIZE = 8;

function FavoriteItem({ item }: { item: Favorite }) {
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

  return (
    <View style={styles.card}>
      <GestureDetector gesture={longPress}>
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

function toFavorite(docSnap: QueryDocumentSnapshot<DocumentData>): Favorite {
  const data = docSnap.data() as Record<string, unknown>;
  return {
    id: docSnap.id,
    postId: String(data.postId ?? docSnap.id),
    imageUrl: String(data.imageUrl ?? ''),
    caption: String(data.caption ?? ''),
    createdAt: (data.createdAt as Timestamp) ?? null,
    createdBy: String(data.createdBy ?? ''),
    favoritedAt: (data.favoritedAt as Timestamp) ?? null,
  };
}

export default function FavoritesScreen() {
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  const [items, setItems] = useState<Favorite[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFirstPage, setLoadingFirstPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchFirstPage = useCallback(async () => {
    if (!userId) return;

    const base = collection(db, 'users', userId, 'favorites');
    const q = query(base, orderBy('favoritedAt', 'desc'), limit(PAGE_SIZE));
    const snap = await getDocs(q);

    setItems(snap.docs.map(toFavorite));
    setCursor(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, [userId]);

  const fetchNextPage = useCallback(async () => {
    if (!userId || !cursor || !hasMore) return;

    const base = collection(db, 'users', userId, 'favorites');
    const q = query(base, orderBy('favoritedAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
    const snap = await getDocs(q);

    setItems((prev) => [...prev, ...snap.docs.map(toFavorite)]);
    setCursor(snap.docs.length ? snap.docs[snap.docs.length - 1] : cursor);
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, [cursor, hasMore, userId]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;

    setRefreshing(true);
    try {
      setCursor(null);
      setHasMore(true);
      await fetchFirstPage();
    } finally {
      setRefreshing(false);
    }
  }, [fetchFirstPage, userId]);

  const onEndReached = useCallback(async () => {
    if (loadingFirstPage || refreshing || loadingMore) return;
    if (!hasMore || !cursor) return;

    setLoadingMore(true);
    try {
      await fetchNextPage();
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, fetchNextPage, hasMore, loadingFirstPage, loadingMore, refreshing]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setLoadingFirstPage(false);
      return;
    }

    setLoadingFirstPage(true);
    void (async () => {
      try {
        await fetchFirstPage();
      } finally {
        setLoadingFirstPage(false);
      }
    })();
  }, [fetchFirstPage, userId]);

  if (!userId) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.emptyText}>Please log in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FavoriteItem item={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loadingFirstPage ? (
            <Text style={styles.emptyText}>Loading…</Text>
          ) : (
            <Text style={styles.emptyText}>No favorites yet.</Text>
          )
        }
        ListFooterComponent={loadingMore ? <Text style={styles.footerText}>Loading more…</Text> : <View />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center' },
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
