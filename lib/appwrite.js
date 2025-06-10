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
		config.accountCollectionId,  // The transaction collection ID
		[Query.equal('user_id', user.$id)]  // Fetch transactions for a specific account
	  );
  
	  // Map documents to Account interface
	  return accounts.documents.map(doc => ({
		$id: doc.$id,
		user_id: doc.user_id,
		name: doc.name,
		balance: doc.balance,
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
	
export const getTransactions = async (userID, forceRefresh = false) => {
	try {  
	  const transactions = await databases.listDocuments(
		config.databaseId,
		config.transactionCollectionId,  // The transaction collection ID
		[
		  Query.equal('user_id', userID),  // Fetch transactions for a specific user
		  Query.orderDesc('$createdAt')  // Order by creation date to get newest first
		]
	  );

	  // Log any transactions with null relations for debugging
	  const invalidTransactions = transactions.documents.filter(doc => !doc.account_id || !doc.category_id || !doc.user_id);

	  const transactionsMapped = transactions.documents
		.filter(doc => doc.account_id && doc.category_id && doc.user_id) // Filter out documents with null relations
		.map((doc) => ({
		  $id: doc.$id,  // The transaction ID
		  name: doc.name,
		  account_id: {
			$id: doc.account_id.$id,  // Account ID
			name: doc.account_id.name,  // Account name
			balance: doc.account_id.balance,  // Account balance
		  },
		  amount: doc.amount,  // Transaction amount
		  category_id: {
			$id: doc.category_id.$id,  // Category ID
			name: doc.category_id.name,  // Category name
			icon: doc.category_id.icon,
			color: doc.category_id.color
		  },
		  is_income: doc.is_income,  // Whether it's an income or expense
		  note: doc.note,  // Any notes associated with the transaction
		  transaction_date: doc.transaction_date,  // Transaction date
		  user_id: {
			$id: doc.user_id.$id,  // User ID
			avatar: doc.user_id.avatar,  // User avatar URL
			email: doc.user_id.email,  // User email
			username: doc.user_id.username,  // User username
		  }
		}));

	  return transactionsMapped;
	} catch (error) {
	  console.error("Error fetching transactions:", error);
	  throw error;
	}
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
	try {
	const user = await getCurrentUser();
	
	  // Create the transaction
	  const transaction = await databases.createDocument(
		config.databaseId,
		config.transactionCollectionId,  // The transaction collection ID
		ID.unique(),
		{
		  name,
		  account_id: accountID,
		  category_id: categoryID,
		  amount,
		  is_income: isIncome,
		  note,
		  transaction_date: transactionDate,  // Store current date as transaction date
		  user_id: user.$id
		}
	  );

	  // Update account balance
	  await updateAccountBalance(accountID, amount, isIncome);
	  
	  return transaction;
	} catch (error) {
	  console.error('Error logging transaction:', error);
	  throw error;
	}
};

// Calculate account balance from transactions
export const calculateAccountBalanceFromTransactions = async (accountID, initialBalance = 0) => {
	try {
	  const transactions = await databases.listDocuments(
		config.databaseId,
		config.transactionCollectionId,
		[Query.equal('account_id', accountID)]
	  );
  
	  let balance = initialBalance;
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

export const createAccount = async (userID, name, balance = 0) => {
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
		  balance,  // Initial balance (default to 0)
		}
	  );
	  return newAccount;
	} catch (error) {
	  console.error('Error creating account:', error);
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
	  
	  // Get the transaction to reverse its effect on account balance
	  const transaction = await databases.getDocument(
		config.databaseId,
		config.transactionCollectionId,
		transactionID
	  );
  
	  	  // Extract the account ID correctly from the relationship
	  const accountID = transaction.account_id?.$id || transaction.account_id;

	  // Reverse the transaction effect on account balance only if we have a valid account ID
	  if (accountID) {
		await updateAccountBalance(
		  accountID, 
		  transaction.amount, 
		  !transaction.is_income // Reverse the effect
		);
	  } else {
		console.log('No valid account ID found, skipping balance reversal');
	  }
  
	  console.log('Account balance reversed, now deleting transaction document');
  
	  // Delete the transaction
	  await databases.deleteDocument(
		config.databaseId,
		config.transactionCollectionId,
		transactionID
	  );
  
	  console.log('Transaction deleted successfully');
	  return { success: true, message: 'Transaction deleted successfully' };
	} catch (error) {
	  console.error('Error deleting transaction:', error);
	  throw error;
	}
  };