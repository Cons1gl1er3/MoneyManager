import { Account, Avatars, Client, Databases, ID, Query } from 'appwrite';

export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: '67e4f1be003a228b8e5c',
  databaseId: '67e4f34a001bc870e5b0',
  userCollectionId: '67e4f378000acf482b58',
  transactionCollectionId: '681a06820019972f646b',
  categoryCollectionId: '681a0784002b15439421',
  accountCollectionId: '681a07be003c04bcda97',
  storageId: '67e4f72b00254c5b8b3e',
}

const {
	endpoint,
	projectId,
	databaseId,
	userCollectionId,
	transactionCollectionId,
	categoryCollectionId,
	accountCollectionId,
	storageId,
} = config;

// Init your React Native SDK
const client = new Client();

client
	.setEndpoint(config.endpoint) 
	.setProject(config.projectId) 
	//.setPlatform(config.platform)
;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);


export const createUser = async (email, password, username) => {
	try {
		const userId = ID.unique();
		const newAccount = await account.create(
			userId,
			email,
			password,
			username
		) 

		if (!newAccount) throw Error;

		const avatarUrl = avatars.getInitials(username);

		await signIn(email, password);

		const newUser =  await databases.createDocument(
			config.databaseId,
			config.userCollectionId,
			userId,
			{
				user_id: userId,
				email,
				username,
				avatar: avatarUrl
			}
		)

		return newUser;

	} catch (error) {
		console.log(error);
		throw new Error(error);
	}
}

export const signIn = async (email, password) => {
	try {
		const session = await account.createEmailPasswordSession(email, password);

		return session;
	} catch (error) {
		throw new Error(error);
	}
}

export const logout = async () => {
	try {
	  await account.deleteSession('current');
	  console.log('User logged out successfully');
	} catch (error) {
	  console.log('Logout error:', error);
	  throw new Error('Failed to logout');
	}
  };

export const getCurrentUser = async () => {
	try {
		const currentAccount = await account.get();

		if (!currentAccount) throw Error;

		const currentUser = await databases.listDocuments(
			config.databaseId,
			config.userCollectionId,
			[Query.equal('user_id', currentAccount.$id)]
		)

		if (!currentUser) throw Error;

		return currentUser.documents[0];
	} catch (error) {
		console.log(error);
	}
}

export const getUserAccounts = async () => {
	try {
		const user = await getCurrentUser();
	  const accounts = await databases.listDocuments(
		config.databaseId,
		config.accountCollectionId,  // The account collection ID
		[Query.equal('user_id', user.$id)]  // Fetch accounts for a specific user
	  );
  
	  // Map documents to Account interface with all fields
	  return accounts.documents.map(doc => ({
		$id: doc.$id,
		user_id: doc.user_id,
		name: doc.name,
		balance: doc.balance,
		initial_balance: doc.initial_balance || doc.balance || 0, // Fallback to balance or 0
	  }));
	} catch (error) {
	  console.error('Error fetching accounts:', error);
	  throw error;
	}
};

export const getCategories = async () => {
	try {
	  const categories = await databases.listDocuments(
		config.databaseId,
		config.categoryCollectionId  // The category collection ID
	  );
	  return categories.documents;
	} catch (error) {
	  console.error('Error fetching categories:', error);
	  throw error;
	}
};

export const getCategoriesByType = async (type = 'expense') => {
	try {
	  console.log(`Backend: getCategoriesByType called with type: ${type}`);
	  // Convert type to is_income boolean: 'income' -> true, 'expense' -> false
	  const isIncome = type === 'income';
	  const categories = await databases.listDocuments(
		config.databaseId,
		config.categoryCollectionId,
		[Query.equal('is_income', isIncome)]
	  );
	  console.log(`Backend: Found ${categories.documents.length} categories for type ${type} (is_income: ${isIncome})`);
	  console.log(`Backend: Categories:`, categories.documents.map(cat => ({id: cat.$id, name: cat.name, is_income: cat.is_income})));
	  return categories.documents;
	} catch (error) {
	  console.error('Backend: Error fetching categories by type:', error);
	  throw error;
	}
};
	
