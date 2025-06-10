import { Ionicons } from '@expo/vector-icons';
import { Client, Databases, ID } from 'appwrite';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: '67e4f1be003a228b8e5c',
  databaseId: '67e4f34a001bc870e5b0',
  categoryCollectionId: '681a0784002b15439421',
  accountCollectionId: '681a07be003c04bcda97',
};

const client = new Client();
client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId);

const databases = new Databases(client);

// Income categories to add
const incomeCategories = [
  {
    name: 'Lương',
    icon: 'wallet-outline',
    color: '#22C55E',
    type: 'income'
  },
  {
    name: 'Tiền phụ cấp',
    icon: 'card-outline',
    color: '#10B981',
    type: 'income'
  },
  {
    name: 'Tiền thưởng',
    icon: 'trophy-outline',
    color: '#34D399',
    type: 'income'
  },
  {
    name: 'Freelance',
    icon: 'laptop-outline',
    color: '#6EE7B7',
    type: 'income'
  },
  {
    name: 'Đầu tư',
    icon: 'trending-up-outline',
    color: '#059669',
    type: 'income'
  }
];

const AdminSetup = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const addIncomeCategories = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus([]);
    
    try {
      addStatus('Starting to add income categories...');
      
      for (const category of incomeCategories) {
        try {
          const result = await databases.createDocument(
            config.databaseId,
            config.categoryCollectionId,
            ID.unique(),
            category
          );
          addStatus(`✅ Added category: ${category.name} (${result.$id})`);
        } catch (error) {
          addStatus(`❌ Error adding ${category.name}: ${error.message}`);
        }
      }
      
      addStatus('✅ Finished adding income categories!');
    } catch (error) {
      addStatus(`❌ General error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpenseCategories = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus([]);
    
    try {
      addStatus('Fetching existing categories...');
      
      const categories = await databases.listDocuments(
        config.databaseId,
        config.categoryCollectionId
      );
      
      addStatus(`Found ${categories.documents.length} categories`);
      
      for (const category of categories.documents) {
        if (!category.type) {
          try {
            await databases.updateDocument(
              config.databaseId,
              config.categoryCollectionId,
              category.$id,
              { type: 'expense' }
            );
            addStatus(`✅ Updated ${category.name} to expense type`);
          } catch (error) {
            addStatus(`❌ Error updating ${category.name}: ${error.message}`);
          }
        } else {
          addStatus(`⏭️ ${category.name} already has type: ${category.type}`);
        }
      }
      
      addStatus('✅ Finished updating expense categories!');
    } catch (error) {
      addStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createIncomeFromExpense = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus([]);
    
    try {
      addStatus('Fetching existing categories to convert...');
      
      const categories = await databases.listDocuments(
        config.databaseId,
        config.categoryCollectionId
      );
      
      addStatus(`Found ${categories.documents.length} existing categories`);
      
      // Find categories that can be converted to income
      const expenseCategories = categories.documents.filter(cat => !cat.type || cat.type === 'expense');
      
      if (expenseCategories.length >= 5) {
        addStatus('Converting first 5 expense categories to income...');
        
        for (let i = 0; i < 5 && i < incomeCategories.length; i++) {
          const expenseCat = expenseCategories[i];
          const incomeCat = incomeCategories[i];
          
          try {
            await databases.updateDocument(
              config.databaseId,
              config.categoryCollectionId,
              expenseCat.$id,
              {
                name: incomeCat.name,
                icon: incomeCat.icon,
                color: incomeCat.color,
                type: incomeCat.type
              }
            );
            addStatus(`✅ Converted "${expenseCat.name}" to "${incomeCat.name}" (income)`);
          } catch (error) {
            addStatus(`❌ Error converting ${expenseCat.name}: ${error.message}`);
          }
        }
      } else {
        addStatus('❌ Not enough expense categories to convert. Need at least 5.');
      }
      
      addStatus('✅ Finished converting categories!');
    } catch (error) {
      addStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStatus = () => {
    setStatus([]);
  };

  const migrateAccountsInitialBalance = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStatus([]);
    
    try {
      addStatus('Starting migration of initial_balance...');
      
      // Get all accounts - using account collection ID
      const accountsResponse = await databases.listDocuments(
        config.databaseId,
        config.accountCollectionId
      );
      
      const accounts = accountsResponse.documents;
      addStatus(`Found ${accounts.length} accounts to check`);
      
      let migratedCount = 0;
      
      // Update each account where initial_balance = 0
      for (const account of accounts) {
        if ((account.initial_balance === 0 || !account.initial_balance) && account.balance !== 0) {
          try {
            await databases.updateDocument(
              config.databaseId,
              config.accountCollectionId,
              account.$id,
              {
                initial_balance: account.balance
              }
            );
            addStatus(`✅ Migrated ${account.name}: initial_balance set to ${account.balance}`);
            migratedCount++;
          } catch (error) {
            addStatus(`❌ Error migrating ${account.name}: ${error.message}`);
          }
        } else {
          addStatus(`⏭️ ${account.name}: already has initial_balance set or balance is 0`);
        }
      }
      
      addStatus(`✅ Migration completed! ${migratedCount} accounts migrated.`);
    } catch (error) {
      addStatus(`❌ Migration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Admin Setup</Text>
          </View>

          <Text style={styles.subtitle}>
            Use this screen to set up income categories and update existing categories.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={addIncomeCategories}
              disabled={isLoading}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Add Income Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={createIncomeFromExpense}
              disabled={isLoading}
            >
              <Ionicons name="create" size={24} color="white" />
              <Text style={styles.buttonText}>Convert 5 Categories to Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={updateExpenseCategories}
              disabled={isLoading}
            >
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.buttonText}>Update Expense Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearStatus}
              disabled={isLoading}
            >
              <Ionicons name="trash" size={24} color="white" />
              <Text style={styles.buttonText}>Clear Log</Text>
            </TouchableOpacity>
          </View>

          {/* Status Log */}
          <View style={styles.logContainer}>
            <Text style={styles.logTitle}>Activity Log</Text>
            <ScrollView style={styles.logScroll} nestedScrollEnabled>
              {status.length === 0 ? (
                <Text style={styles.emptyLog}>No activity yet. Use the buttons above to start.</Text>
              ) : (
                status.map((log, index) => (
                  <Text key={index} style={styles.logText}>
                    {log}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>

          {/* Income Categories Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Income Categories to Add:</Text>
            {incomeCategories.map((category, index) => (
              <View key={index} style={styles.categoryPreview}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={16} color="white" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryType}>({category.type})</Text>
              </View>
            ))}
          </View>

          {/* Migration Section */}
          <View className="mt-6">
            <Text className="text-lg font-bold mb-4">🔄 Database Migration</Text>
            
            <View className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <Text className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ Required Migration
              </Text>
              <Text className="text-sm text-yellow-700">
                If you're getting "Error loading account data" when editing accounts, run this migration to add initial_balance field to existing accounts.
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={async () => {
                setIsLoading(true);
                try {
                  await migrateAccountsInitialBalance();
                  setMessage('✅ Migration completed! All accounts now have initial_balance set. You can now edit accounts without errors.');
                  setShowModal(true);
                } catch (error) {
                  setMessage(`❌ Migration failed: ${error.message}`);
                  setShowModal(true);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className={`p-4 rounded-lg mb-4 ${isLoading ? 'bg-gray-400' : 'bg-orange-600'}`}
            >
              <Text className="text-white font-semibold text-center">
                {isLoading ? 'Migrating...' : '🔧 Fix Account Loading Errors (Set Initial Balance)'}
              </Text>
            </TouchableOpacity>
            
            <Text className="text-sm text-gray-600 mb-4">
              This will set initial_balance = current balance for all accounts where initial_balance = 0.
              Run this once after adding the initial_balance field to your database.
            </Text>
          </View>
        </ScrollView>
        <StatusBar style="dark" />
        
        {/* Simple Modal for messages */}
        {showModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <View style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              margin: 20,
              maxWidth: '90%'
            }}>
              <Text style={{ fontSize: 16, marginBottom: 15 }}>
                {message}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{
                  backgroundColor: '#2563eb',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: '#22c55e',
  },
  updateButton: {
    backgroundColor: '#3b82f6',
  },
  createButton: {
    backgroundColor: '#34d399',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  logScroll: {
    maxHeight: 200,
  },
  emptyLog: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#374151',
  },
  previewContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  categoryType: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default AdminSetup; 