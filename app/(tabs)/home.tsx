import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { homeFeed } from '@/placeholder';

type FeedItemData = (typeof homeFeed)[number];

function FeedItem({ item }: { item: FeedItemData }) {
  const [showCaption, setShowCaption] = useState(false);

  // Long press: show caption while pressing, hide when released.
  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(350)
        .onStart(() => setShowCaption(true))
        .onFinalize(() => setShowCaption(false))
        .runOnJS(true),
    []
  );

  // Double tap: show alert (next project = favorite).
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

  // Make both gestures work on the same image.
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

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <FlatList
        data={homeFeed}
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
