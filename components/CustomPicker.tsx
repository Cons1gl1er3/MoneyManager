import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PickerItem {
  label: string;
  value: any;
}

interface CustomPickerProps {
  label: string;
  items: PickerItem[];
  selectedValue: any;
  onValueChange: (value: any) => void;
  placeholder?: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  label,
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option...',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);

  const renderItem = ({ item }: { item: PickerItem }) => (
    <TouchableOpacity
      style={[styles.itemContainer, Platform.OS === 'ios' && {
        minHeight: 50,
        paddingVertical: 16,
      }]}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.itemText, Platform.OS === 'ios' && {
        fontSize: 17,
      }]}>{item.label}</Text>
      {selectedValue === item.value && (
        <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerButtonText, !selectedItem && styles.placeholderText]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      >
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
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
                  maxWidth: Platform.OS === 'web' ? 450 : 380,
                }}
              >
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 8,
                  overflow: 'hidden',
                  paddingVertical: 8,
                }}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { textAlign: 'center', flex: 1 }]}>{label}</Text>
                    <TouchableOpacity 
                      onPress={() => setModalVisible(false)}
                      style={{ padding: 8 }}
                    >
                      <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={items}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    style={{ maxHeight: 400 }}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{
                      paddingBottom: 8,
                      paddingTop: 8,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Platform.OS === 'web' ? 20 : 16,
    width: '100%',
  },
  label: {
    color: '#374151',
    marginBottom: Platform.OS === 'web' ? 10 : 8,
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : 14,
    fontWeight: '500',
    letterSpacing: Platform.OS === 'web' ? 0.5 : 0,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 18 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    minHeight: Platform.OS === 'web' ? 56 : Platform.OS === 'ios' ? 58 : 54,
    width: '100%',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#9ca3af',
        backgroundColor: '#f9fafb',
      }
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  pickerButtonText: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 17 : 16,
    color: '#000',
    flex: 1,
    fontWeight: Platform.OS === 'web' ? '500' : '400',
    letterSpacing: Platform.OS === 'web' ? 0.25 : 0,
  },
  placeholderText: {
    color: Platform.OS === 'web' ? '#6b7280' : '#9ca3af',
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 17 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemText: {
    fontSize: 16,
  },
});

export default CustomPicker; 