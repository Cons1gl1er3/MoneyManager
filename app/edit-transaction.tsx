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
import SuccessModal from '../components/SuccessModal';
import TypeToggleButton from '../components/TypeToggleButton';
import { getCategories, getUserAccounts, updateTransaction } from '../lib/appwrite';

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
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28,
      backgroundColor: '#fff',
      ...(Platform.OS === 'web' && { cursor: 'pointer' }),
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

  useEffect(() => {
    (async () => {
      if (params.transaction) {
        const t = JSON.parse(params.transaction as string);
        setTransactionId(t.$id);
        setName(t.name);
        setType(t.is_income ? 'income' : 'expense');
        setAmount(formatNumber(t.amount.toString()));
        setNote(t.note);
        setSelectedDate(new Date(t.transaction_date));
        setSelectedAccount(t.account_id.$id);
        setSelectedCategory(t.category_id.$id);
      }
      try {
        const [userAccounts, cats] = await Promise.all([
          getUserAccounts(),
          getCategories(),
        ]);
        setAccounts(userAccounts);
        setCategories(cats);
      } catch {
        Alert.alert('Error', 'Failed to load data.');
      }
    })();
  }, [params.transaction]);

  const handleSave = async () => {
    if (isLoading) return;
    const amt = parseNumber(amount);
    if (
      !selectedAccount ||
      !selectedCategory ||
      !amt ||
      isNaN(+amt) ||
      +amt <= 0 ||
      !name.trim()
    ) {
      Alert.alert('Validation error', 'Please fill all required fields.');
      return;
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
      Alert.alert('Error', `Failed to update: ${e.message ?? 'Unknown'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') return null;
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: '#6b7280' }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ fontWeight: '600' }}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
              />
            </View>
          </View>
        </Modal>
      );
    }
    
    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={(event, date) => {
          setShowDatePicker(false);
          if (date) setSelectedDate(date);
        }}
      />
    );
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
          items={categories.map((cat) => ({ label: cat.name, value: cat.$id }))}
          selectedValue={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value)}
          placeholder="Choose a category"
        />

        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: '#000', fontSize: 16 }}>
            {selectedDate.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
        </TouchableOpacity>

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

      {showDatePicker && renderDatePicker()}

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        message="Transaction updated successfully!"
        transactionDetails={updatedTransaction}
      />
    </SafeAreaView>
  );
};

export default EditTransaction;