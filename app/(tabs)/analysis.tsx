import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePickerModal from '../../components/DatePickerModal';
import ErrorModal from '../../components/ErrorModal';
import FloatingActionButton from '../../components/FloatingActionButton';
import MonthSelector from '../../components/MonthSelector';
import { getCurrentUser, getTransactions } from '../../lib/appwrite';

const Analysis = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [userID, setUserID] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlySpending, setMonthlySpending] = useState(0);
    const [dailyAvgIncome, setDailyAvgIncome] = useState(0);
    const [dailyAvgSpending, setDailyAvgSpending] = useState(0);
    const [weeklyAvgIncome, setWeeklyAvgIncome] = useState(0);
    const [weeklyAvgSpending, setWeeklyAvgSpending] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount || 0).replace('₫', 'VNĐ');

    const changeMonth = (amount) => {
        const updated = new Date(selectedMonth);
        updated.setMonth(updated.getMonth() + amount);
        if (updated > new Date()) {
            setErrorModalMessage("You cannot select a future month.");
            setErrorModalVisible(true);
            return;
        }
        setSelectedMonth(updated);
    };

    const handleDateSelect = (newDate) => setSelectedMonth(newDate);

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.replace('/sign-in');
                return;
            }
            setUserID(user.$id);
            setIsLoading(true);
            const allTransactions = await getTransactions(user.$id, forceRefresh);
            setTransactions(allTransactions);
        } catch (error) {
            setErrorModalMessage('Failed to fetch data.');
            setErrorModalVisible(true);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, []);

    useFocusEffect(useCallback(() => {
        fetchData(true);
    }, [fetchData]));

    useEffect(() => {
        const filtered = transactions.filter(t => {
            const txDate = new Date(t.transaction_date);
            return txDate.getMonth() === selectedMonth.getMonth() && txDate.getFullYear() === selectedMonth.getFullYear();
        });
        
        const income = filtered.filter(tx => tx.is_income).reduce((sum, tx) => sum + tx.amount, 0);
        const spending = filtered.filter(tx => !tx.is_income).reduce((sum, tx) => sum + tx.amount, 0);
        
        setMonthlyIncome(income);
        setMonthlySpending(spending);
        
        const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
        setDailyAvgIncome(income / daysInMonth);
        setDailyAvgSpending(spending / daysInMonth);
        setWeeklyAvgIncome(income / 4.33);
        setWeeklyAvgSpending(spending / 4.33);
    }, [transactions, selectedMonth]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="px-4 pt-4 my-5">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-2xl font-bold text-black">Analysis</Text>
                        <TouchableOpacity onPress={() => router.push('/settings')}><Ionicons name="settings-outline" size={24} color="#000" /></TouchableOpacity>
                    </View>
                </View>

                <MonthSelector currentDate={selectedMonth} onChangeMonth={changeMonth} onDatePress={() => setShowDatePicker(true)} />
                
                <View className="px-4"><Text className="text-xl font-bold mb-4 mt-6">Monthly Financial Analysis</Text></View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#007AFF" className="my-10" />
                ) : (
                    <PieChartComponent income={monthlyIncome} spending={monthlySpending} formatVND={formatVND} />
                )}

                <View className="bg-white rounded-lg p-6 mx-4 my-4 shadow-sm">
                    <Text className="text-2xl font-bold mb-4">Average</Text>
                    <View className="flex-row justify-between mb-3 pb-2 border-b border-gray-200">
                        <Text className="text-sm font-medium text-gray-500 flex-1">Period</Text>
                        <View className="flex-row" style={{ gap: Platform.OS === 'web' ? 24 : 16 }}>
                            <View className='w-28 items-end'>
                                <Text className="text-sm font-medium text-green-500">Income</Text>
                            </View>
                            <View className='w-28 items-end'>
                                <Text className="text-sm font-medium text-red-500">Spending</Text>
                            </View>
                        </View>
                    </View>
                    <View className="flex-row justify-between mb-3">
                        <Text className="text-sm text-gray-600 flex-1">Day</Text>
                        <View className="flex-row" style={{ gap: Platform.OS === 'web' ? 24 : 16 }}>
                            <View className='w-28 items-end'>
                                <Text className="text-xs text-green-500 font-semibold">{formatVND(dailyAvgIncome)}</Text>
                            </View>
                            <View className='w-28 items-end'>
                                <Text className="text-xs text-red-500 font-semibold">{formatVND(dailyAvgSpending)}</Text>
                            </View>
                        </View>
                    </View>
                    <View className="flex-row justify-between mb-3">
                        <Text className="text-sm text-gray-600 flex-1">Week</Text>
                        <View className="flex-row" style={{ gap: Platform.OS === 'web' ? 24 : 16 }}>
                            <View className='w-28 items-end'>
                                <Text className="text-xs text-green-500 font-semibold">{formatVND(weeklyAvgIncome)}</Text>
                            </View>
                            <View className='w-28 items-end'>
                                <Text className="text-xs text-red-500 font-semibold">{formatVND(weeklyAvgSpending)}</Text>
                            </View>
                        </View>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600 flex-1">Month</Text>
                        <View className="flex-row" style={{ gap: Platform.OS === 'web' ? 24 : 16 }}>
                            <View className='w-28 items-end'>
                                <Text className="text-xs text-green-500 font-semibold">{formatVND(monthlyIncome)}</Text>
                            </View>
                            <View className='w-28 items-end'>
                                <Text className="text-xs text-red-500 font-semibold">{formatVND(monthlySpending)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <ErrorModal visible={errorModalVisible} message={errorModalMessage} onClose={() => setErrorModalVisible(false)} />
            <DatePickerModal visible={showDatePicker} currentDate={selectedMonth} onClose={() => setShowDatePicker(false)} onDateSelect={handleDateSelect} />
            <FloatingActionButton />
        </SafeAreaView>
    );
};

