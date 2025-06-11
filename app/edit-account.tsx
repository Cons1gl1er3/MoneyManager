import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { updateAccount } from '../lib/appwrite';
import { TRANSACTION_UPDATED_EVENT } from '../lib/hooks/useTransactionActions';

const EditAccount = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedAccount, setSavedAccount] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  // Parse account data from params
  const [accountData, setAccountData] = useState(null);
  const [originalInitialBalance, setOriginalInitialBalance] = useState('');
  const [showInitialBalanceWarning, setShowInitialBalanceWarning] = useState(false);
  const [showBalanceConfirm, setShowBalanceConfirm] = useState(false);

  /**
   * Edit Account Logic:
   * - Only allow editing account name and initial balance
   * - Current balance is automatically calculated as: initial_balance + income_transactions - expense_transactions
   * - When initial_balance changes, current balance is recalculated in the backend
   */

  useEffect(() => {
    if (params.account) {
      try {
        const account = JSON.parse(params.account as string);
        console.log('Parsed account data:', account);
        
        setAccountData(account);
        setName(account.name);
        
        // Chỉ lấy initial_balance, nếu không có thì để trống
        let accountInitialBalance = '';
        let showInitialBalanceWarning = false;
        if (account.initial_balance !== undefined && account.initial_balance !== null) {
          accountInitialBalance = formatNumber(account.initial_balance.toString());
        } else {
          accountInitialBalance = '';
          showInitialBalanceWarning = true;
        }
        setInitialBalance(accountInitialBalance);
        setOriginalInitialBalance(accountInitialBalance);
        setShowInitialBalanceWarning(showInitialBalanceWarning);
        
        console.log('Account loaded successfully:', {
          name: account.name,
          balance: account.balance,
          initial_balance: account.initial_balance
        });
      } catch (error) {
        console.error('Error parsing account data:', error);
        console.error('Account param:', params.account);
        setErrorModalMessage('Error loading account data. Please try again.');
        setErrorModalVisible(true);
      }
    } else {
      console.error('No account parameter provided');
      setErrorModalMessage('No account data provided. Please go back and try again.');
      setErrorModalVisible(true);
    }
  }, [params.account]);

  // Format number with thousand separators
  const formatNumber = (text: string): string => {
    // Remove all non-numeric characters
    const cleanedText = text.replace(/[^0-9-]/g, '');
    
    // Handle negative numbers
    const isNegative = cleanedText.startsWith('-');
    const positiveNumber = cleanedText.replace('-', '');
    
    // Add thousand separators
    if (positiveNumber) {
      const formatted = positiveNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return isNegative ? `-${formatted}` : formatted;
    }
    return cleanedText;
  };

  // Get raw number from formatted string
  const getRawNumber = (formattedText: string): string => {
    return formattedText.replace(/\./g, '');
  };

  const handleSave = async () => {
    if (!accountData) {
      setErrorModalMessage('Account data not found');
      setErrorModalVisible(true);
      return;
    }

    if (!name.trim()) {
      setErrorModalMessage('Please enter account name');
      setErrorModalVisible(true);
      return;
    }

    const rawInitialBalance = getRawNumber(initialBalance);
    
    if (!rawInitialBalance || isNaN(+rawInitialBalance)) {
      setErrorModalMessage('Please enter a valid initial balance');
      setErrorModalVisible(true);
      return;
    }

    // Check if any balance has changed
    const originalRawInitialBalance = getRawNumber(originalInitialBalance);
    const hasInitialBalanceChanged = rawInitialBalance !== originalRawInitialBalance;
    
    if (hasInitialBalanceChanged && !showBalanceConfirm) {
      setShowBalanceConfirm(true);
      return;
    }

    await performUpdate(rawInitialBalance);
  };

  const performUpdate = async (rawInitialBalance: string) => {
    setIsLoading(true);
    try {
      const updatedAccount = await updateAccount(accountData.$id, {
        name: name.trim(),
        initial_balance: +rawInitialBalance,
      });

      // Emit event to notify that an account has been updated
      EventRegister.emit(TRANSACTION_UPDATED_EVENT, {
        action: 'account_update',
        id: accountData.$id
      });

      setSavedAccount({
        name: name.trim(),
        balance: +rawInitialBalance,
        balanceType: 'Initial Balance',
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating account:', error);
      setErrorModalMessage('Failed to update account. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!accountData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">Loading...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row items-center px-4 pt-4 mb-6">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mr-4 p-2 bg-gray-100 rounded-full"
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold flex-1">Edit Money Source</Text>
              </View>

              <ScrollView 
                className="flex-1 px-4"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* Account Name Input */}
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-700 mb-2">
                    Account Name *
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter account name"
                    placeholderTextColor="#9ca3af"
                    className="w-full p-4 border border-gray-300 rounded-xl text-base"
                    style={{ backgroundColor: '#ffffff', paddingVertical: Platform.OS === 'ios' ? 16 : 12 }}
                  />
                </View>

                {/* Balance Info Card */}
                <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <Text className="text-base font-medium text-blue-900 mb-2">
                    💡 About Initial Balance
                  </Text>
                  <Text className="text-sm text-blue-700 mb-2">
                    This is the amount of money you had when you first created this account.
                  </Text>
                  <Text className="text-sm text-blue-700">
                    Your current balance will be calculated automatically: Initial Balance + Income - Expenses
                  </Text>
                </View>

                {/* Initial Balance Input */}
                <View className="mb-6">
                  <Text className="text-base font-medium text-gray-700 mb-2">
                    Initial Balance *
                  </Text>
                  <View className="flex-row items-center">
                    <TextInput
                      value={initialBalance}
                      onChangeText={(text) => setInitialBalance(formatNumber(text))}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 p-4 border border-gray-300 rounded-xl text-base"
                      style={{ backgroundColor: '#ffffff', paddingVertical: Platform.OS === 'ios' ? 16 : 12 }}
                    />
                  </View>
                  <Text className="text-sm text-gray-500 mt-1">
                    The amount of money you had when you first created this account.
                  </Text>
                  {showInitialBalanceWarning && (
                    <Text className="text-xs text-red-500 mt-1">
                      This account does not have an initial balance set. Please enter the original amount you had when creating this account.
                    </Text>
                  )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-xl flex-row items-center justify-center ${
                    isLoading ? 'bg-gray-400' : 'bg-blue-600'
                  }`}
                  style={{ marginTop: 20 }}
                >
                  {isLoading ? (
                    <>
                      <Ionicons name="hourglass-outline" size={20} color="white" />
                      <Text className="text-white font-semibold text-base ml-2">
                        Updating...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="white" />
                      <Text className="text-white font-semibold text-base ml-2">
                        Update Account
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        
        {/* Modals */}
        <SuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.back();
          }}
          message="Account has been updated successfully!"
          accountDetails={savedAccount}
        />

        {/* Balance Change Confirmation Modal */}
        <ConfirmModal
          visible={showBalanceConfirm}
          title="Confirm Balance Change"
          message={`Are you sure you want to make these changes?\n\nInitial Balance: ${formatNumber(getRawNumber(originalInitialBalance))} → ${initialBalance}\n\nThis will directly modify your account balance. Consider creating income/expense transactions instead.`}
          confirmText="Yes, Update Balance"
          cancelText="Cancel"
          onConfirm={async () => {
            setShowBalanceConfirm(false);
            const rawInitialBalance = getRawNumber(initialBalance);
            await performUpdate(rawInitialBalance);
          }}
          onCancel={() => {
            setShowBalanceConfirm(false);
          }}
          confirmButtonColor="#D97706"
        />

        {/* Error Modal */}
        <ErrorModal
          visible={errorModalVisible}
          message={errorModalMessage}
          onClose={() => setErrorModalVisible(false)}
        />
      </SafeAreaView>
    </>
  );
};

export default EditAccount; 