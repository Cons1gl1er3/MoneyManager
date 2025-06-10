import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TypeToggleButtonProps {
  type: 'expense' | 'income';
  onTypeChange: (type: 'expense' | 'income') => void;
}

const TypeToggleButton: React.FC<TypeToggleButtonProps> = ({ type, onTypeChange }) => {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        onPress={() => onTypeChange('expense')}
        style={[
          styles.button,
          { backgroundColor: type === 'expense' ? '#dc2626' : '#e5e7eb' },
        ]}
      >
        <Text style={[styles.buttonText, { color: type === 'expense' ? 'white' : '#374151' }]}>
          Expense
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onTypeChange('income')}
        style={[
          styles.button,
          { backgroundColor: type === 'income' ? '#16a34a' : '#e5e7eb' },
        ]}
      >
        <Text style={[styles.buttonText, { color: type === 'income' ? 'white' : '#374151' }]}>
          Income
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    gap: Platform.OS === 'web' ? 16 : 8,
    marginBottom: Platform.OS === 'web' ? 20 : 16,
  },
  button: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
});

export default TypeToggleButton; 