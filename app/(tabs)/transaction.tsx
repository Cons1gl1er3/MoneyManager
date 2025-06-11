import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ActionModal from '../../components/ActionModal';
import ConfirmModal from '../../components/ConfirmModal';
import DatePickerModal from '../../components/DatePickerModal';
import ErrorModal from '../../components/ErrorModal';
import FloatingActionButton from '../../components/FloatingActionButton';
import MonthSelector from '../../components/MonthSelector';
import SuccessModal from '../../components/SuccessModal';
import { deleteTransaction, getCurrentUser, getTransactions } from '../../lib/appwrite'; // Assuming you have a function to fetch transactions
import { TRANSACTION_UPDATED_EVENT } from '../../lib/hooks/useTransactionActions';

interface Account {
  $id: string;  // The account ID
  name: string;
  balance: number;
}

interface Category {
  $id: string;  // The category ID
  name: string;
  icon: string;
  color: string;
}

interface User {
  $id: string;  // The user ID
  avatar: string;
  email: string;
  username: string;
}

interface Transaction {
  $id: string;  // The transaction ID
  name: string;
  account_id: Account;  // Account details associated with the transaction
  amount: number;  // The transaction amount
  category_id: Category;  // The category of the transaction
  is_income: boolean;  // Whether it's an income or expense
  note: string;  // Any notes associated with the transaction
  transaction_date: string;  // The date of the transaction
  user_id: User;  // The user associated with the transaction
}

interface TransactionGroup {
  date: string;
  total: number;
  transactions: Transaction[];
}

