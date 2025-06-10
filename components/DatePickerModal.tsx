import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerModalProps {
  visible: boolean;
  currentDate: Date;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  currentDate,
  onClose,
  onDateSelect,
}) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onDateSelect(newDate);
    onClose();
  };

  const isValidDate = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    const today = new Date();
    return selectedDate <= today;
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <BlurView intensity={30} className="flex-1">
          <View className="flex-1 bg-black/40 items-center justify-center px-6">
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <View className="p-6 border-b border-gray-100">
                <Text className="text-xl font-bold text-gray-900 text-center">
                  Select Month & Year
                </Text>
              </View>

              {/* Date Picker */}
              <View className="p-6">
                <View className="flex-row space-x-4">
                  {/* Month Picker */}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Month</Text>
                    <ScrollView 
                      className="max-h-32 border border-gray-200 rounded-lg"
                      showsVerticalScrollIndicator={Platform.OS === 'web'}
                    >
                      {months.map((month, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedMonth(index)}
                          className={`p-3 border-b border-gray-100 ${
                            selectedMonth === index ? 'bg-blue-50' : ''
                          }`}
                        >
                          <Text className={`text-center ${
                            selectedMonth === index ? 'text-blue-600 font-semibold' : 'text-gray-700'
                          }`}>
                            {month}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Year Picker */}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Year</Text>
                    <ScrollView 
                      className="max-h-32 border border-gray-200 rounded-lg"
                      showsVerticalScrollIndicator={Platform.OS === 'web'}
                    >
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          onPress={() => setSelectedYear(year)}
                          className={`p-3 border-b border-gray-100 ${
                            selectedYear === year ? 'bg-blue-50' : ''
                          }`}
                        >
                          <Text className={`text-center ${
                            selectedYear === year ? 'text-blue-600 font-semibold' : 'text-gray-700'
                          }`}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="p-6 pt-0">
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 py-3 px-4 bg-gray-100 rounded-xl items-center justify-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!isValidDate()}
                    className={`flex-1 py-3 px-4 rounded-xl items-center justify-center ${
                      isValidDate() ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <Text className={`font-semibold ${
                      isValidDate() ? 'text-white' : 'text-gray-500'
                    }`}>
                      Select
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

export default DatePickerModal; 