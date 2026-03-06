import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { useAuth } from '@/contexts/auth';
import { db } from '@/lib/firebase';

type FavoriteDoc = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: Timestamp | null;
  createdBy: string;
  favoritedAt: Timestamp | null;
};

const PAGE_SIZE = 8;

function FavoriteItem({ item }: { item: FavoriteDoc }) {
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

export default function FavoritesScreen() {
  const { user } = useAuth();

  const [items, setItems] = useState<FavoriteDoc[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFirstPage, setLoadingFirstPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);

  const fetchPage = useCallback(
    async (opts: { reset: boolean }) => {
      if (!user) return;

      const base = collection(db, 'users', user.uid, 'favorites');

      const q =
        opts.reset || !cursor
          ? query(base, orderBy('favoritedAt', 'desc'), limit(PAGE_SIZE))
          : query(base, orderBy('favoritedAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE));

      const snap = await getDocs(q);

      const nextItems: FavoriteDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          imageUrl: String(data.imageUrl ?? ''),
          caption: String(data.caption ?? ''),
          createdAt: (data.createdAt as Timestamp) ?? null,
          createdBy: String(data.createdBy ?? ''),
          favoritedAt: (data.favoritedAt as Timestamp) ?? null,
        };
      });

      const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
      const nextHasMore = snap.docs.length === PAGE_SIZE;

      if (opts.reset) setItems(nextItems);
      else setItems((prev) => [...prev, ...nextItems]);

      setCursor(nextCursor);
      setHasMore(nextHasMore);
    },
    [cursor, user]
  );

  const loadFirstPage = useCallback(async () => {
    setLoadingFirstPage(true);
    try {
      setCursor(null);
      setHasMore(true);
      await fetchPage({ reset: true });
    } finally {
      setLoadingFirstPage(false);
    }
  }, [fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setCursor(null);
      setHasMore(true);
      await fetchPage({ reset: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingFirstPage || refreshing || loadingMore) return;
    if (!hasMore || !cursor) return;

    setLoadingMore(true);
    try {
      await fetchPage({ reset: false });
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, fetchPage, hasMore, loadingFirstPage, loadingMore, refreshing]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      Alert.alert('Not logged in', 'Please log in again.');
      return;
    }
    void loadFirstPage();
  }, [loadFirstPage, user]);

  return (
    <View style={styles.screen}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FavoriteItem item={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
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