const Transaction = () => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactionsGroupedByDate, setTransactionsGroupedByDate] = useState<TransactionGroup[]>([]);
  const [userID, setUserID] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Format VND currency
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('₫', 'VNĐ');
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const weekday = d.toLocaleString('default', { weekday: 'long' });
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return { day, month, year, weekday };
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + increment);
  
    // Prevent future months
    if (newDate > new Date()) {
      setErrorModalMessage('You cannot select a future month.');
      setErrorModalVisible(true);
      return;
    }
  
    setCurrentDate(newDate);
  };

  const fetchUserID = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserID(user.$id); // Set the user ID
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  // Function to fetch transactions
  const fetchTransactions = async (forceRefresh = false) => {
    try {
      if (userID) {
        console.log('Transaction: Fetching transactions for user:', userID, 'forceRefresh:', forceRefresh);
        const allTransactions = await getTransactions(userID, forceRefresh); // Fetch all transactions for the user
        setTransactions(allTransactions); // Store all transactions
        console.log('Transaction: Transactions fetched:', allTransactions.length);
      }
    } catch (error) {
      console.error('Transaction: Error fetching transactions:', error);
    }
  };

  // Manual refresh function
  const manualRefresh = async () => {
    if (!userID) return;
    
    setIsRefreshing(true);
    console.log('Transaction: Manual refresh triggered with force=true');
    
    try {
      await fetchTransactions(true); // Force refresh
      console.log('Transaction: Manual refresh completed');
    } catch (error) {
      console.error('Transaction: Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to filter transactions by selected month
  const filterTransactionsByMonth = (allTransactions: Transaction[], date: Date): Transaction[] => {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    return allTransactions.filter(transaction => {
      const txDate = new Date(transaction.transaction_date);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });
  };

  // Function to group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]): TransactionGroup[] => {
    const grouped: { [key: string]: TransactionGroup } = {};

    transactions.forEach((transaction) => {
      const date = transaction.transaction_date.split('T')[0]; // Get date without time (ISO format)
      if (!grouped[date]) {
        grouped[date] = { date, total: 0, transactions: [] };
      }
      grouped[date].transactions.push(transaction);
      grouped[date].total += transaction.is_income ? transaction.amount : -transaction.amount;
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  useEffect(() => {
    fetchUserID(); // Fetch user ID when the component mounts
  }, []);

  useEffect(() => {
    if (userID) {
      fetchTransactions(); // Fetch transactions after userID is available
    }
  }, [userID]);

  useEffect(() => {
    const filtered = filterTransactionsByMonth(transactions, currentDate);
    const grouped = groupTransactionsByDate(filtered);
    setTransactionsGroupedByDate(grouped);
  }, [transactions, currentDate]);

  // Use useIsFocused to trigger refresh when screen becomes active
  useEffect(() => {
    if (isFocused && userID) {
      console.log('Transaction: Screen is focused, triggering refresh...');
      manualRefresh();
    }
  }, [isFocused, userID]);

  // Backup useFocusEffect
  useFocusEffect(
    useCallback(() => {
      console.log('Transaction: useFocusEffect triggered');
      if (userID) {
        const refreshData = async () => {
          try {
            await fetchTransactions(true);
            console.log('Transaction: useFocusEffect refresh completed');
          } catch (error) {
            console.error('Transaction: useFocusEffect refresh error:', error);
          }
        };
        
        refreshData();
      }
    }, [userID])
  );

  // Listen for transaction update events
  useEffect(() => {
    const listener = EventRegister.addEventListener(
      TRANSACTION_UPDATED_EVENT, 
      (data) => {
        console.log('Transaction: Received update event:', data);
        if (userID) {
          manualRefresh();
        }
      }
    ) as string;
    
    return () => {
      EventRegister.removeEventListener(listener);
    };
  }, [userID]);

  // Handles tapping on a transaction row
  const handleTransactionPress = (transaction: Transaction) => {
    addDebugLog(`ACTION_START: User pressed transaction "${transaction.name}"`);
    setSelectedTransaction(transaction);
    setShowActionModal(true);
  };

  // Handles DISMISSING the ActionModal (tapping outside)
  const handleDismissActionModal = () => {
    addDebugLog('ACTION_CANCEL: User dismissed the action modal.');
    setShowActionModal(false);
    setSelectedTransaction(null); // Clean up state
    setShowDeleteConfirm(false); // Also ensure delete confirm is closed
  };

  // Handles the "Edit" button press from the ActionModal
  const handleEditAction = () => {
    if (!selectedTransaction) {
      addDebugLog('EDIT_ERROR: "Edit" pressed but no transaction was selected.');
      return;
    }
    const transactionToEdit = { ...selectedTransaction }; // Make a copy before clearing state
    
    addDebugLog(`ACTION_CONFIRM: User chose to edit "${transactionToEdit.name}".`);
    
    // Close modal FIRST
    setShowActionModal(false);
    setSelectedTransaction(null);
    
    // Navigate to the edit screen with transaction details
    router.push({
      pathname: '/edit-transaction',
      params: { transaction: JSON.stringify(transactionToEdit) }
    });
  };

  // Handles the "Delete" button press from the ActionModal
  const handleDeleteAction = () => {
    if (!selectedTransaction) {
      addDebugLog('DELETE_ERROR: "Delete" pressed but no transaction was selected.');
      return;
    }
    
    addDebugLog(`DELETE_CONFIRM_START: User chose to delete "${selectedTransaction.name}". Showing confirmation.`);
    
    // Hide ActionModal and show ConfirmModal
    setShowActionModal(false);
    setShowDeleteConfirm(true);
  };

  // Handles CANCELING the delete confirmation
  const handleCancelDelete = () => {
    addDebugLog('DELETE_CANCEL: User canceled the delete operation.');
    
    setShowDeleteConfirm(false);
    setSelectedTransaction(null); // Clean up state
  };
  
  // Actually DELETES the transaction after confirmation
  const confirmDeleteTransaction = async () => {
    if (!selectedTransaction) {
      addDebugLog('DELETE_ERROR: Confirmation received but no transaction was selected.');
      return;
    }
    
    const transactionToDelete = { ...selectedTransaction }; // Make a copy
    addDebugLog(`DELETE_CONFIRMED: Deleting transaction "${transactionToDelete.name}" (${transactionToDelete.$id}).`);

    setIsDeleting(true);

    try {
      await deleteTransaction(transactionToDelete.$id);
      addDebugLog(`DELETE_SUCCESS: Transaction "${transactionToDelete.name}" deleted.`);
      
      // Update local state to reflect deletion
      setTransactions(prev => prev.filter(t => t.$id !== transactionToDelete.$id));
      
      // Show success message
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      addDebugLog(`DELETE_FAILED: Error deleting transaction. Reason: ${error.message}`);
      
      setErrorModalMessage('Failed to delete transaction. Please try again.');
      setErrorModalVisible(true);
      
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setSelectedTransaction(null); // Clean up state
    }
  };

  const handleDateSelect = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const addDebugLog = (message: string) => {
    setDebugLogs(prevLogs => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLogs]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 my-5">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-black">Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Selector */}
      <View className='px-4'>
        <MonthSelector
          currentDate={currentDate}
          onChangeMonth={changeMonth}
          onDatePress={() => setShowDatePicker(true)}
        />
      </View>
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
      >
        {transactionsGroupedByDate.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500">No transactions found for this month.</Text>
          </View>
        ) : (
          transactionsGroupedByDate.map((group, index) => {
            const { day, month, year, weekday } = formatDateHeader(group.date);
            return (
              <View key={index} className="mb-6">
                {/* Date Header */}
                <View className="flex-row items-center justify-between mb-3 px-8">
                  <View className="flex-row items-center">
                    <Text className="text-3xl font-bold text-gray-800">{day}</Text>
                    <View className="ml-2">
                      <Text className="text-sm font-semibold text-gray-600">{weekday}</Text>
                      <Text className="text-xs text-gray-400">{month} {year}</Text>
                    </View>
                  </View>
                  <Text className={`font-bold ${group.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatVND(group.total)}
                  </Text>
                </View>
                
                {/* Transaction List */}
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 8,
                  overflow: 'hidden',
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }}>
                  {group.transactions.map((transaction, txIndex) => (
                    <TouchableOpacity 
                      key={transaction.$id} 
                      onPress={() => handleTransactionPress(transaction)}
                      activeOpacity={0.7}
                    >
                      <View 
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          borderBottomWidth: txIndex < group.transactions.length - 1 ? 1 : 0,
                          borderBottomColor: '#e5e7eb'
                        }}
                      >
                        <View 
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: transaction.category_id?.color || '#cccccc',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 1,
                            elevation: 1
                          }}
                        >
                          <Ionicons 
                            name={(transaction.category_id?.icon as any) || 'help-circle'}
                            size={20} 
                            color="white" 
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Text 
                            style={{ 
                              fontWeight: '600', 
                              color: '#1f2937', 
                              fontSize: 16,
                              marginBottom: 2
                            }} 
                            numberOfLines={1}
                          >
                            {transaction.name}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#6b7280' }}>
                            {transaction.category_id?.name || 'Uncategorized'}
                          </Text>
                        </View>
                        <Text style={{ 
                          fontWeight: 'bold',
                          fontSize: 16,
                          color: transaction.is_income ? '#22c55e' : '#ef4444'
                        }}>
                          {transaction.is_income ? '+' : '-'}{formatVND(transaction.amount)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Action Modal */}
      <ActionModal
        visible={showActionModal}
        onClose={handleDismissActionModal}
        title={selectedTransaction?.name || 'Transaction'}
        transactionDetails={selectedTransaction ? {
          categoryName: selectedTransaction.category_id.name,
          amount: selectedTransaction.amount,
          isIncome: selectedTransaction.is_income
        } : undefined}
        actions={[
          {
            label: 'Edit',
            icon: 'pencil',
            color: '#3b82f6',
            onPress: handleEditAction,
            subtitle: 'Change transaction details',
          },
          {
            label: 'Delete',
            icon: 'trash-outline',
            color: '#ef4444',
            onPress: handleDeleteAction,
            subtitle: 'Permanently remove',
          },
        ]}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${selectedTransaction?.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={confirmDeleteTransaction}
        onCancel={handleCancelDelete}
      />
      
      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message="Transaction deleted successfully!"
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        message={errorModalMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        currentDate={currentDate}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
      />

      {/* Debug Modal */}
      <Modal
        visible={showDebugModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDebugModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', height: '50%', padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Debug Logs</Text>
            <ScrollView style={{ flex: 1, marginTop: 8 }}>
              {debugLogs.map((log, index) => (
                <Text key={index} style={{ fontFamily: 'monospace', fontSize: 10 }}>{log}</Text>
              ))}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setShowDebugModal(false)}
              style={{ backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default Transaction;