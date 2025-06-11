import { Ionicons } from '@expo/vector-icons';
import { Ionicons as IconType } from '@expo/vector-icons/build/Icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionModal from '../components/ActionModal';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { deleteAccount, getUserAccounts } from '../lib/appwrite';

interface Account {
  $id: string;
  name: string;
  balance: number;
}

const Accounts = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Map account names to icons
  const getAccountIcon = (name: string): keyof typeof IconType.glyphMap => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wallet')) return 'wallet-outline';
    if (lowerName.includes('cash')) return 'cash-outline';
    if (lowerName.includes('card') || lowerName.includes('credit')) return 'card-outline';
    if (lowerName.includes('savings')) return 'card-outline';
    if (lowerName.includes('checking')) return 'business-outline';
    return 'wallet-outline';
  };

  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('₫', 'VNĐ');
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const userAccounts = await getUserAccounts();
      setAccounts(userAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [])
  );

  const calculateTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  // Handle edit account
  const handleEditAccount = (account: Account) => {
    // Close the modal first
    setShowActionModal(false);
    setSelectedAccount(null);
    
    // Then navigate to edit page
    router.push({
      pathname: '/edit-account',
      params: { account: JSON.stringify(account) }
    });
  };

  // Handle account click to show action modal
  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setShowActionModal(true);
  };

  // Handle delete account
  const handleDeleteAccount = (account: Account) => {
    // Check if it's the default account
    if (account.name === 'Tiền mặt') {
      setErrorModalMessage('Cannot delete the default money source.');
      setErrorModalVisible(true);
      setShowActionModal(false); // Close action modal even if error
      return;
    }
    
    // First, close the action modal
    setShowActionModal(false);
    
    // Then, set the account to delete and show the confirm modal after a short delay
    // This helps prevent modal-on-modal issues on iOS
    setTimeout(() => {
      setAccountToDelete(account);
      setShowDeleteConfirm(true);
    }, 300);
  };

  // Confirm delete account
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount(accountToDelete.$id);
      
      // Close all modals first
      setShowDeleteConfirm(false);
      setShowActionModal(false);
      setSelectedAccount(null);
      setAccountToDelete(null);
      
      // Refresh data
      await fetchAccounts();
      
      // Show success message after a brief delay to ensure modals are closed
      setTimeout(() => {
        setSuccessMessage(`Money source "${accountToDelete.name}" has been deleted and all transactions transferred to "Tiền mặt".`);
        setShowSuccessModal(true);
      }, 100);
    } catch (error) {
      console.error('Error deleting account:', error);
      setErrorModalMessage(error.message || 'Failed to delete money source. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center px-4 pt-4 mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 bg-gray-100 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold flex-1">All Money Sources</Text>
            <TouchableOpacity onPress={() => router.push('/add-account')}>
              <Ionicons name="add" size={28} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Total Balance Card */}
          <View className="mx-4 mb-6 bg-blue-50 p-6 rounded-xl">
            <Text className="text-lg text-gray-600 mb-2">Total Balance</Text>
            <Text className={`text-3xl font-bold ${calculateTotalBalance() < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatVND(calculateTotalBalance())}
            </Text>
          </View>

          {/* Accounts List */}
          <ScrollView className="flex-1 px-4">
            {loading ? (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-500">Loading money sources...</Text>
              </View>
            ) : accounts.length > 0 ? (
              <View className="space-y-4">
                {accounts.map(account => (
                  <TouchableOpacity 
                    key={account.$id} 
                    className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm active:bg-gray-50"
                    onPress={() => handleAccountClick(account)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="bg-blue-100 p-3 rounded-full mr-4">
                          <Ionicons
                            name={getAccountIcon(account.name)}
                            size={24}
                            color="#3B82F6"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-gray-800">
                            {account.name}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="items-end">
                        <Text className={`text-xl font-bold ${account.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {formatVND(account.balance)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-16">
                <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
                <Text className="text-xl text-gray-500 mt-4 mb-2">
                  No money sources found.
                </Text>
                <Text className="text-gray-400 text-center mb-6">
                  Create your first money source to get started!
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/add-account')}
                  className="bg-blue-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">
                    Add Money Source
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* Action Modal */}
        <ActionModal
          visible={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedAccount(null);
          }}
          title={selectedAccount?.name || ''}
          balance={selectedAccount?.balance}
          actions={[
            {
              label: 'View Detail',
              subtitle: 'View all transactions for this money source',
              icon: 'eye',
              color: '#0ea5e9',
              onPress: () => {
                if (selectedAccount) {
                  setShowActionModal(false);
                  router.push({
                    pathname: '/account-transactions',
                    params: { account: JSON.stringify(selectedAccount) }
                  });
                }
              }
            },
            {
              label: 'Edit',
              subtitle: 'Update money source details',
              icon: 'pencil',
              color: '#2563eb',
              onPress: () => {
                if (selectedAccount) {
                  handleEditAccount(selectedAccount);
                }
              }
            },
            {
              label: 'Delete',
              subtitle: 'Remove this money source',
              icon: 'trash',
              color: '#dc2626',
              onPress: () => {
                if (selectedAccount) {
                  handleDeleteAccount(selectedAccount);
                }
              }
            }
          ]}
        />
        
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={showDeleteConfirm}
          title="Delete Money Source"
          message={`Are you sure you want to delete "${accountToDelete?.name}"? All transactions will be transferred to the default money source.`}
          confirmText={isDeleting ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          onConfirm={confirmDeleteAccount}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setAccountToDelete(null);
          }}
          confirmButtonColor="#dc2626"
        />

        {/* Error/Success Modal */}
        <ErrorModal
          visible={errorModalVisible}
          message={errorModalMessage}
          onClose={() => setErrorModalVisible(false)}
        />

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Deleted Successfully!"
          message={successMessage}
        />
      </SafeAreaView>
    </>
  );
};

export default Accounts; 