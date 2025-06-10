import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../components/CustomPicker';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import TypeToggleButton from '../components/TypeToggleButton';
import { getCategoriesByType, getUserAccounts, updateTransaction } from '../lib/appwrite';

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

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updatedTransaction, setUpdatedTransaction] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

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

  const formatNumber = (text: string) =>
    text.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const parseNumber = (formatted: string) => formatted.replace(/\./g, '');

  // Load categories based on transaction type (same logic as add-transaction)
  const loadCategories = async (transactionType: 'income' | 'expense') => {
    try {
      console.log(`Loading categories for type: ${transactionType}`);
      const categoriesData = await getCategoriesByType(transactionType);
      console.log(`Raw categories data:`, categoriesData);
      console.log(`Categories count: ${categoriesData.length}`);
      
      // If no income categories found, use fallback
      if (transactionType === 'income' && categoriesData.length === 0) {
        console.log('No income categories in database, using fallback categories');
        setCategories(fallbackIncomeCategories);
        console.log(`Using ${fallbackIncomeCategories.length} fallback income categories`);
        return;
      }
      
      setCategories(categoriesData);
      console.log(`Loaded ${categoriesData.length} categories for ${transactionType}`);
      
      if (categoriesData.length === 0) {
        console.warn(`No categories found for type: ${transactionType}. You may need to run admin setup.`);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      
      // If error and it's income, use fallback
      if (transactionType === 'income') {
        console.log('Error loading income categories, using fallback');
        setCategories(fallbackIncomeCategories);
        return;
      }
      
      setErrorModalMessage(`Failed to load ${transactionType} categories. Please try again.`);
      setErrorModalVisible(true);
    }
  };

  useEffect(() => {
    (async () => {
      if (params.transaction) {
        const t = JSON.parse(params.transaction as string);
        setTransactionId(t.$id);
        setName(t.name);
        const transactionType = t.is_income ? 'income' : 'expense';
        setType(transactionType);
        setAmount(formatNumber(t.amount.toString()));
        setNote(t.note);
        setSelectedDate(new Date(t.transaction_date));
        setSelectedAccount(t.account_id.$id);
        setSelectedCategory(t.category_id.$id);
      }
      try {
        const userAccounts = await getUserAccounts();
        setAccounts(userAccounts);
        // Load categories based on current type
        await loadCategories(type);
      } catch {
        Alert.alert('Error', 'Failed to load data.');
      }
    })();
  }, [params.transaction]);

  // Load categories when transaction type changes
  useEffect(() => {
    loadCategories(type);
    // Reset selected category when type changes
    setSelectedCategory(null);
  }, [type]);

  const handleSave = async () => {
    if (isLoading) return;

    const showError = (message: string) => {
      setErrorModalMessage(message);
      setErrorModalVisible(true);
    };

    const amt = parseNumber(amount);
    if (!selectedAccount || !selectedCategory) {
      return showError('Please fill all required fields: Account and Category.');
    }
    
    // Check if using temporary category
    if (selectedCategory?.startsWith('temp-')) {
      console.log('Warning: Using temporary category');
      return showError('⚠️ You are using a temporary category.\n\nPlease:\n1. Go to Admin Setup page\n2. Click "Convert 5 Categories to Income" or add via Appwrite Console\n3. Return here to edit transactions with real categories');
    }
    
    if (!amt || isNaN(+amt) || +amt <= 0) {
      return showError('Please enter a valid amount greater than 0.');
    }
    if (!name.trim()) {
      return showError('Please enter a transaction name.');
    }
    
    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        account_id: selectedAccount,
        category_id: selectedCategory,
        amount: +amt,
        is_income: type === 'income',
        note: note.trim(),
        transaction_date: selectedDate.toISOString(),
      };
      await updateTransaction(transactionId, payload);
      
      setUpdatedTransaction({
        name: payload.name,
        amount: payload.amount,
        type: payload.is_income ? 'Income' : 'Expense',
      });
      setShowSuccessModal(true);

    } catch (e: any) {
      showError(`Failed to update: ${e.message ?? 'Unknown'}`);
    } finally {
      setIsLoading(false);
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
          onChangeText={setName}
          placeholder="Enter transaction name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Type *</Text>
        <TypeToggleButton type={type} onTypeChange={setType} />

        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={(text) => setAmount(formatNumber(text))}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />

        <CustomPicker
          label="Select Money Source *"
          items={accounts.map((acc) => ({ label: acc.name, value: acc.$id }))}
          selectedValue={selectedAccount}
          onValueChange={(value) => setSelectedAccount(value)}
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
              // Show helpful message
              setErrorModalMessage('No categories available. Please:\n\n1. Go to Admin Setup page\n2. Click "Add Income Categories"\n3. Return here to edit transactions');
              setErrorModalVisible(true);
              return;
            }
            console.log('CATEGORY SELECTED:', itemValue);
            setSelectedCategory(itemValue);
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
                setSelectedDate(newDate);
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
          onChangeText={setNote}
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
          animationType="slide"
          transparent={true}
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
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
                    setSelectedDate(date);
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
              setSelectedDate(date);
            }
          }}
          maximumDate={new Date()}
        />
      )}

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        message="Transaction updated successfully!"
        transactionDetails={updatedTransaction}
      />
      <ErrorModal
        visible={errorModalVisible}
        message={errorModalMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default EditTransaction;