export const getTransactions = async (userID, forceRefresh = false) => {
	console.log(`Backend: getTransactions called for user ${userID}, forceRefresh=${forceRefresh}`);
	
	if (!userID) {
		console.error("Backend: getTransactions called with no userID");
		return [];
	}

	// Maximum number of retry attempts
	const MAX_RETRIES = 2;
	let retries = 0;
	let lastError = null;

	while (retries <= MAX_RETRIES) {
		try {
			console.log(`Backend: Fetching transactions, attempt ${retries + 1}/${MAX_RETRIES + 1}`);
			
			const transactions = await databases.listDocuments(
				config.databaseId,
				config.transactionCollectionId,
				[
					Query.equal('user_id', userID),
					Query.orderDesc('$createdAt')
				]
			);

			console.log(`Backend: Raw transactions fetched: ${transactions.documents.length}`);

			// Log any transactions with null relations for debugging
			const invalidTransactions = transactions.documents.filter(doc => 
				!doc.account_id || !doc.category_id || !doc.user_id
			);

			if (invalidTransactions.length > 0) {
				console.warn(`Backend: Found ${invalidTransactions.length} transactions with missing relations`);
			}

			// Safely map transactions with additional validation
			const transactionsMapped = transactions.documents
				.filter(doc => {
					// Ensure all required relations exist
					const isValid = doc.account_id && doc.category_id && doc.user_id;
					
					if (!isValid) {
						console.warn(`Backend: Skipping invalid transaction ID ${doc.$id} due to missing relations`);
					}
					
					return isValid;
				})
				.map((doc) => {
					// Safe access of nested properties
					try {
						return {
							$id: doc.$id,
							name: doc.name || 'Unnamed Transaction',
							account_id: {
								$id: doc.account_id.$id,
								name: doc.account_id.name || 'Unknown Account',
								balance: doc.account_id.balance || 0,
							},
							amount: doc.amount || 0,
							category_id: {
								$id: doc.category_id.$id,
								name: doc.category_id.name || 'Uncategorized',
								icon: doc.category_id.icon || 'help-circle-outline',
								color: doc.category_id.color || '#6B7280'
							},
							is_income: !!doc.is_income,
							note: doc.note || '',
							transaction_date: doc.transaction_date || new Date().toISOString(),
							user_id: {
								$id: doc.user_id.$id,
								avatar: doc.user_id.avatar || '',
								email: doc.user_id.email || '',
								username: doc.user_id.username || 'User',
							}
						};
					} catch (mappingError) {
						console.error(`Backend: Error mapping transaction ${doc.$id}:`, mappingError);
						// Return null for this item, we'll filter it out next
						return null;
					}
				})
				.filter(Boolean); // Remove any null entries from mapping errors

			console.log(`Backend: Successfully mapped ${transactionsMapped.length} transactions`);
			return transactionsMapped;
		} catch (error) {
			lastError = error;
			console.error(`Backend: Error fetching transactions (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error);
			
			// Only retry for specific error types that might be transient
			const isTransientError = 
				error.message?.includes('Server Error') || 
				error.message?.includes('Network Error') ||
				error.code === 500 ||
				error.code === 503 ||
				error.code === 429;
				
			if (isTransientError && retries < MAX_RETRIES) {
				retries++;
				// Exponential backoff: wait longer between each retry
				const delay = Math.pow(2, retries) * 500; // 1s, 2s, 4s...
				console.log(`Backend: Retrying in ${delay}ms...`);
				await new Promise(resolve => setTimeout(resolve, delay));
			} else {
				// Either not a transient error or we've exhausted retries
				console.error("Backend: Failed to fetch transactions after retries");
				throw error;
			}
		}
	}
	
	// If we reach here, all retries failed
	throw lastError;
};
  
// Update account balance
export const updateAccountBalance = async (accountID, amount, isIncome) => {
	try {
	  // First get the current account
	  const account = await databases.getDocument(
		config.databaseId,
		config.accountCollectionId,
		accountID
	  );
  
	  // Calculate new balance
	  const currentBalance = account.balance || 0;
	  const newBalance = isIncome ? currentBalance + amount : currentBalance - amount;
  
	  // Update the account balance
	  await databases.updateDocument(
		config.databaseId,
		config.accountCollectionId,
		accountID,
		{ balance: newBalance }
	  );
  
	  return newBalance;
	} catch (error) {
	  console.error('Error updating account balance:', error);
	  throw error;
	}
  };

export const logTransaction = async (name, accountID, categoryID, amount, isIncome, note, transactionDate) => {
	console.log('--- Backend: logTransaction called ---');
	console.log(`Received data: name=${name}, accountID=${accountID}, categoryID=${categoryID}, amount=${amount}`);

	// Validate all required fields
	if (!name || name.trim() === '') {
		const errorMsg = "Validation Error: Transaction name cannot be empty";
		console.error(errorMsg);
		return { success: false, message: errorMsg };
	}

	if (!accountID) {
		const errorMsg = "Validation Error: No account selected";
		console.error(errorMsg);
		return { success: false, message: errorMsg };
	}

	if (!categoryID) {
		const errorMsg = "Validation Error: No category selected";
		console.error(errorMsg);
		return { success: false, message: errorMsg };
	}

	if (amount <= 0) {
		const errorMsg = `Validation Error: Amount must be greater than 0 (received: ${amount})`;
		console.error(errorMsg);
		return { success: false, message: errorMsg };
	}

	try {
		const user = await getCurrentUser();
		if (!user) {
			const errorMsg = "User not authenticated.";
			console.error(errorMsg);
			return { success: false, message: errorMsg };
		}
		
		console.log(`Backend: Creating transaction for user ${user.$id}`);
		
		// Validate account and category existence
		try {
			// Check if account exists
			await databases.getDocument(
				config.databaseId,
				config.accountCollectionId,
				accountID
			);
			
			// Check if category exists
			await databases.getDocument(
				config.databaseId,
				config.categoryCollectionId,
				categoryID
			);
		} catch (validationError) {
			console.error("Backend: Account or Category validation failed:", validationError);
			return { 
				success: false, 
				message: `Invalid account or category: ${validationError.message}` 
			};
		}
		
		// Create the transaction
		const transaction = await databases.createDocument(
			config.databaseId,
			config.transactionCollectionId,
			ID.unique(),
			{
				name: name.trim(),
				account_id: accountID,
				category_id: categoryID,
				amount: Number(amount) || 0,
				is_income: !!isIncome,
				note: note || "",
				transaction_date: transactionDate || new Date().toISOString(),
				user_id: user.$id
			}
		);

		console.log('Backend: Transaction created successfully, ID:', transaction.$id);

		// Update account balance
		console.log('Backend: Updating account balance...');
		try {
			await updateAccountBalance(accountID, amount, isIncome);
			console.log('Backend: Account balance updated.');
		} catch (balanceError) {
			console.error('Backend: Failed to update account balance:', balanceError);
			// Don't delete the transaction, just report the error
			return { 
				success: true, 
				message: "Transaction created but account balance update failed",
				transaction: transaction,
				balanceError: balanceError.message
			};
		}
		
		return { 
			success: true, 
			message: "Transaction created successfully",
			transaction: transaction
		};
	} catch (error) {
		console.error('Backend Error in logTransaction:', error);
		return { 
			success: false, 
			message: `Failed to create transaction: ${error.message}`,
			error: error
		};
	}
};

// Calculate account balance from transactions with initial balance
export const calculateAccountBalanceFromTransactions = async (accountID) => {
	try {
	  // Get account to get initial balance
	  const account = await databases.getDocument(
		config.databaseId,
		config.accountCollectionId,
		accountID
	  );
	  
	  // Get all transactions for this account
	  const transactions = await databases.listDocuments(
		config.databaseId,
		config.transactionCollectionId,
		[Query.equal('account_id', accountID)]
	  );
  
	  // Start with initial balance
	  let balance = account.initial_balance || 0;
	  
	  // Add all transactions
	  transactions.documents.forEach(transaction => {
		if (transaction.is_income) {
		  balance += transaction.amount;
		} else {
		  balance -= transaction.amount;
		}
	  });
  
	  return balance;
	} catch (error) {
	  console.error('Error calculating account balance:', error);
	  throw error;
	}
};

// Sync account balance with actual transactions
export const syncAccountBalance = async (accountID) => {
	try {
	  const account = await databases.getDocument(
		config.databaseId,
		config.accountCollectionId,
		accountID
	  );
  
	  // Get original balance when account was created
	  const initialBalance = 0; // You might want to store this separately
	  const calculatedBalance = await calculateAccountBalanceFromTransactions(accountID, initialBalance);
  
	  // Update account with calculated balance
	  await databases.updateDocument(
		config.databaseId,
		config.accountCollectionId,
		accountID,
		{ balance: calculatedBalance }
	  );
  
	  return calculatedBalance;
	} catch (error) {
	  console.error('Error syncing account balance:', error);
	  throw error;
	}
  };

export const createAccount = async (name, initialBalance = 0) => {
	try {
	  const user = await getCurrentUser();  // Assume `getCurrentUser` retrieves the current logged-in user
	  if (!user) throw new Error('User not found.');
  
	  const newAccount = await databases.createDocument(
		config.databaseId,
		config.accountCollectionId,  // The account collection ID
		ID.unique(),
		{
		  user_id: user.$id,  // Link account to the current user
		  name,
		  balance: initialBalance,  // Current balance = initial balance when creating
		  initial_balance: initialBalance,  // Store the initial balance separately
		}
	  );
	  return newAccount;
	} catch (error) {
	  console.error('Error creating account:', error);
	  throw error;
	}
};

// Update account
export const updateAccount = async (accountID, updates) => {
  try {
    // If initial_balance is being updated, recalculate current balance
    if (updates.initial_balance !== undefined) {
      // Get all transactions for this account
      const transactions = await databases.listDocuments(
        config.databaseId,
        config.transactionCollectionId,
        [Query.equal('account_id', accountID)]
      );

      // Calculate new current balance
      let newBalance = updates.initial_balance;
      transactions.documents.forEach(transaction => {
        if (transaction.is_income) {
          newBalance += transaction.amount;
        } else {
          newBalance -= transaction.amount;
        }
      });

      // Update both initial_balance and balance
      updates.balance = newBalance;
    }

    const updatedAccount = await databases.updateDocument(
      config.databaseId,
      config.accountCollectionId,
      accountID,
      updates
    );
    return updatedAccount;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

// Update transaction
export const updateTransaction = async (transactionID, updates) => {
  try {  
    // Get the original transaction to calculate balance changes
    const originalTransaction = await databases.getDocument(
      config.databaseId,
      config.transactionCollectionId,
      transactionID
    );

    // Update the transaction
    const updatedTransaction = await databases.updateDocument(
      config.databaseId,
      config.transactionCollectionId,
      transactionID,
      updates
    );

    // If amount, account, or income type changed, adjust account balances
    const amountChanged = updates.amount !== undefined && updates.amount !== originalTransaction.amount;
    const accountChanged = updates.account_id !== undefined && updates.account_id !== originalTransaction.account_id;
    const incomeTypeChanged = updates.is_income !== undefined && updates.is_income !== originalTransaction.is_income;

    if (amountChanged || accountChanged || incomeTypeChanged) {
      console.log('Backend: Updating account balances');
      
      // Extract the account ID correctly from the relationship
      const originalAccountID = originalTransaction.account_id?.$id || originalTransaction.account_id;
      
      // Only update balances if we have valid account IDs
      if (originalAccountID) {
        // Reverse the original transaction effect
        await updateAccountBalance(
          originalAccountID, 
          originalTransaction.amount, 
          !originalTransaction.is_income // Reverse the effect
        );

        // Apply the new transaction effect
        const newAccountID = updates.account_id || originalAccountID;
        const newAmount = updates.amount || originalTransaction.amount;
        const newIsIncome = updates.is_income !== undefined ? updates.is_income : originalTransaction.is_income;
        
        if (newAccountID) {
          await updateAccountBalance(newAccountID, newAmount, newIsIncome);
        }
        
        console.log('Backend: Account balances updated');
      } else {
        console.log('Backend: No valid account ID found, skipping balance updates');
      }
    } else {
      console.log('Backend: No account balance changes needed');
    }

    console.log('Backend: updateTransaction completed successfully');
    return updatedTransaction;
  } catch (error) {
    console.error('Backend: Error updating transaction:', error);
    throw error;
  }
};
 
// Delete transaction
export const deleteTransaction = async (transactionID) => {
  try {
    console.log('Backend: Starting deleteTransaction for ID:', transactionID);
    
    if (!transactionID) {
      console.error('Backend: deleteTransaction called with no transactionID');
      return { 
        success: false, 
        message: 'No transaction ID provided' 
      };
    }
    
    // Get the transaction to reverse its effect on account balance
    let transaction;
    try {
      transaction = await databases.getDocument(
        config.databaseId,
        config.transactionCollectionId,
        transactionID
      );
    } catch (fetchError) {
      console.error('Backend: Error fetching transaction for deletion:', fetchError);
      // If the transaction doesn't exist, consider it already deleted
      if (fetchError.code === 404) {
        return { 
          success: true, 
          message: 'Transaction already deleted or does not exist' 
        };
      }
      throw fetchError;
    }

    console.log('Backend: Retrieved transaction:', {
      id: transaction.$id,
      name: transaction.name,
      amount: transaction.amount,
      is_income: transaction.is_income,
      account_id: transaction.account_id ? 
        (transaction.account_id.$id || transaction.account_id) : 
        'undefined'
    });

    // Extract the account ID correctly from the relationship
    const accountID = transaction.account_id ? 
      (transaction.account_id.$id || transaction.account_id) : 
      null;
    
    console.log('Backend: Extracted account ID:', accountID);

    // Reverse the transaction effect on account balance only if we have a valid account ID
    if (accountID) {
      console.log('Backend: Reversing account balance...');
      try {
        await updateAccountBalance(
          accountID, 
          transaction.amount || 0, 
          !transaction.is_income // Reverse the effect
        );
        console.log('Backend: Account balance reversed successfully');
      } catch (balanceError) {
        console.error('Backend: Error updating account balance:', balanceError);
        // Continue with deletion even if balance update fails
        console.log('Backend: Proceeding with transaction deletion despite balance update failure');
      }
    } else {
      console.log('Backend: No valid account ID found, skipping balance reversal');
    }

    console.log('Backend: Account balance processed, now deleting transaction document');

    // Delete the transaction
    try {
      await databases.deleteDocument(
        config.databaseId,
        config.transactionCollectionId,
        transactionID
      );
      console.log('Backend: Transaction deleted successfully');
    } catch (deleteError) {
      console.error('Backend: Error during transaction document deletion:', deleteError);
      // If already deleted, consider it a success
      if (deleteError.code === 404) {
        return { 
          success: true, 
          message: 'Transaction already deleted' 
        };
      }
      throw deleteError;
    }

    return { 
      success: true, 
      message: 'Transaction deleted successfully',
      transactionID: transactionID
    };
  } catch (error) {
    console.error('Backend: Error deleting transaction:', error);
    console.error('Backend: Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    });
    return {
      success: false,
      message: `Error deleting transaction: ${error.message}`,
      error: error
    };
  }
};

// Delete account and transfer transactions to default account
export const deleteAccount = async (accountID) => {
  try {
    // Get the current user to find default account
    const user = await getCurrentUser();
    if (!user) throw new Error('User not found.');

    // Find the default "Tiền mặt" account
    const accounts = await databases.listDocuments(
      config.databaseId,
      config.accountCollectionId,
      [Query.equal('user_id', user.$id)]
    );
    
    const defaultAccount = accounts.documents.find(acc => acc.name === 'Tiền mặt');
    if (!defaultAccount) {
      throw new Error('Default account "Tiền mặt" not found.');
    }

    // Don't allow deleting the default account
    if (accountID === defaultAccount.$id) {
      throw new Error('Cannot delete the default account.');
    }

    // Get all transactions for this account
    const transactions = await databases.listDocuments(
      config.databaseId,
      config.transactionCollectionId,
      [Query.equal('account_id', accountID)]
    );

    // Transfer all transactions to default account
    for (const transaction of transactions.documents) {
      await databases.updateDocument(
        config.databaseId,
        config.transactionCollectionId,
        transaction.$id,
        { account_id: defaultAccount.$id }
      );
    }

    // Get the account being deleted to get its balance
    const accountToDelete = await databases.getDocument(
      config.databaseId,
      config.accountCollectionId,
      accountID
    );

    // Transfer the balance to default account
    if (accountToDelete.balance !== 0) {
      await updateAccountBalance(defaultAccount.$id, accountToDelete.balance, true);
    }

    // Delete the account
    await databases.deleteDocument(
      config.databaseId,
      config.accountCollectionId,
      accountID
    );

    return { success: true, message: 'Account deleted and transactions transferred successfully' };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// Add this function to migrate existing accounts
export const migrateAccountsInitialBalance = async () => {
  try {
    console.log('Starting migration of initial_balance...');
    
    // Get all accounts
    const response = await databases.listDocuments(
      config.databaseId,
      config.accountCollectionId
    );
    
    const accounts = response.documents;
    console.log(`Found ${accounts.length} accounts to migrate`);
    
    // Update each account where initial_balance = 0
    for (const account of accounts) {
      if (account.initial_balance === 0 && account.balance !== 0) {
        console.log(`Migrating account ${account.name}: setting initial_balance to ${account.balance}`);
        
        await databases.updateDocument(
          config.databaseId,
          config.accountCollectionId,
          account.$id,
          {
            initial_balance: account.balance
          }
        );
      }
    }
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};