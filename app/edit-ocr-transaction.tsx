import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
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
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomPicker from '../components/CustomPicker';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { getCategoriesByType, getUserAccounts } from '../lib/appwrite';

interface Transaction {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  accountName: string;
  categoryName: string;
  date: string;
  note: string;
  accountId?: string;
  categoryId?: string;
}

const EditOcrTransaction = () => {
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
  const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const backgroundColor = isDarkMode ? '#000000' : '#FFFFFF';

  // Format number with thousand separators
  const formatNumber = (text: string) => {
    return text.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Format amount to VND
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('₫', 'VNĐ');
  };

  // Load categories based on transaction type
  const loadCategories = async (transactionType: 'income' | 'expense') => {
    try {
      console.log(`Loading categories for type: ${transactionType}`);
      const categoriesData = await getCategoriesByType(transactionType);
      setCategories(categoriesData);
      console.log(`Loaded ${categoriesData.length} categories for ${transactionType}`);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', `Failed to load ${transactionType} categories. Please try again.`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Parse the transaction data from params
        if (params.transaction) {
          const transaction = JSON.parse(params.transaction as string) as Transaction;
          setOriginalTransaction(transaction);
          setName(transaction.name);
          // Force type to be expense since OCR only supports expense transactions
          setType('expense');
          setAmount(transaction.amount.toString());
          setNote(transaction.note);
          setSelectedDate(new Date(transaction.date));

          // Load accounts and categories
          const userAccounts = await getUserAccounts();
          setAccounts(userAccounts);
          
          // Set initial account based on name
          const account = userAccounts.find(acc => acc.name === transaction.accountName);
          if (account) {
            console.log('Found account:', account.name, account.$id);
            setSelectedAccount(account.$id);
          }
          
          // Load categories based on expense type only
          await loadCategories('expense');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load initial data.');
      }
    };

    loadData();
  }, []);

  // Find and set category after categories are loaded
  useEffect(() => {
    if (originalTransaction && categories.length > 0) {
      const category = categories.find(cat => cat.name === originalTransaction.categoryName);
      if (category) {
        console.log('Found category:', category.name, category.$id);
        setSelectedCategory(category.$id);
      }
    }
  }, [categories, originalTransaction]);

  const handleSave = () => {
    if (!name || !amount || !selectedAccount || !selectedCategory) {
      setErrorMessage('Please fill in all required fields');
      setErrorModalVisible(true);
      return;
    }

    const updatedTransaction = {
      ...originalTransaction,
      name,
      amount: parseFloat(amount.replace(/\./g, '')),
      type: 'expense',
      accountId: selectedAccount,
      categoryId: selectedCategory,
      note,
      date: selectedDate.toISOString()
    };

    // Navigate back to confirmation page with updated transaction
    router.push({
      pathname: '/receipt-log-confirmation',
      params: {
        editedTransaction: JSON.stringify(updatedTransaction),
        editedIndex: params.index
      }
    });
  };

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
          onValueChange={setSelectedAccount}
          placeholder="Choose an account"
        />

        <CustomPicker
          label="Select Category *"
          items={categories.map((cat) => ({ label: cat.name, value: cat.$id }))}
          selectedValue={selectedCategory}
          onValueChange={setSelectedCategory}
          placeholder="Choose a category"
        />

        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note (optional)"
          placeholderTextColor="#9ca3af"
          multiline
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#10B981' }]}
          onPress={handleSave}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.submitText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <Modal transparent animationType="fade">
          <BlurView intensity={20} style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12 }}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setSelectedDate(date);
                  }}
                />
              </View>
            </View>
          </BlurView>
        </Modal>
      )}

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => router.back()}
        message="Transaction updated successfully"
      />

      <ErrorModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        message={errorMessage}
      />
    </SafeAreaView>
  );
};

export default EditOcrTransaction; 