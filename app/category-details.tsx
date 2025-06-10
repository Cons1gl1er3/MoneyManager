import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionModal from '../components/ActionModal';
import ErrorModal from '../components/ErrorModal';
import { deleteTransaction, getCurrentUser, getTransactions } from '../lib/appwrite';

interface Transaction {
  $id: string;
  name: string;
  amount: number;
  is_income: boolean;
  transaction_date: string;
  category_id: {
    $id: string;
    name: string;
    icon: string;
    color: string;
  };
  account_id: {
    $id: string;
    name: string;
  };
}

const CategoryDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // URL parameters
  const categoryId = params.categoryId as string;
  const categoryName = params.categoryName as string;
  const categoryIcon = params.categoryIcon as string;
  const categoryColor = params.categoryColor as string;
  const month = params.month as string; // Format: "2025-05"
  const isIncome = params.isIncome === 'true';
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [userID, setUserID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  
  // Action Modal states
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format month display
  const formatMonthDisplay = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Fetch user ID
  const fetchUserID = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserID(user.$id);
      }
    } catch (error) {
      console.error('CategoryDetails: Error fetching user ID:', error);
      setErrorModalMessage('Failed to load user data.');
      setErrorModalVisible(true);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!userID) return;
    
    try {
      console.log('CategoryDetails: Fetching transactions for user:', userID);
      const transactionsData = await getTransactions(userID, true);
      setTransactions(transactionsData);
      console.log('CategoryDetails: Fetched', transactionsData.length, 'transactions');
    } catch (error) {
      console.error('CategoryDetails: Error fetching transactions:', error);
      setErrorModalMessage('Failed to load transactions.');
      setErrorModalVisible(true);
    }
  };

  // Filter transactions by category and month
  const filterTransactions = useCallback(() => {
    if (!month || !categoryId) return;
    
    const [year, monthNum] = month.split('-');
    const targetYear = parseInt(year);
    const targetMonth = parseInt(monthNum) - 1; // JavaScript months are 0-indexed
    
    const filtered = transactions.filter(transaction => {
      const txDate = new Date(transaction.transaction_date);
      return (
        transaction.category_id.$id === categoryId &&
        transaction.is_income === isIncome &&
        txDate.getFullYear() === targetYear &&
        txDate.getMonth() === targetMonth
      );
    });
    
    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    
    setFilteredTransactions(filtered);
    console.log('CategoryDetails: Filtered', filtered.length, 'transactions for category', categoryName);
  }, [transactions, categoryId, month, isIncome, categoryName]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchUserID();
      setIsLoading(false);
    };
    
    loadInitialData();
  }, []);

  // Fetch transactions when user ID is available
  useEffect(() => {
    if (userID) {
      fetchTransactions();
    }
  }, [userID]);

  // Filter transactions when data changes
  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  // Calculate total amount
  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  // Handle transaction long press
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setActionModalVisible(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await deleteTransaction(selectedTransaction.$id);
      setActionModalVisible(false);
      setSelectedTransaction(null);
      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('CategoryDetails: Error deleting transaction:', error);
      setErrorModalMessage('Failed to delete transaction.');
      setErrorModalVisible(true);
    }
  };

  // Handle edit transaction
  const handleEditTransaction = () => {
    if (!selectedTransaction) return;

    setActionModalVisible(false);
    router.push({
      pathname: '/edit-transaction',
      params: { transactionId: selectedTransaction.$id }
    });
  };

  const actionModalActions = selectedTransaction ? [
    {
      label: 'Edit Transaction',
      icon: 'pencil',
      color: '#3b82f6',
      onPress: handleEditTransaction,
      subtitle: 'Modify transaction details'
    },
    {
      label: 'Delete Transaction',
      icon: 'trash',
      color: '#ef4444',
      onPress: handleDeleteTransaction,
      subtitle: 'Remove this transaction permanently'
    }
  ] : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 85 : 20 }}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Category Details</Text>
        </View>

        {/* Category Info Card */}
        <View style={styles.categoryInfoCard}>
          <View style={styles.categoryHeader}>
            <View
              style={[styles.categoryIcon, { backgroundColor: categoryColor }]}
            >
              <Ionicons name={categoryIcon as any} size={24} color="white" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{categoryName}</Text>
              <Text style={styles.categoryMonth}>{formatMonthDisplay(month)}</Text>
              <Text style={styles.categoryType}>
                {isIncome ? 'Income' : 'Expense'} • {filteredTransactions.length} transactions
              </Text>
            </View>
          </View>
          <Text style={[
            styles.totalAmount,
            { color: isIncome ? '#16a34a' : '#dc2626' }
          ]}>
            {formatVND(totalAmount)}
          </Text>
        </View>

        {/* Transactions List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              No transactions found for this category in {formatMonthDisplay(month)}.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.$id}
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    {/* Category icon */}
                    <View
                      style={[styles.categoryIconSmall, { backgroundColor: categoryColor }]}
                    >
                      <Ionicons
                        name={categoryIcon as any}
                        size={20}
                        color="white"
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName} numberOfLines={1}>
                        {transaction.name}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Ionicons name="list-circle-outline" size={14} color="#22C55E" />
                        <Text style={styles.transactionAccount}>
                          {transaction.account_id.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: isIncome ? '#22C55E' : '#EF4444' }
                    ]}>
                      {isIncome ? '+' : '-'}{formatVND(transaction.amount)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {transaction.transaction_date.split('T')[0]}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        message={errorModalMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      {/* Action Modal */}
      <ActionModal
        visible={actionModalVisible}
        onClose={() => {
          setActionModalVisible(false);
          setSelectedTransaction(null);
        }}
        title={selectedTransaction?.name || ''}
        transactionDetails={selectedTransaction ? {
          categoryName: selectedTransaction.category_id.name,
          amount: selectedTransaction.amount,
          isIncome: selectedTransaction.is_income
        } : undefined}
        actions={actionModalActions}
      />
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 16,
  },
  categoryInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    marginLeft: 16,
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  categoryMonth: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 14,
    color: '#9ca3af',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  transactionsList: {
    marginBottom: 24,
  },
  transactionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  categoryIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAccount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategoryDetails; 