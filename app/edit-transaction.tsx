import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [transactionId, setTransactionId] = useState<string>('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

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
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (cleanedText) {
      return cleanedText.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return cleanedText;
  };

  const getRawNumber = (formattedText: string): string => {
    return formattedText.replace(/\./g, '');
  };

  // Function to get picker item styles for better iOS compatibility
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

  useEffect(() => {
    const loadData = async () => {
      try {
        if (params.transaction) {
          const transaction = JSON.parse(params.transaction as string);
          setTransactionId(transaction.$id);
          setName(transaction.name);
          setType(transaction.is_income ? 'income' : 'expense');
          setAmount(formatNumber(transaction.amount.toString()));
          setNote(transaction.note);
          setSelectedDate(new Date(transaction.transaction_date));
          setSelectedAccount(transaction.account_id.$id);
          setSelectedCategory(transaction.category_id.$id);
        }

        const [userAccounts, systemCategories] = await Promise.all([
          getUserAccounts(),
          getCategories()
        ]);
        
        setAccounts(userAccounts);
        setCategories(systemCategories);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load transaction data. Please try again.');
      }
    };

    loadData();
  }, [params.transaction]);

  // Handle success alert
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        Alert.alert(
          'Success',
          'Transaction has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowSuccessAlert(false);
                router.back();
              }
            }
          ],
          { cancelable: false }
        );
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert, router]);

  const handleSubmit = async () => {
    // avoid duplicate submits
    if (isLoading) return;
  
    const rawAmount = getRawNumber(amount);
  
    // ---------- VALIDATION ----------
    if (
      !selectedAccount ||
      !selectedCategory ||
      !rawAmount ||
      isNaN(+rawAmount) ||
      +rawAmount <= 0 ||
      !name.trim()
    ) {
      Alert.alert('Validation error', 'Please check all required fields.');
      return;
    }
  
    setIsLoading(true);
    try {
      // ---------- UPDATE ----------
      await updateTransaction(transactionId, {
        name: name.trim(),
        account_id: selectedAccount,
        category_id: selectedCategory,
        amount: +rawAmount,
        is_income: type === 'income',
        note: note.trim(),
        transaction_date: selectedDate.toISOString(),
      });
  
             // ---------- SUCCESS ----------
       setShowSuccessAlert(true);
         } catch (err: any) {
       // ---------- ERROR ----------
       Alert.alert(
         'Error',
         `Failed to update transaction: ${err?.message ?? 'Unknown error'}`,
       );
    } finally {
      setIsLoading(false); // always stop the spinner
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
          <Text style={platformStyles.title}>Edit Transaction</Text>
        </View>

        {/* Transaction Name Input */}
        <Text style={platformStyles.label}>Transaction Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter transaction name"
          placeholderTextColor="#9ca3af"
          style={platformStyles.textInput}
        />

        {/* Amount Input */}
        <Text style={platformStyles.label}>Amount</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => setAmount(formatNumber(text))}
          placeholder="Enter amount"
          placeholderTextColor="#9ca3af"
          style={platformStyles.textInput}
        />

        {/* Type Toggle */}
        <Text style={platformStyles.label}>Type</Text>
        <View style={platformStyles.typeToggleContainer}>
          <TouchableOpacity
            onPress={() => setType('expense')}
            style={[
              platformStyles.typeButton,
              { backgroundColor: type === 'expense' ? '#dc2626' : '#e5e7eb' }
            ]}
          >
            <Text style={[
              platformStyles.typeButtonText,
              { color: type === 'expense' ? 'white' : '#374151' }
            ]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setType('income')}
            style={[
              platformStyles.typeButton,
              { backgroundColor: type === 'income' ? '#16a34a' : '#e5e7eb' }
            ]}
          >
            <Text style={[
              platformStyles.typeButtonText,
              { color: type === 'income' ? 'white' : '#374151' }
            ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Selection */}
        <Text style={platformStyles.label}>Select Account</Text>
        <View style={platformStyles.pickerContainer}>
          <Picker
            selectedValue={selectedAccount}
            onValueChange={(itemValue) => setSelectedAccount(itemValue)}
            style={platformStyles.picker}
            itemStyle={getPickerItemStyle()}
          >
            <Picker.Item label="Choose Account" value={null} color="#6b7280" />
            {accounts.map((account, index) => (
              <Picker.Item key={index} label={account.name} value={account.$id} color="#000000" />
            ))}
          </Picker>
        </View>

        {/* Category Selection */}
        <Text style={platformStyles.label}>Select Category</Text>
        <View style={platformStyles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={platformStyles.picker}
            itemStyle={getPickerItemStyle()}
          >
            <Picker.Item label="Choose Category" value={null} color="#6b7280" />
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category.name} value={category.$id} color="#000000" />
            ))}
          </Picker>
        </View>

        {/* Note Input */}
        <Text style={platformStyles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note"
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
              <Text style={platformStyles.submitButtonText}>Updating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save" size={20} color="white" />
              <Text style={platformStyles.submitButtonText}>Update Transaction</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default EditTransaction; 