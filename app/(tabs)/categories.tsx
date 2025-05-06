import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import PieChartComponent from '../../components/PieChart';

const screenWidth = Dimensions.get("window").width;

const categoryData = [
  { name: 'Clothing', amount: 650, color: '#9333EA', icon: 'shirt-outline' },
  { name: 'Leisure', amount: 580, color: '#4F46E5', icon: 'game-controller-outline' },
  { name: 'Entertainment', amount: 500, color: '#EC4899', icon: 'film-outline' },
  { name: 'Health', amount: 250, color: '#6366F1', icon: 'medical-outline' },
  { name: 'Dining', amount: 320, color: '#F97316', icon: 'restaurant-outline' },
  { name: 'Transport', amount: 150, color: '#22C55E', icon: 'car-outline' },
];

const chartData = categoryData.map((item) => ({
  name: item.name,
  population: item.amount,
  color: item.color,
  legendFontColor: '#7F7F7F',
  legendFontSize: 12,
}));

const Categories = () => {
  const total = categoryData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold">Categories</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Total Spending + Chart */}
        <View className="mt-6 items-center">
          <Text className="text-base text-gray-500">Total Spending</Text>
          <Text className="text-3xl font-bold mt-1">€{total.toFixed(1)}</Text>
          <View className="mt-4">
            <PieChartComponent
              data={chartData}
              width={screenWidth * 0.7}
              height={180}
              accessor="population"
              absolute
              center={[10, 0]}
            />
          </View>
        </View>

        {/* Category Grid */}
        <View className="mt-8 flex-row flex-wrap justify-between">
          {categoryData.map((item, index) => (
            <View
              key={index}
              className="w-[48%] bg-gray-100 rounded-xl p-4 mb-4 flex-row items-center"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: item.color }}
              >
                <Ionicons name={item.icon} size={20} color="white" />
              </View>
              <View className="ml-3">
                <Text className="text-base font-semibold">{item.name}</Text>
                <Text className="text-sm text-gray-600">€{item.amount.toFixed(1)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Categories;