// app/(accounts)/edit-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { updateAccount } from '../lib/appwrite';
import { TRANSACTION_UPDATED_EVENT } from '../lib/hooks/useTransactionActions';

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

export default function EditAccount() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [form, setForm] = useState({ name: '', initialBalance: '' });
  const [originalForm, setOriginalForm] = useState({ name: '', initialBalance: '' });
  const [accountData, setAccountData] = useState<any>(null);

  const [errors, setErrors] = useState<{ name?: string; initialBalance?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [apiError, setApiError] = useState('');

  const balanceInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (params.account) {
      try {
        const account = JSON.parse(params.account as string);
        setAccountData(account);

        const initialBalanceStr = account.initial_balance?.toString() ?? '0';
        const formattedBalance = formatNumber(initialBalanceStr);

        setForm({ name: account.name, initialBalance: formattedBalance });
        setOriginalForm({ name: account.name, initialBalance: formattedBalance });
      } catch {
        setApiError('Failed to load account data. Please go back and try again.');
      }
    } else {
      setApiError('No account data provided. Please go back and try again.');
    }
  }, [params.account]);

  const formatNumber = (text: string) =>
    text.replace(/[^0-9-]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const getRawNumber = (formattedText: string) => formattedText.replace(/\./g, '');

  const handleInputChange = (field: 'name' | 'initialBalance', value: string) => {
    const processedValue = field === 'initialBalance' ? formatNumber(value) : value;
    setForm((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateField = (field: 'name' | 'initialBalance') => {
    let error = '';
    if (field === 'name') {
      if (!form.name.trim()) error = 'Account name is required.';
      else if (form.name.trim().length > 50) error = 'Name cannot exceed 50 characters.';
    } else {
      const rawBalance = getRawNumber(form.initialBalance);
      if (rawBalance === '' || rawBalance === '-') error = 'Initial balance is required.';
      else if (isNaN(parseFloat(rawBalance))) error = 'Please enter a valid number.';
    }
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const validateForm = () => {
    const nameError = !form.name.trim() ? 'Account name is required.' : '';
    const rawBalance = getRawNumber(form.initialBalance);
    const balanceError =
      rawBalance === '' || isNaN(parseFloat(rawBalance))
        ? 'Initial balance is required and must be a number.'
        : '';

    const newErrors = { name: nameError, initialBalance: balanceError };
    setErrors(newErrors);
    return !nameError && !balanceError;
  };

  const performUpdate = async () => {
    if (!accountData) {
      setApiError('Account data is missing.');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const balanceValue = parseFloat(getRawNumber(form.initialBalance));
      await updateAccount(accountData.$id, {
        name: form.name.trim(),
        initial_balance: balanceValue,
      });

      EventRegister.emit(TRANSACTION_UPDATED_EVENT, {
        action: 'account_update',
        id: accountData.$id,
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      setApiError(`Failed to update account: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm() || isLoading) return;

    const hasInitialBalanceChanged = form.initialBalance !== originalForm.initialBalance;
    if (hasInitialBalanceChanged) {
      setShowConfirmModal(true);
    } else {
      await performUpdate();
    }
  };

  if (!accountData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <ErrorModal visible={!!apiError} message={apiError} onClose={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F9FAFB" style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Money Source</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <InputField label="Account Name" error={errors.name}>
              <TextInput
                value={form.name}
                onChangeText={(text) => handleInputChange('name', text)}
                onBlur={() => validateField('name')}
                placeholder="e.g., Savings Account"
                style={[styles.textInput, !!errors.name && styles.inputError]}
                returnKeyType="next"
                onSubmitEditing={() => balanceInputRef.current?.focus()}
                blurOnSubmit={false}
                autoCapitalize="words"
              />
            </InputField>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={24} color="#065F46" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>About Initial Balance</Text>
                <Text style={styles.infoText}>
                  This is the starting amount. Your current balance is automatically calculated based
                  on this plus all recorded income and expenses.
                </Text>
              </View>
            </View>

            <InputField label="Initial Balance" error={errors.initialBalance}>
              <TextInput
                ref={balanceInputRef}
                keyboardType="numeric"
                inputMode="numeric"
                value={form.initialBalance}
                onChangeText={(text) => handleInputChange('initialBalance', text)}
                onBlur={() => validateField('initialBalance')}
                placeholder="0"
                style={[styles.textInput, !!errors.initialBalance && styles.inputError]}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </InputField>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>{isLoading ? 'Updating...' : 'Update Account'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        message="Account updated successfully!"
        accountDetails={{
          name: form.name.trim(),
          balance: parseFloat(getRawNumber(form.initialBalance)) || 0,
          balanceType: 'Initial Balance',
        }}
      />

      <ConfirmModal
        visible={showConfirmModal}
        title="Confirm Balance Change"
        message={`Changing the initial balance from ${originalForm.initialBalance} to ${form.initialBalance} will directly affect your current balance. Are you sure?`}
        confirmText="Yes, Update"
        onConfirm={async () => {
          setShowConfirmModal(false);
          await performUpdate();
        }}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ErrorModal visible={!!apiError} message={apiError} onClose={() => setApiError('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 18, color: '#6B7280' },
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTextContainer: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#064E3B', marginBottom: 4 },
  infoText: { fontSize: 14, color: '#065F46', lineHeight: 20 },
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
  submitButtonDisabled: { backgroundColor: '#9CA3AF', elevation: 0, shadowOpacity: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});