const PieChartComponent = ({ income, spending, formatVND }) => {
    const total = income + spending;
    const netTotal = income - spending;
    const [selectedSegment, setSelectedSegment] = useState(null);

    // Format dữ liệu theo API mới của thư viện
    const series = total > 0 
        ? [
            { value: spending, color: '#EF4444' }, // Spending first (red)
            { value: income, color: '#22C55E' },   // Income second (green)
          ] 
        : [{ value: 1, color: '#E5E7EB' }];       // Empty chart case
    
    const incomePercentage = total > 0 ? (income / total) * 100 : 0;
    const spendingPercentage = total > 0 ? (spending / total) * 100 : 0;

    // Hàm format chỉ lấy số, không có đơn vị
    const formatNumberOnly = (amount) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount || 0);

    // Xử lý sự kiện khi nhấn vào biểu đồ
    const handlePress = () => {
        if (selectedSegment === 'income') {
            setSelectedSegment('spending');
        } else if (selectedSegment === 'spending') {
            setSelectedSegment(null);
        } else {
            setSelectedSegment('income');
        }
    };

    return (
        <View className="px-4 mb-6">
            <View className="items-center justify-center">
                <View 
                    className="flex-row items-center w-full"
                    style={{ 
                        gap: Platform.OS === 'web' ? 24 : 16,
                        paddingHorizontal: Platform.OS === 'web' ? 16 : 0,
                    }}
                >
                    {/* Pie Chart Container */}
                    <TouchableOpacity 
                        onPress={handlePress} 
                        activeOpacity={0.8}
                        className="items-center justify-center flex-1"
                    >
                        <PieChart
                            widthAndHeight={160}
                            series={series}
                            cover={0.6}
                        />
                    </TouchableOpacity>
                    
                    {/* Net Total Container */}
                    <View 
                        className="bg-white rounded-lg p-4 shadow-sm flex-1"
                        style={{ 
                            minWidth: Platform.OS === 'web' ? 140 : 120,
                            maxWidth: Platform.OS === 'web' ? 180 : 160,
                        }}
                    >
                        <Text className="text-sm font-medium text-gray-500 text-center mb-2">Net Total</Text>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Text className={`text-xl font-bold text-center ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatNumberOnly(netTotal)}</Text>
                          <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 0, fontWeight: 'bold' }} className={netTotal >= 0 ? 'text-green-600' : 'text-red-600'}>VNĐ</Text>
                        </View>
                        <Text className="text-xs text-gray-400 text-center mt-1">
                            {netTotal >= 0 ? 'Surplus' : 'Deficit'}
                        </Text>
                    </View>
                </View>
                <View className="mt-4 h-14 items-center justify-center">
                    {selectedSegment === 'income' && (
                        <View className="items-center">
                            <Text className="text-lg font-bold text-green-600">Income</Text>
                            <Text className="text-sm text-gray-600">{formatVND(income)} ({incomePercentage.toFixed(1)}%)</Text>
                        </View>
                    )}
                    {selectedSegment === 'spending' && (
                        <View className="items-center">
                            <Text className="text-lg font-bold text-red-600">Spending</Text>
                            <Text className="text-sm text-gray-600">{formatVND(spending)} ({spendingPercentage.toFixed(1)}%)</Text>
                        </View>
                    )}
                    {!selectedSegment && (
                        <Text className="text-sm text-gray-400">Tap chart for details</Text>
                    )}
                </View>
            </View>
            <View 
                className="flex-row justify-center mt-6" 
                style={{ gap: Platform.OS === 'web' ? 48 : Platform.OS === 'ios' ? 32 : 28 }}
            >
                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <Text className="text-sm text-gray-600">Income ({incomePercentage.toFixed(1)}%)</Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <Text className="text-sm text-gray-600">Spending ({spendingPercentage.toFixed(1)}%)</Text>
                </View>
            </View>
        </View>
    );
};

export default Analysis;