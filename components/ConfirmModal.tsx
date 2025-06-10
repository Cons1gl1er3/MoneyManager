import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonColor?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title = "Confirm",
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmButtonColor = "#dc2626", // red color for destructive actions
}) => {
  const styles = StyleSheet.create({
    modalContent: {
      backgroundColor: 'white',
      borderRadius: Platform.OS === 'ios' ? 16 : 24,
      padding: Platform.OS === 'ios' ? 20 : 24,
      width: Platform.OS === 'ios' ? 280 : 320,
      maxWidth: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: Platform.OS === 'ios' ? 4 : 8,
      },
      shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
      shadowRadius: Platform.OS === 'ios' ? 8 : 12,
      elevation: Platform.OS === 'android' ? 15 : 0,
    },
    title: {
      fontSize: Platform.OS === 'ios' ? 18 : 20,
      fontWeight: 'bold',
      color: '#1f2937',
      textAlign: 'center',
      marginBottom: Platform.OS === 'ios' ? 8 : 12,
    },
    message: {
      fontSize: Platform.OS === 'ios' ? 14 : 16,
      color: '#6b7280',
      textAlign: 'center',
      lineHeight: Platform.OS === 'ios' ? 20 : 24,
      marginBottom: Platform.OS === 'ios' ? 20 : 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: Platform.OS === 'ios' ? 8 : 12,
    },
    button: {
      flex: 1,
      paddingVertical: Platform.OS === 'ios' ? 12 : 14,
      paddingHorizontal: Platform.OS === 'ios' ? 16 : 20,
      borderRadius: Platform.OS === 'ios' ? 8 : 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: Platform.OS === 'ios' ? 44 : 48,
    },
    cancelButton: {
      backgroundColor: Platform.OS === 'ios' ? '#f3f4f6' : '#e5e7eb',
    },
    cancelButtonText: {
      color: Platform.OS === 'ios' ? '#4b5563' : '#374151',
      fontSize: Platform.OS === 'ios' ? 13 : 15,
      fontWeight: Platform.OS === 'ios' ? '600' : '500',
      textAlign: 'center',
      lineHeight: Platform.OS === 'ios' ? 16 : 20,
    },
    confirmButtonText: {
      color: 'white',
      fontSize: Platform.OS === 'ios' ? 13 : 15,
      fontWeight: Platform.OS === 'ios' ? '600' : '500',
      textAlign: 'center',
      lineHeight: Platform.OS === 'ios' ? 16 : 20,
    },
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <TouchableOpacity 
        activeOpacity={1}
        style={{ flex: 1 }} 
        onPress={onCancel}
      >
        <BlurView intensity={30} style={{ flex: 1 }}>
          {/* Dark overlay for better focus */}
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.4)', 
            zIndex: 100,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}>
        
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>
            {title}
          </Text>
          
          <Text style={styles.message}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
              activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
            >
              <Text style={styles.cancelButtonText}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: confirmButtonColor }]}
              activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
            >
              <Text style={styles.confirmButtonText}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

export default ConfirmModal; 