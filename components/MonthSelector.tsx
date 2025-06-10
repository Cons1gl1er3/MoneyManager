import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthSelectorProps {
  currentDate: Date;
  onChangeMonth: (increment: number) => void;
  onDatePress?: () => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ currentDate, onChangeMonth, onDatePress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onChangeMonth(-1)} style={styles.arrowButton}>
        <Ionicons name="chevron-back" size={24} color="#4B5563" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDatePress} style={styles.dateContainer}>
        <Ionicons name="calendar-outline" size={20} color="#4B5563" />
        <Text style={styles.dateText}>
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChangeMonth(1)} style={styles.arrowButton}>
        <Ionicons name="chevron-forward" size={24} color="#4B5563" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 20,
    backgroundColor: 'transparent', // Make it transparent to adopt parent's bg color
  },
  arrowButton: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
});

export default MonthSelector; 