import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { EventRegister } from 'react-native-event-listeners';
import { deleteTransaction } from '../appwrite';

export interface Transaction {
  $id: string;
  name: string;
  amount: number;
  is_income: boolean;
  transaction_date: string;
  note?: string;
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

interface TransactionActionsState {
  actionModalVisible: boolean;
  selectedTransaction: Transaction | null;
  showDeleteConfirm: boolean;
  showSuccessModal: boolean;
  deleting: boolean;
}

interface UseTransactionActionsProps {
  onDeleteSuccess?: () => void;
  initialTransaction?: Transaction | null;
}

// Define a constant event name to be used across the application
export const TRANSACTION_UPDATED_EVENT = 'TRANSACTION_UPDATED';

export const useTransactionActions = ({ 
  onDeleteSuccess,
  initialTransaction = null 
}: UseTransactionActionsProps = {}) => {
  const router = useRouter();
  const [state, setState] = useState<TransactionActionsState>({
    actionModalVisible: false,
    selectedTransaction: initialTransaction,
    showDeleteConfirm: false,
    showSuccessModal: false,
    deleting: false,
  });

  // Update selected transaction when initialTransaction changes
  useEffect(() => {
    if (initialTransaction) {
      setState(prev => ({
        ...prev,
        selectedTransaction: initialTransaction
      }));
    }
  }, [initialTransaction]);

  const resetState = useCallback(() => {
    setState({
      actionModalVisible: false,
      selectedTransaction: null,
      showDeleteConfirm: false,
      showSuccessModal: false,
      deleting: false,
    });
  }, []);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    setState(prev => ({
      ...prev,
      actionModalVisible: true,
      selectedTransaction: transaction,
    }));
  }, []);

  const handleDeleteTransaction = useCallback(() => {
    // First close the action modal to prevent UI issues on iOS
    setState(prev => ({
      ...prev,
      actionModalVisible: false,
    }));
    
    // Then show the delete confirmation after a small delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showDeleteConfirm: true,
      }));
    }, 100);
  }, []);

  const handleEditTransaction = useCallback(() => {
    setState(prev => ({
      ...prev,
      actionModalVisible: false,
      selectedTransaction: null,
    }));
    const transaction = state.selectedTransaction;
    if (!transaction) return;
    router.push({
      pathname: '/edit-transaction',
      params: { 
        transaction: JSON.stringify(transaction)
      }
    });
  }, [router, state.selectedTransaction]);

  const confirmDeleteTransaction = useCallback(async () => {
    if (!state.selectedTransaction) return;
    setState(prev => ({ ...prev, deleting: true }));
    try {
      await deleteTransaction(state.selectedTransaction.$id);
      setState(prev => ({
        ...prev,
        deleting: false,
        showDeleteConfirm: false,
        actionModalVisible: false,
        selectedTransaction: null,
        showSuccessModal: true,
      }));
      
      // Emit global event to trigger data refresh
      EventRegister.emit(TRANSACTION_UPDATED_EVENT, { action: 'delete', id: state.selectedTransaction.$id });
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        deleting: false,
        showDeleteConfirm: false,
        actionModalVisible: false,
        selectedTransaction: null,
      }));
    }
  }, [onDeleteSuccess, state.selectedTransaction]);

  const closeActionModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      actionModalVisible: false,
      selectedTransaction: null,
    }));
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDeleteConfirm: false,
    }));
  }, []);

  const closeSuccessModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSuccessModal: false,
    }));
  }, []);

  const getActionModalActions = useCallback(() => {
    if (!state.selectedTransaction) return [];
    return [
      {
        label: 'Edit Transaction',
        icon: 'pencil',
        color: '#3b82f6',
        onPress: handleEditTransaction,
        subtitle: 'Modify transaction details'
      },
      {
        label: 'Delete Transaction',
        icon: 'trash',
        color: '#ef4444',
        onPress: handleDeleteTransaction,
        subtitle: 'Remove this transaction permanently'
      }
    ];
  }, [state.selectedTransaction, handleEditTransaction, handleDeleteTransaction]);

  // Function to trigger a refresh on parent screens
  const triggerRefresh = useCallback((action = 'update', id = '') => {
    EventRegister.emit(TRANSACTION_UPDATED_EVENT, { action, id });
  }, []);

  return {
    ...state,
    handleTransactionPress,
    handleDeleteTransaction,
    handleEditTransaction,
    confirmDeleteTransaction,
    closeActionModal,
    closeDeleteConfirm,
    closeSuccessModal,
    getActionModalActions,
    triggerRefresh,
  };
}; 