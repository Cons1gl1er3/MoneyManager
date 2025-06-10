import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  transactionDetails?: {
    name: string;
    amount: number;
    type: 'Income' | 'Expense';
  };
  accountDetails?: {
    name: string;
    balance: number;
    balanceType?: 'Balance' | 'Initial Balance';
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title = 'Success!',
  message,
  transactionDetails,
  accountDetails,
}) => {
  const styles = StyleSheet.create({
    modalContent: {
      backgroundColor: 'white',
      padding: Platform.OS === 'ios' ? 20 : 24,
      borderRadius: Platform.OS === 'ios' ? 16 : 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: Platform.OS === 'ios' ? 4 : 8,
      },
      shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
      shadowRadius: Platform.OS === 'ios' ? 8 : 12,
      elevation: Platform.OS === 'android' ? 8 : 0,
      minWidth: Platform.OS === 'web' ? 400 : Platform.OS === 'ios' ? 280 : 300,
      maxWidth: '90%',
      zIndex: 2,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: Platform.OS === 'ios' ? 12 : 16,
    },
    icon: {
      marginBottom: Platform.OS === 'ios' ? 8 : 12,
    },
    title: {
      fontSize: Platform.OS === 'ios' ? 20 : 24,
      fontWeight: 'bold',
      color: '#1f2937',
      textAlign: 'center',
    },
    message: {
      color: '#6b7280',
      textAlign: 'center',
      fontSize: Platform.OS === 'ios' ? 15 : 16,
      lineHeight: Platform.OS === 'ios' ? 20 : 24,
      marginBottom: (transactionDetails || accountDetails) ? 8 : (Platform.OS === 'ios' ? 20 : 24),
    },
    detailsContainer: {
      marginBottom: Platform.OS === 'ios' ? 20 : 24,
    },
    detailsBox: {
      backgroundColor: '#f9fafb',
      padding: Platform.OS === 'ios' ? 14 : 16,
      borderRadius: Platform.OS === 'ios' ? 10 : 12,
    },
    detailsName: {
      fontWeight: '600',
      color: '#1f2937',
      fontSize: Platform.OS === 'ios' ? 15 : 16,
    },
    detailsAmount: {
      fontSize: Platform.OS === 'ios' ? 16 : 18,
      fontWeight: 'bold',
      marginTop: 4,
    },
    detailsType: {
      fontSize: Platform.OS === 'ios' ? 13 : 14,
      color: '#6b7280',
    },
    continueButton: {
      backgroundColor: '#2563eb',
      paddingVertical: Platform.OS === 'ios' ? 14 : 16,
      paddingHorizontal: Platform.OS === 'ios' ? 20 : 24,
      borderRadius: Platform.OS === 'ios' ? 10 : 12,
      minHeight: Platform.OS === 'ios' ? 44 : 48,
      justifyContent: 'center',
    },
    continueButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: Platform.OS === 'ios' ? 16 : 16,
    },
  });

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'fade'}
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <TouchableOpacity 
        style={{ flex: 1 }}
        activeOpacity={1} 
        onPress={onClose}
      >
        <BlurView 
          intensity={50} 
          tint={Platform.OS === 'ios' ? 'systemMaterialDark' : 'dark'}
          style={{ flex: 1 }}
        >
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
          <View style={styles.iconContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={Platform.OS === 'ios' ? 56 : 60} 
              color="#22c55e" 
              style={styles.icon}
            />
            <Text style={styles.title}>
              {title}
            </Text>
          </View>
          
          <Text style={styles.message}>
            {message}
          </Text>

          {transactionDetails && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailsBox}>
                <Text style={styles.detailsName}>
                  {transactionDetails.name}
                </Text>
                <Text style={[
                  styles.detailsAmount,
                  { color: transactionDetails.type === 'Income' ? '#16a34a' : '#dc2626' }
                ]}>
                  {transactionDetails.type === 'Income' ? '+' : '-'}
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                    .format(transactionDetails.amount).replace('₫', 'VNĐ')}
                </Text>
                <Text style={styles.detailsType}>
                  {transactionDetails.type}
                </Text>
              </View>
            </View>
          )}
          
          {accountDetails && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailsBox}>
                <Text style={styles.detailsName}>
                  {accountDetails.name}
                </Text>
                <Text style={[styles.detailsAmount, { color: '#16a34a' }]}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                    .format(accountDetails.balance).replace('₫', 'VNĐ')}
                </Text>
                <Text style={styles.detailsType}>
                  {accountDetails.balanceType === 'Balance' ? 'Balance' : 'Initial Balance'}
                </Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity
            onPress={onClose}
            style={styles.continueButton}
            activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
          >
            <Text style={styles.continueButtonText}>
              Continue
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

export default SuccessModal; 