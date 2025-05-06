import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const ScanReceiptScreen = () => {
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      console.log('📸 Captured image URI:', result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black px-4">
      {image ? (
        <Image source={{ uri: image }} className="w-64 h-64 rounded-xl mb-6" />
      ) : (
        <Text className="text-gray-800 dark:text-gray-200 mb-6 text-lg text-center">
          Scan Your Receipt Now.
        </Text>
      )}

      <TouchableOpacity
        onPress={openCamera}
        className="bg-blue-600 px-6 py-3 rounded-xl shadow-md"
      >
        <Text className="text-white font-semibold text-base">Open Camera</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ScanReceiptScreen;