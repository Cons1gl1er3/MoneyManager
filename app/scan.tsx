import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';
import { getCurrentUser } from '../lib/appwrite';

// Constants
const OCR_ENDPOINT = 'https://655d-2405-4802-1bf0-e410-cccc-bd1d-5a1c-30c2.ngrok-free.app/process-receipt';
const WEBHOOK_URL = 'https://n8n-production-b59a.up.railway.app/webhook/1d7f79fc-3bd7-46eb-8d02-c13be6cba965';

const ScanReceiptScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [showWebError, setShowWebError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';
  const router = useRouter();

  // Fetch user ID when component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.$id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();
  }, []);

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

  const uploadImage = async () => {
    if (Platform.OS === 'web') {
      setShowWebError(true);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      console.log('📸 Selected image URI:', result.assets[0].uri);
    }
  };

  const processImage = async () => {
    if (!image || !userId) return;

    setIsProcessing(true);
    try {
      // Convert image to JPG if it's JPEG
      let processedImageUri = image;
      if (image.toLowerCase().endsWith('.jpeg')) {
        const fileInfo = await FileSystem.getInfoAsync(image);
        if (fileInfo.exists) {
          const newUri = image.replace('.jpeg', '.jpg');
          await FileSystem.moveAsync({
            from: image,
            to: newUri
          });
          processedImageUri = newUri;
        }
      }

      // First, send image to OCR server
      const formData = new FormData();
      
      // Get file extension from URI
      const fileExtension = processedImageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = 'image/jpg';
      
      const imageData = {
        uri: processedImageUri,
        type: mimeType,
        name: `receipt.${fileExtension}`,
      } as any;
      formData.append('file', imageData);

      console.log('📸 Preparing image for OCR:', {
        uri: processedImageUri,
        type: imageData.type,
        name: imageData.name,
        fileExtension,
        formData: formData
      });

      const ocrResponse = await fetch(OCR_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📸 OCR Response:', ocrResponse);

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error('OCR Server Error:', {
          status: ocrResponse.status,
          statusText: ocrResponse.statusText,
          headers: Object.fromEntries(ocrResponse.headers.entries()),
          body: errorText
        });
        throw new Error(`Failed to process image with OCR: ${ocrResponse.status} ${ocrResponse.statusText}`);
      }

      const ocrResult = await ocrResponse.json();
      console.log('📝 OCR Result:', ocrResult);

      // Validate OCR response structure
      if (!ocrResult.status || ocrResult.status !== 'success') {
        throw new Error('Invalid OCR response format');
      }

      // Then, send the OCR result to the webhook
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'exp://192.168.1.3:8081',
        },
        body: JSON.stringify({
          ocrResult,
          timestamp: new Date().toISOString(),
          userId,
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook Error:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          headers: Object.fromEntries(webhookResponse.headers.entries()),
          body: errorText
        });
        throw new Error(`Failed to process OCR result: ${webhookResponse.status} ${webhookResponse.statusText}`);
      }

      const webhookData = await webhookResponse.json();
      console.log('📝 Webhook Response:', JSON.stringify(webhookData, null, 2));
      
      // Navigate to confirmation page with webhook response data
      router.push({
        pathname: '/receipt-log-confirmation',
        params: { 
          ocrData: JSON.stringify(webhookData)
        }
      });
    } catch (error) {
      console.error('Error processing image:', error);
      alert(`Failed to process image: ${(error as Error).message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWebErrorClose = () => {
    setShowWebError(false);
    router.back();
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

            <View className="flex-row gap-4 mb-4">
              <TouchableOpacity
                onPress={openCamera}
                className="bg-blue-600 px-6 py-3 rounded-xl shadow-md flex-1"
                disabled={isProcessing}
              >
                <Text className="text-white font-semibold text-base text-center">
                  {image ? 'Retake Photo' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={uploadImage}
                className="bg-blue-600 px-6 py-3 rounded-xl shadow-md flex-1"
                disabled={isProcessing}
              >
                <Text className="text-white font-semibold text-base text-center">
                  Upload Image
                </Text>
              </TouchableOpacity>
            </View>

            {image && (
              <TouchableOpacity
                onPress={processImage}
                className="bg-green-600 px-6 py-3 rounded-xl shadow-md w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base text-center">Process Receipt</Text>
                )}
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
