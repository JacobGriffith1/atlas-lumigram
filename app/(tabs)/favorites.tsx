import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { favoritesFeed } from '@/placeholder';

type FeedItemData = (typeof favoritesFeed)[number];

function FeedItem({ item }: { item: FeedItemData }) {
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
          if (success) Alert.alert('Double tap', 'Placeholder: favorite this image');
        })
        .runOnJS(true),
    []
  );

  const combined = useMemo(() => Gesture.Simultaneous(doubleTap, longPress), [doubleTap, longPress]);

  return (
    <View style={styles.card}>
      <GestureDetector gesture={combined}>
        <View>
          <Image source={{ uri: item.image }} style={styles.image} />

          {showCaption ? (
            <View style={styles.captionOverlay}>
              <Text style={styles.captionText}>{item.caption}</Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
}

export default function FavoritesScreen() {
  return (
    <View style={styles.screen}>
      <FlatList
        data={favoritesFeed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <FeedItem item={item} />}
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
});
