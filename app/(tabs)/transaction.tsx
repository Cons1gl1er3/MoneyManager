import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessModal from '../../components/SuccessModal';
import { deleteTransaction, getCurrentUser, getTransactions } from '../../lib/appwrite'; // Assuming you have a function to fetch transactions

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactionsGroupedByDate, setTransactionsGroupedByDate] = useState<TransactionGroup[]>([]);
  const [userID, setUserID] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Platform-specific styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      marginVertical: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
    },
    refreshButton: {
      padding: 8,
    },
    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginVertical: 24,
    },
    monthInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    monthText: {
      fontSize: 18,
      marginLeft: 8,
      color: '#000000',
    },
    monthControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    monthButton: {
      marginHorizontal: 16,
    },
         fab: {
       position: 'absolute',
       bottom: Platform.OS === 'web' ? 24 : 24,
       right: 24,
       backgroundColor: '#3B82F6',
       paddingVertical: 16,
       paddingHorizontal: 16,
       borderRadius: 50,
       elevation: 8,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.3,
       shadowRadius: 8,
     },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
    },
    modalHandle: {
      width: 48,
      height: 4,
      backgroundColor: '#D1D5DB',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1F2937',
      textAlign: 'center',
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionTextContainer: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 4,
    },
    actionDescription: {
      fontSize: 14,
      color: '#6B7280',
    },
    cancelButton: {
      backgroundColor: '#F3F4F6',
      marginTop: 8,
    },
    cancelButtonText: {
      color: '#6B7280',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '500',
    },
    confirmButton: {
      backgroundColor: '#DC2626',
      marginTop: 12,
    },
    confirmButtonText: {
      color: '#ffffff',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });

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
      alert("You cannot select a future month.");
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

  // Handle transaction item press
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowActionModal(true);
  };

  // Handle edit transaction
  const handleEditTransaction = () => {
    if (selectedTransaction) {
      setShowActionModal(false);
      router.push(`/edit-transaction?transaction=${encodeURIComponent(JSON.stringify(selectedTransaction))}`);
    }
  };

  // Handle delete transaction with confirmation
  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    setShowActionModal(false);
    setShowDeleteConfirm(true);
  };

  // Confirm delete transaction
  const confirmDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    setShowDeleteConfirm(false);
    try {
      console.log('Frontend: Starting transaction deletion for ID:', selectedTransaction.$id);
      const result = await deleteTransaction(selectedTransaction.$id);
      console.log('Frontend: Delete result:', result);
      
      // Refresh transactions after deletion
      await fetchTransactions(true);
      setShowSuccessModal(true); // Show success modal instead of alert
      
    } catch (error) {
      console.error('Frontend: Error deleting transaction:', error);
      Alert.alert('Error', `Failed to delete transaction: ${error.message || 'Unknown error occurred'}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transaction</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              onPress={manualRefresh} 
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              <Ionicons 
                name="refresh-outline" 
                size={24} 
                color={isRefreshing ? "#9CA3AF" : "#3B82F6"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshButton}>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <View style={styles.monthInfo}>
            <Ionicons name="calendar-outline" size={20} color="#000" />
            <Text style={styles.monthText}>
              {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
            </Text>
          </View>
          <View style={styles.monthControls}>
            <TouchableOpacity 
              style={styles.monthButton} 
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.monthButton}>
              <Ionicons name="menu" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Render Transactions */}
        {transactionsGroupedByDate.length > 0 ? (
          transactionsGroupedByDate.map((group, index) => {
            const { day, month, year, weekday } = formatDateHeader(group.date);
            return (
              <View key={index} style={{ marginBottom: 24, paddingHorizontal: 12 }}>
                {/* Date Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                  paddingBottom: 4,
                  marginBottom: 12,
                }}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                      }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#000' }}>
                          {day}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 12, color: '#000', fontWeight: '600' }}>
                          {month} {year}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#000', fontWeight: '600' }}>
                          {weekday}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ marginRight: 12 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: group.total >= 0 ? '#059669' : '#DC2626',
                    }}>
                      {group.total >= 0 ? '+' : '-'}
                      {new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                      }).format(Math.abs(group.total)).replace('₫', 'VNĐ')}
                    </Text>
                  </View>
                </View>

                {/* Transactions */}
                <View style={{ gap: 12 }}>
                  {group.transactions.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#F9FAFB',
                        padding: 12,
                        borderRadius: 8,
                      }}
                      onPress={() => handleTransactionPress(item)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Category icon */}
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: item.category_id.color,
                          }}
                        >
                          <Ionicons
                            name={item.category_id.icon as any}
                            size={20}
                            color="white"
                          />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontWeight: '500', color: '#000' }}>
                            {item.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="list-circle-outline" size={14} color="#22C55E" />
                            <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
                              {item.account_id.name}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                          fontWeight: 'bold',
                          fontSize: 16,
                          color: item.is_income ? '#22C55E' : '#EF4444',
                        }}>
                          {item.is_income ? '+' : '-'}
                          {new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND' 
                          }).format(item.amount).replace('₫', 'VNĐ')}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                          {item.transaction_date.split('T')[0]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        ) : (
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            minHeight: 200,
          }}>
            <Text style={{ color: '#6B7280', fontSize: 18 }}>
              No transactions for this month.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/add-transaction')}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showActionModal}
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Manage Transaction</Text>
            {selectedTransaction && (
              <Text style={styles.modalSubtitle}>
                {selectedTransaction.name}
              </Text>
            )}

            {/* Edit Button */}
            <TouchableOpacity
              onPress={handleEditTransaction}
              style={[styles.actionButton, { backgroundColor: '#EBF8FF' }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="pencil" size={20} color="#3B82F6" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit</Text>
                <Text style={styles.actionDescription}>Update transaction details</Text>
              </View>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDeleteTransaction}
              style={[styles.actionButton, { backgroundColor: '#FEF2F2' }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FECACA' }]}>
                <Ionicons name="trash" size={20} color="#DC2626" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: '#DC2626' }]}>Delete</Text>
                <Text style={styles.actionDescription}>Remove this transaction</Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowActionModal(false)}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteConfirm}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginHorizontal: 24, borderRadius: 16 }]}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="warning" size={32} color="#DC2626" />
              </View>
              <Text style={[styles.modalTitle, { marginBottom: 8 }]}>
                Delete Transaction
              </Text>
              <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </Text>
            </View>

            <TouchableOpacity
              onPress={confirmDeleteTransaction}
              style={[styles.actionButton, styles.confirmButton]}
            >
              <Text style={styles.confirmButtonText}>Delete Transaction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(false)}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal for Deletion */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Transaction has been deleted successfully!"
      />

      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default Transaction;