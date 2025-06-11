import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../components/CustomPicker';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import TypeToggleButton from '../components/TypeToggleButton';
import { updateTransaction } from '../lib/appwrite';
import { TRANSACTION_UPDATED_EVENT } from '../lib/hooks/useTransactionActions';
import { useTransactionForm } from '../lib/hooks/useTransactionForm';

// Fallback income categories (same as add-transaction)
const fallbackIncomeCategories = [
  { $id: 'temp-salary', name: 'Lương', icon: 'wallet-outline', color: '#22C55E' },
  { $id: 'temp-allowance', name: 'Tiền phụ cấp', icon: 'card-outline', color: '#10B981' },
  { $id: 'temp-bonus', name: 'Tiền thưởng', icon: 'trophy-outline', color: '#34D399' },
  { $id: 'temp-freelance', name: 'Freelance', icon: 'laptop-outline', color: '#6EE7B7' },
  { $id: 'temp-investment', name: 'Đầu tư', icon: 'trending-up-outline', color: '#059669' }
];

const EditTransaction = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Memoize initialTransaction to avoid creating a new object every render
  const initialTransaction = useMemo(() => {
    if (params.transaction) {
      try {
        return JSON.parse(params.transaction as string);
      } catch {
        return null;
      }
    }
    return null;
  }, [params.transaction]);

  const {
    name,
    type,
    amount,
    note,
    selectedAccount,
    selectedCategory,
    selectedDate,
    accounts,
    categories,
    isLoading,
    showSuccessModal,
    errorModalVisible,
    errorModalMessage,
    updatedTransaction,
    setField,
    formatNumber,
    validateForm,
    getFormData,
    showSuccess,
    closeModals,
  } = useTransactionForm({
    initialTransaction,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      ...(Platform.OS === 'web' && {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
      }),
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
      paddingTop: Platform.OS === 'web' ? 16 : 24,
      paddingBottom: Platform.OS === 'web' ? 40 : 100,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Platform.OS === 'web' ? 20 : 24,
    },
    backButton: {
      padding: 8,
      backgroundColor: '#e5e7eb',
      borderRadius: 8,
      marginRight: 12,
      ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    title: {
      fontSize: Platform.OS === 'web' ? 28 : 24,
      fontWeight: 'bold',
      color: '#1f2937',
    },
    label: {
      color: '#374151',
      marginBottom: 8,
      fontSize: Platform.OS === 'web' ? 16 : 14,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: '#fff',
      marginBottom: Platform.OS === 'web' ? 20 : 24,
      color: '#000',
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 12,
      backgroundColor: '#fff',
      marginBottom: Platform.OS === 'web' ? 20 : 16,
    },
    dateButton: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'web' ? 14 : 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Platform.OS === 'web' ? 28 : 24,
      backgroundColor: '#fff',
      ...(Platform.OS === 'web' && { cursor: 'pointer' }),
      ...(Platform.OS === 'ios' && {
        minHeight: 50,
      }),
    },
    dateText: {
      fontSize: Platform.OS === 'web' ? 16 : 16,
      color: '#000000',
      flex: 1,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: Platform.OS === 'web' ? 20 : 32,
      ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  useEffect(() => {
    if (initialTransaction && initialTransaction.$id) {
      setTransactionId(initialTransaction.$id);
    }
  }, [initialTransaction]);

  const handleSave = async () => {
    if (isLoading) return;

    if (!validateForm()) return;
    
    setField('isLoading', true);
    try {
      const payload = getFormData();
      await updateTransaction(transactionId, payload);
      
      // Emit event to notify that a transaction has been updated
      EventRegister.emit(TRANSACTION_UPDATED_EVENT, {
        action: 'update',
        id: transactionId
      });
      
      showSuccess(payload);
    } catch (e: any) {
      setField('errorModalMessage', `Failed to update: ${e.message ?? 'Unknown'}`);
      setField('errorModalVisible', true);
    } finally {
      setField('isLoading', false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar style="dark" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Transaction</Text>
        </View>

        <Text style={styles.label}>Transaction Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(value) => setField('name', value)}
          placeholder="Enter transaction name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Type *</Text>
        <TypeToggleButton 
          type={type} 
          onTypeChange={(value) => setField('type', value)} 
        />

        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={(text) => setField('amount', formatNumber(text))}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />

        <CustomPicker
          label="Select Money Source *"
          items={accounts.map((acc) => ({ label: acc.name, value: acc.$id }))}
          selectedValue={selectedAccount}
          onValueChange={(value) => setField('selectedAccount', value)}
          placeholder="Choose an account"
        />

        <CustomPicker
          label="Select Category *"
          items={categories.length === 0 && type === 'income' ? 
            [{ label: 'No income categories found. Please run admin setup first.', value: null }] :
            categories.map((category) => ({ label: category.name, value: category.$id }))
          }
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => {
            if (itemValue === null) {
              setField('errorModalMessage', 'No categories available. Please:\n\n1. Go to Admin Setup page\n2. Click "Add Income Categories"\n3. Return here to edit transactions');
              setField('errorModalVisible', true);
              return;
            }
            console.log('CATEGORY SELECTED:', itemValue);
            setField('selectedCategory', itemValue);
          }}
          placeholder={categories.length === 0 && type === 'income' ? 
            'Please run admin setup first' : 
            categories.length === 0 && type === 'expense' ?
            'Loading categories...' :
            'Choose a category'
          }
        />

        <Text style={styles.label}>Date *</Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                setField('selectedDate', newDate);
              }
            }}
            max={new Date().toISOString().split('T')[0]}
            style={{
              border: '1px solid #d1d5db',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: 16,
              color: '#000000',
              backgroundColor: '#ffffff',
              marginBottom: Platform.OS === 'web' ? 28 : 24,
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={note}
          onChangeText={(value) => setField('note', value)}
          placeholder="Add a note (optional)"
          multiline
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isLoading ? '#9ca3af' : '#2563eb' },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Ionicons
            name={isLoading ? 'hourglass-outline' : 'save-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.submitText}>
            {isLoading ? 'Updating...' : 'Update Transaction'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setShowDatePicker(false)}
          >
            <BlurView intensity={30} style={{ flex: 1 }}>
              <View style={{ 
                flex: 1, 
                backgroundColor: 'rgba(0,0,0,0.4)', 
                justifyContent: 'flex-end',
              }}>
                <View style={{
                  backgroundColor: '#ffffff',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 20,
                  paddingBottom: 40,
                  paddingHorizontal: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: '#6b7280', fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>
                      Select Date
                    </Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: '#2563eb', fontSize: 16, fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) {
                        setField('selectedDate', date);
                      }
                    }}
                    maximumDate={new Date()}
                    textColor="#000000"
                    style={{
                      backgroundColor: '#ffffff',
                      height: 200,
                    }}
                  />
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setField('selectedDate', date);
            }
          }}
          maximumDate={new Date()}
        />
      )}

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          closeModals();
          router.back();
        }}
        message="Transaction updated successfully!"
        transactionDetails={updatedTransaction}
      />
      <ErrorModal
        visible={errorModalVisible}
        message={errorModalMessage}
        onClose={() => closeModals()}
      />
    </SafeAreaView>
  );
};

export default EditTransaction;