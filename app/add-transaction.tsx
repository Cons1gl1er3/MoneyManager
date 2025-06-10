import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../components/CustomPicker';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import TypeToggleButton from '../components/TypeToggleButton';
import { getCategoriesByType, getUserAccounts, logTransaction } from '../lib/appwrite';

// Fallback income categories
const fallbackIncomeCategories = [
  { $id: 'temp-salary', name: 'Lương', icon: 'wallet-outline', color: '#22C55E' },
  { $id: 'temp-allowance', name: 'Tiền phụ cấp', icon: 'card-outline', color: '#10B981' },
  { $id: 'temp-bonus', name: 'Tiền thưởng', icon: 'trophy-outline', color: '#34D399' },
  { $id: 'temp-freelance', name: 'Freelance', icon: 'laptop-outline', color: '#6EE7B7' },
  { $id: 'temp-investment', name: 'Đầu tư', icon: 'trending-up-outline', color: '#059669' }
];

const AddTransaction = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);  // State for selected account
  const [selectedCategory, setSelectedCategory] = useState(null); // State for selected category
  const [accounts, setAccounts] = useState([]);  // List of user accounts
  const [categories, setCategories] = useState([]);  // List of categories for dropdown
  const [selectedDate, setSelectedDate] = useState(new Date()); // For date picker
  const [showDatePicker, setShowDatePicker] = useState(false); // For toggling date picker visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state for saving transaction
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
  const [savedTransaction, setSavedTransaction] = useState(null); // Store saved transaction data
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Platform-specific styles
  const platformStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
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
      padding: Platform.OS === 'web' ? 8 : 8,
      backgroundColor: '#e5e7eb',
      borderRadius: Platform.OS === 'web' ? 8 : 20,
      marginRight: Platform.OS === 'web' ? 12 : 16,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
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
    textInput: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'web' ? 12 : 12,
      borderRadius: 12,
      fontSize: Platform.OS === 'web' ? 16 : 16,
      color: '#000000',
      backgroundColor: '#ffffff',
      marginBottom: Platform.OS === 'web' ? 20 : 24,
      ...(Platform.OS === 'web' && {
        outline: 'none',
        '&:focus': {
          borderColor: '#6366f1',
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
        },
      }),
    },
    typeToggleContainer: {
      flexDirection: 'row',
      marginBottom: Platform.OS === 'web' ? 20 : 16,
      gap: Platform.OS === 'web' ? 16 : 8,
    },
    typeButton: {
      flex: 1,
      paddingVertical: Platform.OS === 'web' ? 14 : 12,
      borderRadius: 12,
      alignItems: 'center',
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    typeButtonText: {
      fontWeight: '600',
      fontSize: Platform.OS === 'web' ? 16 : 14,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 12,
      marginBottom: Platform.OS === 'web' ? 20 : 16,
      backgroundColor: '#ffffff',
      ...(Platform.OS === 'web' && {
        minHeight: 50,
      }),
      ...(Platform.OS === 'ios' && {
        paddingVertical: 0,
        height: 50,
        justifyContent: 'center',
      }),
    },
    picker: {
      color: '#000000',
      backgroundColor: '#ffffff',
      height: Platform.OS === 'web' ? 50 : 50,
      ...(Platform.OS === 'web' && {
        border: 'none',
        outline: 'none',
      }),
      ...(Platform.OS === 'ios' && {
        height: 50,
        marginVertical: 0,
      }),
    },
    dateButton: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'web' ? 14 : 14,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Platform.OS === 'web' ? 28 : 24,
      backgroundColor: '#ffffff',
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
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
      paddingVertical: Platform.OS === 'web' ? 16 : 16,
      borderRadius: 12,
      marginBottom: Platform.OS === 'web' ? 20 : 32,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    submitButtonText: {
      color: 'white',
      fontSize: Platform.OS === 'web' ? 16 : 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  // Format number with thousand separators
  const formatNumber = (text: string): string => {
    // Remove all non-numeric characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    
    // Add thousand separators
    if (cleanedText) {
      return cleanedText.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return cleanedText;
  };

  // Get raw number without formatting
  const getRawNumber = (formattedText: string): string => {
    return formattedText.replace(/\./g, '');
  };

  // Load categories based on transaction type
  const loadCategories = async (transactionType: 'income' | 'expense') => {
    try {
      console.log(`Loading categories for type: ${transactionType}`);
      const categoriesData = await getCategoriesByType(transactionType);
      console.log(`Raw categories data:`, categoriesData);
      
      // If no income categories found, use fallback
      if (transactionType === 'income' && categoriesData.length === 0) {
        console.log('No income categories in database, using fallback categories');
        setCategories(fallbackIncomeCategories);
        console.log(`Using ${fallbackIncomeCategories.length} fallback income categories`);
        return;
      }
      
      setCategories(categoriesData);
      // Reset selected category when type changes
      setSelectedCategory(null);
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
    const loadData = async () => {
      try {
        const userAccounts = await getUserAccounts();
        setAccounts(userAccounts);
        
        // Load categories for initial type (expense)
        await loadCategories(type);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      }
    };

    loadData();
  }, []);

  // Load categories when transaction type changes
  useEffect(() => {
    loadCategories(type);
  }, [type]);

  // Handle account and category selection
  const handleSubmit = async () => {
    if (isLoading) return; // Prevent multiple submissions
    
    // Simplified error handling
    const showError = (message: string) => {
      setErrorModalMessage(message);
      setErrorModalVisible(true);
    };

    const rawAmount = getRawNumber(amount);
    const payload = {
      name: name.trim(),
      accountID: selectedAccount,
      categoryID: selectedCategory,
      amount: parseFloat(rawAmount),
      isIncome: type === 'income',
      note: note.trim(),
      transactionDate: selectedDate.toISOString()
    };
    
    console.log('--- Attempting to Add Transaction ---');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // --- Validation ---
    if (!payload.accountID || !payload.categoryID) {
      console.log('Validation failed: Account or Category not selected.');
      return showError('Please fill all required fields: Money Source and Category.');
    }
    
    // Check if using temporary category
    if (payload.categoryID.startsWith('temp-')) {
      console.log('Warning: Using temporary category');
      return showError('⚠️ You are using a temporary category.\n\nPlease:\n1. Go to Admin Setup page\n2. Click "Convert 5 Categories to Income" or add via Appwrite Console\n3. Return here to add transactions with real categories');
    }
    
    if (!payload.amount || isNaN(payload.amount) || payload.amount <= 0) {
      console.log('Validation failed: Invalid amount.');
      return showError('Please enter a valid amount greater than 0.');
    }
    if (!payload.name) {
      console.log('Validation failed: Name is empty.');
      return showError('Please enter a transaction name.');
    }
    
    setIsLoading(true);
    
    try {
      console.log('Calling logTransaction API...');
      const result = await logTransaction(
        payload.name, 
        payload.accountID, 
        payload.categoryID, 
        payload.amount, 
        payload.isIncome, 
        payload.note, 
        payload.transactionDate
      );
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create transaction');
      }
      
      console.log('API call successful:', result.transaction?.$id);
      
      // Store transaction data and show success modal
      setSavedTransaction({
        name: payload.name,
        amount: payload.amount,
        type: payload.isIncome ? 'Income' : 'Expense'
      });
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('AddTransaction Error:', error);
      const errorMessage = error.message || 'An unknown error occurred while saving the transaction.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPickerItemStyle = () => {
    if (Platform.OS === 'web') {
      return {
        color: '#000000',
        fontSize: 16,
      };
    } else {
      return {
        color: '#000000',
        fontSize: 16,
        height: 50,
      };
    }
  };

  return (
    <SafeAreaView style={platformStyles.container}>
      <ScrollView 
        contentContainerStyle={platformStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={platformStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={platformStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={platformStyles.title}>Add Transaction</Text>
        </View>

        {/* Transaction Name Input */}
        <Text style={platformStyles.label}>Transaction Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="E.g. Coffee, Grocery, Salary"
          placeholderTextColor="#9ca3af"
          style={platformStyles.textInput}
        />

        {/* Amount Input */}
        <Text style={platformStyles.label}>Amount</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => {
            const formatted = formatNumber(text);
            setAmount(formatted);
          }}
          placeholder="E.g. 50.000, 100.000"
          placeholderTextColor="#9ca3af"
          style={[platformStyles.textInput, { marginBottom: 16 }]}
        />

        {/* Type Toggle */}
        <Text style={platformStyles.label}>Type</Text>
        <TypeToggleButton type={type} onTypeChange={setType} />

        {/* Account Selection */}
        <CustomPicker
          label="Select Money Source"
          items={accounts.map((account) => ({ label: account.name, value: account.$id }))}
          selectedValue={selectedAccount}
          onValueChange={(itemValue) => {
            console.log('ACCOUNT SELECTED:', itemValue);
            setSelectedAccount(itemValue);
          }}
          placeholder="Choose an account"
        />

        {/* Category Selection */}
        <CustomPicker
          label="Select Category"
          items={categories.length === 0 && type === 'income' ? 
            [{ label: 'No income categories found. Please run admin setup first.', value: null }] :
            categories.map((category) => ({ label: category.name, value: category.$id }))
          }
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => {
            if (itemValue === null) {
              // Show helpful message
              setErrorModalMessage('No categories available. Please:\n\n1. Go to Admin Setup page\n2. Click "Add Income Categories"\n3. Return here to add transactions');
              setErrorModalVisible(true);
              return;
            }
            console.log('CATEGORY SELECTED:', itemValue);
            setSelectedCategory(itemValue);
          }}
          placeholder={categories.length === 0 && type === 'income' ? 
            'Please run admin setup first' : 
            'Choose a category'
          }
        />

        {/* Note Input */}
        <Text style={platformStyles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="E.g. Dinner with friends, Freelance work"
          placeholderTextColor="#9ca3af"
          style={platformStyles.textInput}
        />

        {/* Date Selection */}
        <Text style={platformStyles.label}>Transaction Date</Text>
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
              marginBottom: 28,
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={platformStyles.dateButton}
            >
              <Text style={platformStyles.dateText}>
                {selectedDate.toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>

          </>
        )}

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

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={[
            platformStyles.submitButton,
            { backgroundColor: isLoading ? '#9ca3af' : '#2563eb' }
          ]}
        >
          {isLoading ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="white" />
              <Text style={platformStyles.submitButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save" size={20} color="white" />
              <Text style={platformStyles.submitButtonText}>Save Transaction</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            // Reset form
            setName('');
            setAmount('');
            setNote('');
            setSelectedAccount(null);
            setSelectedCategory(null);
            setSelectedDate(new Date());
            
            // Navigate back
            router.back();
          }}
          message="Transaction has been saved successfully!"
          transactionDetails={savedTransaction}
        />

        {/* Error Modal */}
        <ErrorModal
          visible={errorModalVisible}
          message={errorModalMessage}
          onClose={() => setErrorModalVisible(false)}
        />
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default AddTransaction;