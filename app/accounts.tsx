import { Ionicons } from '@expo/vector-icons';
import { Ionicons as IconType } from '@expo/vector-icons/build/Icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserAccounts } from '../lib/appwrite';

interface Account {
  $id: string;
  name: string;
  balance: number;
}

const Accounts = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Text className={`text-3xl font-bold ${calculateTotalBalance() < 0 ? 'text-red-500' : 'text-blue-600'}`}>
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
                    className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
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
      </SafeAreaView>
    </>
  );
};

export default Accounts; 