import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionModal from '../components/ActionModal';
import ConfirmModal from '../components/ConfirmModal';
import SuccessModal from '../components/SuccessModal';
import { getCurrentUser, getTransactions } from '../lib/appwrite';
import { Transaction, TRANSACTION_UPDATED_EVENT, useTransactionActions } from '../lib/hooks/useTransactionActions';

const getAccountIcon = (name) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('wallet')) return 'wallet-outline';
  if (lowerName.includes('cash')) return 'cash-outline';
  if (lowerName.includes('card') || lowerName.includes('credit')) return 'card-outline';
  if (lowerName.includes('savings')) return 'card-outline';
  if (lowerName.includes('checking')) return 'business-outline';
  return 'wallet-outline';
};

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('₫', 'VNĐ');
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const AccountTransactions = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    actionModalVisible,
    selectedTransaction,
    showDeleteConfirm,
    showSuccessModal,
    deleting,
    handleTransactionPress,
    closeActionModal,
    closeDeleteConfirm,
    closeSuccessModal,
    confirmDeleteTransaction,
    getActionModalActions,
  } = useTransactionActions({
    onDeleteSuccess: () => {
      if (account) fetchTransactionsForAccount(account);
    }
  });

  useEffect(() => {
    if (params.account) {
      try {
        const acc = JSON.parse(params.account as string);
        setAccount(acc);
        fetchTransactionsForAccount(acc);
      } catch (e) {
        setAccount(null);
      }
    }
  }, [params.account]);

  // Listen for transaction update events
  useEffect(() => {
    const listener = EventRegister.addEventListener(
      TRANSACTION_UPDATED_EVENT, 
      (data) => {
        console.log('AccountTransactions: Received update event:', data);
        if (account) {
          fetchTransactionsForAccount(account);
        }
      }
    ) as string;
    
    return () => {
      EventRegister.removeEventListener(listener);
    };
  }, [account]);

  const fetchTransactionsForAccount = async (acc) => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      const all = await getTransactions(user.$id);
      const filtered = all.filter(tx => tx.account_id && tx.account_id.$id === acc.$id);
      setTransactions(filtered);
    } catch (e) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 85 : 20 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Money Source Details</Text>
          </View>

          {/* Account Info Card */}
          <View style={styles.accountInfoCard}>
            <View style={styles.accountHeader}>
              <View style={styles.accountIcon}>
                <Ionicons name={getAccountIcon(account?.name)} size={24} color="#059669" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account?.name}</Text>
                <Text style={styles.accountBalance}>{formatVND(account?.balance || 0)}</Text>
                <Text style={styles.accountTxCount}>{transactions.length} transactions</Text>
              </View>
            </View>
          </View>

          {/* Transactions List */}
          <Text style={styles.transactionsTitle}>Transactions</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No transactions found for this money source.</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((tx) => (
                <TouchableOpacity key={tx.$id} style={styles.transactionItem} onPress={() => handleTransactionPress(tx)} activeOpacity={0.7}>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.accountIconSmall}>
                        <Ionicons name={getAccountIcon(account?.name)} size={20} color="#059669" />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionName} numberOfLines={1}>{tx.name}</Text>
                        <Text style={styles.transactionMeta}>{formatDate(tx.transaction_date)}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={[styles.transactionAmount, { color: tx.is_income ? '#22C55E' : '#EF4444' }] }>
                        {tx.is_income ? '+' : '-'}{formatVND(tx.amount)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        {/* Action Modal */}
        <ActionModal
          visible={actionModalVisible}
          onClose={closeActionModal}
          title={selectedTransaction?.name || ''}
          transactionDetails={selectedTransaction ? {
            categoryName: selectedTransaction.category_id?.name,
            amount: selectedTransaction.amount,
            isIncome: selectedTransaction.is_income
          } : undefined}
          actions={getActionModalActions()}
        />
        {/* Confirm Delete Modal */}
        <ConfirmModal
          visible={showDeleteConfirm}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          confirmText={deleting ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          onConfirm={confirmDeleteTransaction}
          onCancel={closeDeleteConfirm}
          confirmButtonColor="#dc2626"
        />
        <SuccessModal
          visible={showSuccessModal}
          onClose={closeSuccessModal}
          title="Deleted Successfully!"
          message="Transaction deleted successfully!"
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
  accountInfoCard: {
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
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  accountIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  accountInfo: {
    marginLeft: 16,
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 2,
  },
  accountTxCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
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
  accountIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
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
    fontSize: 12,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AccountTransactions; 