import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';

const ScanReceiptScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [showWebError, setShowWebError] = useState(false);
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';
  const router = useRouter();

  // Check if user is on web and show error
  useEffect(() => {
    if (Platform.OS === 'web') {
      setShowWebError(true);
    }
  }, []);

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      setShowWebError(true);
      return;
    }

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

  const handleWebErrorClose = () => {
    setShowWebError(false);
    router.back(); // Navigate back when user closes the error modal
  };

  return (
    <SafeAreaView className="flex-1 h-full">
    <View className="flex-1 items-center justify-center bg-white dark:bg-black px-4">
      {Platform.OS !== 'web' && (
        <>
          {image ? (
            <Image source={{ uri: image }} className="w-64 h-64 rounded-xl mb-6" />
          ) : (
            <Text className="text-gray-800 dark:text-gray-200 mb-6 text-lg text-center">
              Scan Your Receipt Now.
              {'\n\n'}📄 OCR only supports expense transactions
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
        </>
      )}
    </View>

    {/* Error Modal for Web */}
    <ErrorModal
      visible={showWebError}
      message="📱 OCR feature is not supported on web platform.

Please use the mobile app to scan receipts and add expense transactions automatically."
      onClose={handleWebErrorClose}
    />

    <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default ScanReceiptScreen;