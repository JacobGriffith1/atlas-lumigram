import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddPostScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const canSubmit = useMemo(() => Boolean(imageUri) && caption.trim().length > 0, [imageUri, caption]);

  async function pickImageFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert('Permission needed', 'Please allow photo library access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri ?? null);
    }
  }

  function addPost() {
    // Placeholder behavior for Part 1
    Alert.alert('Post added', 'Placeholder: this will upload in Part 2 (Firebase).');
    setImageUri(null);
    setCaption('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Post</Text>

      <Button title="Select Image" onPress={pickImageFromLibrary} />

      <View style={styles.previewBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.previewPlaceholder}>No image selected</Text>
        )}
      </View>

      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Write a caption..."
        style={styles.input}
      />

      <Button title="Add Post" onPress={addPost} disabled={!canSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },

  previewBox: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  previewPlaceholder: { opacity: 0.6 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
