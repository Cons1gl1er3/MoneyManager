import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScanReceiptScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';
  const router = useRouter();

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

  const handleConfirm = () => {
    if (image) {
      router.push('/receipt-log-confirmation');
    }
  };

  return (
    <SafeAreaView className="flex-1 h-full">
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
        className="bg-blue-600 px-6 py-3 rounded-xl shadow-md mb-4"
      >
        <Text className="text-white font-semibold text-base">
          {image ? 'Retake Photo' : 'Open Camera'}
        </Text>
      </TouchableOpacity>

      {image && (
        <TouchableOpacity
          onPress={handleConfirm}
          className="bg-green-600 px-6 py-3 rounded-xl shadow-md"
        >
          <Text className="text-white font-semibold text-base">Confirm</Text>
        </TouchableOpacity>
      )}
    </View>
    <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default ScanReceiptScreen;