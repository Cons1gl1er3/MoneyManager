import { useCallback, useEffect, useRef, useState } from 'react';
import { EventRegister } from 'react-native-event-listeners';
import { getCategoriesByType, getUserAccounts } from '../appwrite';
import { Transaction, TRANSACTION_UPDATED_EVENT } from './useTransactionActions';

// Fallback income categories (same as add-transaction)
const fallbackIncomeCategories = [
  { $id: 'temp-salary', name: 'Lương', icon: 'wallet-outline', color: '#22C55E' },
  { $id: 'temp-allowance', name: 'Tiền phụ cấp', icon: 'card-outline', color: '#10B981' },
  { $id: 'temp-bonus', name: 'Tiền thưởng', icon: 'trophy-outline', color: '#34D399' },
  { $id: 'temp-freelance', name: 'Freelance', icon: 'laptop-outline', color: '#6EE7B7' },
  { $id: 'temp-investment', name: 'Đầu tư', icon: 'trending-up-outline', color: '#059669' }
];

interface TransactionFormState {
  name: string;
  type: 'income' | 'expense';
  amount: string;
  note: string;
  selectedAccount: string | null;
  selectedCategory: string | null;
  selectedDate: Date;
  accounts: any[];
  categories: any[];
  isLoading: boolean;
  showSuccessModal: boolean;
  errorModalVisible: boolean;
  errorModalMessage: string;
  updatedTransaction: any | null;
}

interface UseTransactionFormProps {
  initialTransaction?: Transaction | null;
  onSuccess?: () => void;
}

