import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePickerModal from '../../components/DatePickerModal';
import ErrorModal from '../../components/ErrorModal';
import FloatingActionButton from '../../components/FloatingActionButton';
import MonthSelector from '../../components/MonthSelector';
import { getCategories, getCurrentUser, getTransactions } from '../../lib/appwrite';
import { TRANSACTION_UPDATED_EVENT } from '../../lib/hooks/useTransactionActions';
// import PieChartComponent from '../../components/PieChart';

const screenWidth = Dimensions.get("window").width;

interface Category {
  $id: string;
  name: string;
  icon: string;
  color: string;
  is_income?: boolean;
}

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

interface CategorySpending {
  categoryId: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

const Categories = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [userID, setUserID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'income' | 'expense'>('expense');
  
  const total = categorySpending.reduce((sum, item) => sum + item.amount, 0);

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

  // Handle date selection from picker
  const handleDateSelect = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  // Fetch user ID
  const fetchUserID = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserID(user.$id);
      }
    } catch (error) {
      console.error('Categories: Error fetching user ID:', error);
      setErrorModalMessage('Failed to load user data.');
      setErrorModalVisible(true);
    }
  };

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      console.log('Categories: Fetching categories...');
      const categoriesData = await getCategories();
      // Map the database documents to our Category interface
      const mappedCategories: Category[] = categoriesData.map(doc => ({
        $id: doc.$id,
        name: doc.name,
        icon: doc.icon,
        color: doc.color,
        is_income: doc.is_income || false // Default to expense (false) for backward compatibility
      }));
      setCategories(mappedCategories);
      console.log('Categories: Fetched', mappedCategories.length, 'categories');
    } catch (error) {
      console.error('Categories: Error fetching categories:', error);
      setErrorModalMessage('Failed to load categories.');
      setErrorModalVisible(true);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!userID) return;
    
    try {
      console.log('Categories: Fetching transactions for user:', userID);
      const transactionsData = await getTransactions(userID, true);
      setTransactions(transactionsData);
      console.log('Categories: Fetched', transactionsData.length, 'transactions');
    } catch (error) {
      console.error('Categories: Error fetching transactions:', error);
      setErrorModalMessage('Failed to load transactions.');
      setErrorModalVisible(true);
    }
  };

  // Filter transactions by selected month and calculate spending per category
  const calculateCategorySpending = () => {
    console.log('Categories: Calculating spending for', currentDate.toISOString().substring(0, 7), 'viewType:', viewType);
    
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const isIncomeView = viewType === 'income';
    
    // Filter transactions for the selected month and type
    const monthTransactions = transactions.filter(transaction => {
      const txDate = new Date(transaction.transaction_date);
      return (
        txDate.getMonth() === month &&
        txDate.getFullYear() === year &&
        transaction.is_income === isIncomeView
      );
    });

    console.log('Categories: Found', monthTransactions.length, `${viewType} transactions for this month`);

    // Filter categories by type (is_income)
    const relevantCategories = categories.filter(category => 
      category.is_income === isIncomeView
    );

    // Group transactions by category and sum amounts
    const categorySpendingMap = new Map<string, CategorySpending>();

    // Initialize relevant categories with 0 spending
    relevantCategories.forEach(category => {
      categorySpendingMap.set(category.$id, {
        categoryId: category.$id,
        name: category.name,
        amount: 0,
        color: category.color,
        icon: category.icon,
        percentage: 0
      });
    });

    // Add spending amounts
    monthTransactions.forEach(transaction => {
      const categoryId = transaction.category_id.$id;
      const existing = categorySpendingMap.get(categoryId);
      
      if (existing) {
        existing.amount += transaction.amount;
      }
    });

    // Calculate total for percentage calculation
    const totalAmount = Array.from(categorySpendingMap.values())
      .reduce((sum, item) => sum + item.amount, 0);

    // Convert to array, calculate percentages, and filter out categories with 0 spending for display
    const spendingArray = Array.from(categorySpendingMap.values())
      .map(item => ({
        ...item,
        percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    setCategorySpending(spendingArray);
    console.log('Categories: Calculated spending for', spendingArray.length, 'categories');
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchUserID();
      await fetchCategories();
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

  // Recalculate spending when transactions, categories, date, or view type changes
  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      calculateCategorySpending();
    }
  }, [transactions, categories, currentDate, viewType]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Categories: Screen focused, refreshing data...');
      if (userID) {
        fetchTransactions();
      }
    }, [userID])
  );
  
  // Listen for transaction update events
  useEffect(() => {
    const listener = EventRegister.addEventListener(
      TRANSACTION_UPDATED_EVENT, 
      (data) => {
        console.log('Categories: Received update event:', data);
        if (userID) {
          fetchTransactions();
        }
      }
    ) as string;
    
    return () => {
      EventRegister.removeEventListener(listener);
    };
  }, [userID]);

  // Create chart data for pie chart (if enabled)
  const chartData = categorySpending.map((item) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 85 : 20 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 my-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-black">Categories</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector */}
        <MonthSelector 
          currentDate={currentDate} 
          onChangeMonth={changeMonth}
          onDatePress={() => setShowDatePicker(true)}
        />

        {/* Income/Expense Toggle - Updated to match add-transaction style */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            onPress={() => setViewType('expense')}
            style={[
              styles.toggleButton,
              { backgroundColor: viewType === 'expense' ? '#dc2626' : '#e5e7eb' },
            ]}
          >
            <Text style={[
              styles.toggleButtonText, 
              { color: viewType === 'expense' ? 'white' : '#374151' }
            ]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewType('income')}
            style={[
              styles.toggleButton,
              { backgroundColor: viewType === 'income' ? '#16a34a' : '#e5e7eb' },
            ]}
          >
            <Text style={[
              styles.toggleButtonText, 
              { color: viewType === 'income' ? 'white' : '#374151' }
            ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>
            {viewType === 'income' ? 'Total Income' : 'Total Spending'}
          </Text>
          <Text style={[
            styles.totalAmount,
            { color: viewType === 'income' ? '#16a34a' : '#dc2626' }
          ]}>
            {formatVND(total)}
          </Text>
          <View style={styles.chartContainer}>
            {/* <PieChartComponent
              data={chartData}
              width={screenWidth * 0.7}
              height={180}
              accessor="population"
              absolute
              center={[10, 0]}
            /> */}
          </View>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : categorySpending.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {viewType === 'income' ? 'income' : 'expenses'} found for this month.
            </Text>
          </View>
        ) : (
          /* Category Grid - Updated with white background */
          <View style={styles.categoryGrid}>
            {categorySpending.map((item, index) => (
              <TouchableOpacity
                key={item.categoryId}
                style={styles.categoryCard}
                onPress={() => {
                  const monthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                  router.push({
                    pathname: '/category-details',
                    params: {
                      categoryId: item.categoryId,
                      categoryName: item.name,
                      categoryIcon: item.icon,
                      categoryColor: item.color,
                      month: monthString,
                      isIncome: viewType === 'income' ? 'true' : 'false'
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeader}>
                  <View
                    style={[styles.categoryIcon, { backgroundColor: item.color }]}
                  >
                    <Ionicons name={item.icon as any} size={20} color="white" />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.categoryPercentage}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.categoryAmount,
                  { color: viewType === 'income' ? '#16a34a' : '#dc2626' }
                ]}>
                  {formatVND(item.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <FloatingActionButton />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Toggle buttons matching add-transaction style
  toggleContainer: {
    flexDirection: 'row',
    gap: Platform.OS === 'web' ? 16 : 8,
    marginBottom: Platform.OS === 'web' ? 20 : 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontWeight: '600',
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
  totalContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 16,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
  },
  emptyContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  // Category grid with white cards
  categoryGrid: {
    marginTop: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff', // White background like Home page
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Add subtle shadow for better visual separation
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Categories;