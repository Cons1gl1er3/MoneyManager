import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

interface ActionItem {
  label: string;
  icon: string;
  color?: string;
  onPress: () => void;
  subtitle?: string;
}

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  balance?: number;
  transactionDetails?: {
    categoryName: string;
    amount: number;
    isIncome: boolean;
  };
  actions: ActionItem[];
}

const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  balance,
  transactionDetails,
  actions,
}) => {
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('₫', 'VNĐ');
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1} 
        onPress={onClose}
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
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: Platform.OS === 'web' ? 400 : 350,
              }}
            >
              {/* Header Card */}
              <View style={{
                backgroundColor: 'white',
                borderRadius: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
                overflow: 'hidden',
              }}>
                <View style={{
                  padding: 24,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: Platform.OS === 'web' ? 22 : 20,
                    fontWeight: 'bold',
                    color: '#111827',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                    {title}
                  </Text>
                  {transactionDetails ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#1f2937',
                        textAlign: 'center',
                        marginBottom: 4,
                      }}>
                        {transactionDetails.categoryName}
                      </Text>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: transactionDetails.isIncome ? '#059669' : '#dc2626',
                      }}>
                        {transactionDetails.isIncome ? '+' : '-'}{formatVND(transactionDetails.amount)}
                      </Text>
                    </View>
                  ) : balance !== undefined ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#6b7280',
                        textAlign: 'center',
                        marginBottom: 4,
                      }}>
                        Current Balance:
                      </Text>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: balance < 0 ? '#dc2626' : '#059669',
                      }}>
                        {formatVND(balance)}
                      </Text>
                    </View>
                  ) : subtitle && (
                    <Text style={{
                      fontSize: 14,
                      color: '#6b7280',
                      textAlign: 'center',
                    }}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>
              
              {/* Actions Card */}
              <View style={{
                backgroundColor: 'white',
                borderRadius: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
                overflow: 'hidden',
              }}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={Platform.OS === 'web' ? 0.8 : 0.7}
                    onPress={() => {
                      console.log('Action pressed:', action.label);
                      action.onPress();
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 24,
                      paddingVertical: Platform.OS === 'web' ? 18 : 16,
                      borderBottomWidth: index < actions.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                      minHeight: Platform.OS === 'web' ? 60 : Platform.OS === 'ios' ? 56 : 52,
                      ...(Platform.OS === 'web' && {
                        cursor: 'pointer',
                        ':hover': {
                          backgroundColor: '#f9fafb',
                        }
                      }),
                    }}
                  >
                    <View 
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16,
                        backgroundColor: action.color ? `${action.color}15` : '#f3f4f6',
                      }}
                    >
                      <Ionicons 
                        name={action.icon as any} 
                        size={24} 
                        color={action.color || '#6b7280'} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text 
                        style={{
                          fontSize: Platform.OS === 'web' ? 17 : 16,
                          fontWeight: '500',
                          color: action.color || '#374151',
                          marginBottom: action.subtitle ? 2 : 0,
                        }}
                      >
                        {action.label}
                      </Text>
                      {action.subtitle && (
                        <Text style={{
                          fontSize: 14,
                          color: '#6b7280',
                        }}>
                          {action.subtitle}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Cancel Button Card */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={Platform.OS === 'web' ? 0.8 : 0.7}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 8,
                  minHeight: Platform.OS === 'web' ? 56 : Platform.OS === 'ios' ? 52 : 48,
                  justifyContent: 'center',
                  ...(Platform.OS === 'web' && {
                    cursor: 'pointer',
                    ':hover': {
                      backgroundColor: '#f9fafb',
                    }
                  }),
                }}
              >
                <View style={{
                  paddingVertical: Platform.OS === 'web' ? 18 : 16,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontWeight: '500',
                    fontSize: Platform.OS === 'web' ? 17 : 16,
                  }}>
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

export default ActionModal; 