export const useTransactionForm = ({ initialTransaction, onSuccess }: UseTransactionFormProps = {}) => {
  // Track initial type to prevent infinite effect loop
  const initialTypeRef = useRef<'income' | 'expense'>(
    initialTransaction ? (initialTransaction.is_income ? 'income' : 'expense') : 'expense'
  );

  const [state, setState] = useState<TransactionFormState>({
    name: '',
    type: initialTypeRef.current, // Initialize with correct type
    amount: '',
    note: '',
    selectedAccount: null,
    selectedCategory: null,
    selectedDate: new Date(),
    accounts: [],
    categories: [],
    isLoading: false,
    showSuccessModal: false,
    errorModalVisible: false,
    errorModalMessage: '',
    updatedTransaction: null,
  });

  // Format number with thousand separators
  const formatNumber = useCallback((text: string) =>
    text.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
  []);
  
  // Parse formatted number back to raw number
  const parseNumber = useCallback((formatted: string) => formatted.replace(/\./g, ''), []);

  // Fetch categories without setting state directly
  const fetchCategories = useCallback(async (transactionType: 'income' | 'expense') => {
    try {
      const categoriesData = await getCategoriesByType(transactionType);
      if (transactionType === 'income' && categoriesData.length === 0) {
        return fallbackIncomeCategories;
      }
      return categoriesData;
    } catch (error) {
      if (transactionType === 'income') {
        return fallbackIncomeCategories;
      }
      return [];
    }
  }, []);

  // Load initial data only once
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        // Load accounts first
        const userAccounts = await getUserAccounts();
        
        if (!mounted) return;
        
        // Set initial transaction data if editing
        if (initialTransaction) {
          const typeToLoad = initialTransaction.is_income ? 'income' : 'expense';
          
          // Load categories based on transaction type
          const categoriesData = await fetchCategories(typeToLoad);
          
          if (!mounted) return;
          
          // Set all state at once
          setState(prev => ({
            ...prev,
            name: initialTransaction.name,
            type: typeToLoad,
            amount: formatNumber(initialTransaction.amount.toString()),
            note: initialTransaction.note || '',
            selectedDate: new Date(initialTransaction.transaction_date),
            selectedAccount: initialTransaction.account_id.$id,
            selectedCategory: initialTransaction.category_id.$id,
            accounts: userAccounts,
            categories: categoriesData,
            isLoading: false,
          }));
        } else {
          // For new transactions, load expense categories by default
          const categoriesData = await fetchCategories('expense');
          
          if (!mounted) return;
          
          setState(prev => ({
            ...prev,
            accounts: userAccounts,
            categories: categoriesData,
            isLoading: false,
          }));
        }
      } catch (error) {
        if (!mounted) return;
        setState(prev => ({
          ...prev,
          errorModalMessage: 'Failed to load data. Please try again.',
          errorModalVisible: true,
          isLoading: false,
        }));
      }
    };
    
    loadInitialData();
    return () => { mounted = false; };
  }, [initialTransaction, fetchCategories, formatNumber]);

  // Function to handle type changes (called directly, not in an effect)
  const setField = useCallback(async (field: keyof TransactionFormState, value: any) => {
    // Special handling for type changes
    if (field === 'type' && value !== state.type) {
      setState(prev => ({ ...prev, [field]: value, isLoading: true }));
      
      try {
        // Load new categories when type changes
        const categoriesData = await fetchCategories(value);
        setState(prev => ({
          ...prev,
          categories: categoriesData,
          selectedCategory: null, // Reset category selection when type changes
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          errorModalMessage: `Failed to load ${value} categories. Please try again.`,
          errorModalVisible: true,
          isLoading: false,
        }));
      }
    } else {
      // Normal field updates
      setState(prev => ({ ...prev, [field]: value }));
    }
  }, [state.type, fetchCategories]);

  const validateForm = useCallback(() => {
    const amt = parseNumber(state.amount);
    if (!state.selectedAccount || !state.selectedCategory) {
      setState(prev => ({
        ...prev,
        errorModalMessage: 'Please fill all required fields: Account and Category.',
        errorModalVisible: true,
      }));
      return false;
    }
    if (state.selectedCategory?.startsWith('temp-')) {
      setState(prev => ({
        ...prev,
        errorModalMessage: '⚠️ You are using a temporary category.\n\nPlease:\n1. Go to Admin Setup page\n2. Click "Convert 5 Categories to Income" or add via Appwrite Console\n3. Return here to edit transactions with real categories',
        errorModalVisible: true,
      }));
      return false;
    }
    if (!amt || isNaN(+amt) || +amt <= 0) {
      setState(prev => ({
        ...prev,
        errorModalMessage: 'Please enter a valid amount greater than 0.',
        errorModalVisible: true,
      }));
      return false;
    }
    if (!state.name.trim()) {
      setState(prev => ({
        ...prev,
        errorModalMessage: 'Please enter a transaction name.',
        errorModalVisible: true,
      }));
      return false;
    }
    return true;
  }, [state.selectedAccount, state.selectedCategory, state.amount, state.name, parseNumber]);

  const getFormData = useCallback(() => {
    const amt = parseNumber(state.amount);
    return {
      name: state.name.trim(),
      account_id: state.selectedAccount,
      category_id: state.selectedCategory,
      amount: +amt,
      is_income: state.type === 'income',
      note: state.note.trim(),
      transaction_date: state.selectedDate.toISOString(),
    };
  }, [state, parseNumber]);

  const showSuccess = useCallback((transaction: any) => {
    setState(prev => ({
      ...prev,
      showSuccessModal: true,
      updatedTransaction: {
        name: transaction.name,
        amount: transaction.amount,
        type: transaction.is_income ? 'Income' : 'Expense',
      },
    }));
    
    // Emit the transaction updated event
    if (initialTransaction && initialTransaction.$id) {
      EventRegister.emit(TRANSACTION_UPDATED_EVENT, { 
        action: 'update', 
        id: initialTransaction.$id 
      });
    } else {
      EventRegister.emit(TRANSACTION_UPDATED_EVENT, { 
        action: 'create' 
      });
    }
    
    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess, initialTransaction]);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSuccessModal: false,
      errorModalVisible: false,
      errorModalMessage: '',
    }));
  }, []);

  return {
    ...state,
    setField,
    formatNumber,
    parseNumber,
    validateForm,
    getFormData,
    showSuccess,
    closeModals,
  };
}; 