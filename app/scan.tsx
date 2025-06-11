import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';

const ScanReceiptScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [showWebError, setShowWebError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  // Inline theme colors instead of using the external hook
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colorScheme;
  
  // Main colors
  const background = isDark ? '#121212' : '#F9FAFB';
  const primaryText = isDark ? '#F3F4F6' : '#111827';
  const secondaryText = isDark ? '#D1D5DB' : '#4B5563'; 
  const noteText = isDark ? '#9CA3AF' : '#6B7280';
  
  // Card & UI colors
  const cardBackground = isDark ? '#1F2937' : '#EBF5FF';
  const buttonText = '#FFFFFF';
  
  // Button colors
  const primaryButtonBg = '#2563EB';
  const successButtonBg = '#10B981';
  const cancelButtonBg = isDark ? '#374151' : '#E5E7EB';

  const handleOpenCamera = async () => {
    if (Platform.OS === 'web') {
      setShowWebError(true);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setIsProcessing(true);
        setTimeout(() => {
          setImage(uri);
          setIsProcessing(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Failed to open camera. Please try again.');
    }
  };

  const handleConfirm = () => {
    if (image) {
      router.push('/receipt-log-confirmation');
    }
  };

  const handleRetakePhoto = () => {
    setImage(null);
    handleOpenCamera();
  };

  const handleCancel = () => {
    router.back();
  };

  const handleWebErrorClose = () => {
    setShowWebError(false);
    router.back();
  };

  const renderWelcomeScreen = () => (
    <View style={styles.containerContent}>
      <View style={[styles.iconContainer, { backgroundColor: cardBackground }]}>
        <Ionicons name="scan-outline" size={64} color={primaryButtonBg} />
      </View>

      <Text style={[styles.title, { color: primaryText }]}>Scan Your Receipt</Text>
      <Text style={[styles.description, { color: secondaryText }]}>
        Use your camera to scan a receipt and automatically log expense transactions.
      </Text>
      <Text style={[styles.note, { color: noteText }]}>
        Note: OCR only supports expense transactions
      </Text>

      <TouchableOpacity style={styles.cameraButton} onPress={handleOpenCamera}>
        <Ionicons name="camera" size={20} color={buttonText} style={styles.iconSpacing} />
        <Text style={[styles.buttonText, { color: buttonText }]}>Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={[styles.cancelText, { color: noteText }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderImagePreview = () => (
    <View style={styles.containerContent}>
      <Image source={{ uri: image }} style={styles.previewImage} />

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
          <Ionicons name="camera" size={20} color={buttonText} style={styles.iconSpacing} />
          <Text style={[styles.buttonText, { color: buttonText }]}>Retake Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={20} color={buttonText} style={styles.iconSpacing} />
          <Text style={[styles.buttonText, { color: buttonText }]}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.containerContent}>
      <ActivityIndicator size="large" color={primaryButtonBg} />
      <Text style={[styles.processingText, { color: secondaryText }]}>
        Processing receipt...
      </Text>
    </View>
  );

  // Định nghĩa styles sau khi đã khai báo các biến màu sắc
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    containerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    iconContainer: {
      marginBottom: 20,
      padding: 20,
      borderRadius: 50,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 12,
      lineHeight: 24,
    },
    note: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 32,
      fontStyle: 'italic',
    },
    cameraButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primaryButtonBg,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 16,
      width: '100%',
      maxWidth: 300,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '500',
    },
    iconSpacing: {
      marginRight: 8,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    previewImage: {
      width: 280,
      height: 280,
      borderRadius: 16,
      marginBottom: 32,
    },
    buttonGroup: {
      width: '100%',
      maxWidth: 300,
    },
    retakeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primaryButtonBg,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 16,
      width: '100%',
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: successButtonBg,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      width: '100%',
    },
    processingText: {
      marginTop: 16,
      fontSize: 16,
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
      {isProcessing ? renderProcessing() : image ? renderImagePreview() : renderWelcomeScreen()}

      <ErrorModal
        visible={showWebError}
        message="OCR feature is not supported on web platform. Please use the mobile app to scan receipts and add expense transactions automatically."
        onClose={handleWebErrorClose}
      />

      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default ScanReceiptScreen;
