import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { createAccount } from '../lib/appwrite';

const InputField = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export default function AddAccount() {
  const router = useRouter();
  const navigation = useNavigation();

  // hide header once on mount
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [form, setForm] = useState({ name: '', balance: '' });
  const [errors, setErrors] = useState<{ name?: string; balance?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [apiError, setApiError] = useState('');

  const balanceInputRef = useRef<TextInput>(null);

  const formatNumber = (text: string) =>
    text.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const getRawNumber = (formattedText: string) => formattedText.replace(/\./g, '');

  const handleInputChange = (field: 'name' | 'balance', value: string) => {
    const processedValue = field === 'balance' ? formatNumber(value) : value;
    setForm((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateField = (field: 'name' | 'balance') => {
    let error = '';
    if (field === 'name') {
      if (!form.name.trim()) error = 'Money source name is required.';
      else if (form.name.trim().length > 50) error = 'Name cannot exceed 50 characters.';
    } else {
      const rawBalance = getRawNumber(form.balance);
      if (!rawBalance) error = 'Initial balance is required.';
      else {
        const balanceValue = parseFloat(rawBalance);
        if (isNaN(balanceValue)) error = 'Please enter a valid number.';
        else if (balanceValue < 0) error = 'Balance cannot be negative.';
      }
    }
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const validateForm = () => {
    const newErrors: { name?: string; balance?: string } = {};

    if (!form.name.trim()) newErrors.name = 'Money source name is required.';
    else if (form.name.trim().length > 50) newErrors.name = 'Name cannot exceed 50 characters.';

    const rawBalance = getRawNumber(form.balance);
    if (!rawBalance) newErrors.balance = 'Initial balance is required.';
    else {
      const balanceValue = parseFloat(rawBalance);
      if (isNaN(balanceValue)) newErrors.balance = 'Please enter a valid number.';
      else if (balanceValue < 0) newErrors.balance = 'Balance cannot be negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm() || isLoading) return;

    setIsLoading(true);
    setApiError('');

    try {
      const balanceValue = parseFloat(getRawNumber(form.balance));
      await createAccount(form.name.trim(), balanceValue);
      setShowSuccessModal(true);
    } catch (error: any) {
      const errorMessage = (error as Error).message || 'An unknown error occurred.';
      setApiError(`Failed to create money source: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F9FAFB" style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.pageContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Money Source</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <InputField label="Money Source Name" error={errors.name}>
              <TextInput
                value={form.name}
                onChangeText={(text) => handleInputChange('name', text)}
                onBlur={() => validateField('name')}
                placeholder="e.g., Savings, Checking"
                placeholderTextColor="#9CA3AF"
                style={[styles.textInput, !!errors.name && styles.inputError]}
                returnKeyType="next"
                onSubmitEditing={() => balanceInputRef.current?.focus()}
                blurOnSubmit={false}
                autoCapitalize="words"
              />
            </InputField>

            <InputField label="Initial Balance" error={errors.balance}>
              <TextInput
                ref={balanceInputRef}
                keyboardType="numeric"
                inputMode="numeric"
                value={form.balance}
                onChangeText={(text) => handleInputChange('balance', text)}
                onBlur={() => validateField('balance')}
                placeholder="e.g., 50.000"
                placeholderTextColor="#9CA3AF"
                style={[styles.textInput, !!errors.balance && styles.inputError]}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </InputField>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            >
              {isLoading ? (
                <Ionicons name="hourglass-outline" size={20} color="white" />
              ) : (
                <Ionicons name="save" size={20} color="white" />
              )}
              <Text style={styles.buttonText}>
                {isLoading ? 'Creating...' : 'Create Money Source'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/home');
        }}
        message="Money source created successfully!"
        accountDetails={{
          name: form.name.trim(),
          balance: parseFloat(getRawNumber(form.balance)) || 0,
        }}
      />

      <ErrorModal
        visible={!!apiError}
        message={apiError}
        onClose={() => setApiError('')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  pageContainer: {
    flex: 1,
    ...Platform.select({
      web: { maxWidth: 768, width: '100%', alignSelf: 'center' },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 8, borderRadius: 9999, marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#111827' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24 },
  inputContainer: { marginBottom: 24 },
  inputLabel: { color: '#374151', marginBottom: 8, fontSize: 16, fontWeight: '500' },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { paddingVertical: 16 },
      android: { paddingVertical: 12 },
      web: { paddingVertical: 16, outlineStyle: 'none' } as any,
    }),
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 14, marginTop: 6 },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});