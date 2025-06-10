import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { getCategoriesByType, getUserAccounts } from '../lib/appwrite';

interface Transaction {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  accountName: string;
  categoryName: string;
  date: string;
  note: string;
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

  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const backgroundColor = isDarkMode ? '#000000' : '#FFFFFF';

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
    if (!selectedAccount || !selectedCategory || !amount || isNaN(parseFloat(amount))) {
      alert('Please fill all fields correctly.');
      return;
    }

    // Find the account and category names for the selected IDs
    const account = accounts.find(acc => acc.$id === selectedAccount);
    const category = categories.find(cat => cat.$id === selectedCategory);

    if (!account || !category) {
      alert('Invalid account or category selection.');
      return;
    }

    // Create the updated transaction object
    const updatedTransaction = {
      name,
      amount: parseFloat(amount),
      type,
      accountName: account.name,
      categoryName: category.name,
      date: selectedDate.toISOString(),
      note,
      accountId: selectedAccount,
      categoryId: selectedCategory
    };

    // Return to the confirmation page with the updated transaction
    router.back();
    // Use setTimeout to ensure the navigation completes before setting params
    setTimeout(() => {
      router.setParams({ 
        editedTransaction: JSON.stringify(updatedTransaction),
        editedIndex: params.index
      });
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <ScrollView 
        style={styles.flex1}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>Edit Transaction</Text>
        </View>

        {/* Transaction Name Input */}
        <Text style={[styles.label, { color: isDarkMode ? '#a0aec0' : '#4a5568' }]}>Transaction Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter transaction name"
          placeholderTextColor={isDarkMode ? '#718096' : '#a0aec0'}
          style={[styles.input, { 
            backgroundColor: isDarkMode ? '#1a202c' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            borderColor: isDarkMode ? '#4a5568' : '#d1d5db'
          }]}
        />

        {/* Amount Input */}
        <Text style={[styles.label, { color: isDarkMode ? '#a0aec0' : '#4a5568' }]}>Amount</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          placeholderTextColor={isDarkMode ? '#718096' : '#a0aec0'}
          style={[styles.input, { 
            backgroundColor: isDarkMode ? '#1a202c' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            borderColor: isDarkMode ? '#4a5568' : '#d1d5db',
            marginBottom: 16
          }]}
        />

        {/* Account Selection */}
        <CustomPicker
          label="Select Account"
          items={accounts.map((account) => ({ label: account.name, value: account.$id }))}
          selectedValue={selectedAccount}
          onValueChange={(itemValue) => setSelectedAccount(itemValue)}
          placeholder="Choose an account"
        />

        {/* Category Selection */}
        <CustomPicker
          label="Select Category"
          items={categories.map((category) => ({ label: category.name, value: category.$id }))}
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          placeholder="Choose a category"
        />

        {/* Note Input */}
        <Text style={[styles.label, { color: isDarkMode ? '#a0aec0' : '#4a5568' }]}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="E.g. Dinner, Freelance, etc."
          placeholderTextColor={isDarkMode ? '#718096' : '#a0aec0'}
          style={[styles.input, { 
            backgroundColor: isDarkMode ? '#1a202c' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            borderColor: isDarkMode ? '#4a5568' : '#d1d5db'
          }]}
        />

        {/* Date Selection */}
        <Text style={[styles.label, { color: isDarkMode ? '#a0aec0' : '#4a5568' }]}>Transaction Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[styles.dateButton, { borderColor: isDarkMode ? '#4a5568' : '#d1d5db' }]}
        >
          <Text style={{ color: isDarkMode ? '#cbd5e0' : '#4a5568' }}>{selectedDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Ionicons name="save" size={20} color="white" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10
  },
  backButton: {
    position: 'absolute',
    top: 5,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 28,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EditOcrTransaction; 