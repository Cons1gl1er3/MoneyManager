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
		const newAccount = await account.create(
			ID.unique(),
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
			ID.unique(),
			{
				user_id: newAccount.$id,
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
	  const user = await getCurrentUser();  // Assume `getCurrentUser` retrieves the current logged-in user
	  if (!user) throw new Error('User not found.');
  
	  // Fetch accounts associated with the user using their `user_id`
	  const accounts = await databases.listDocuments(
		config.databaseId,
		config.accountCollectionId,  // The account collection ID
		[Query.equal('user_id', user.accountID)]  // Fetch accounts by user_id
	  );
	  return accounts.documents;
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
	
export const getTransactions = async (accountID) => {
	try {
	  const transactions = await databases.listDocuments(
		config.databaseId,
		config.transactionCollectionId,  // The transaction collection ID
		[Query.equal('account_id', accountID)]  // Fetch transactions for a specific account
	  );
	  return transactions.documents;
	} catch (error) {
	  console.error('Error fetching transactions:', error);
	  throw error;
	}
};
  
export const logTransaction = async (accountID, categoryID, amount, isIncome, note) => {
	try {
	  const transaction = await databases.createDocument(
		config.databaseId,
		config.transactionCollectionId,  // The transaction collection ID
		ID.unique(),
		{
		  account_id: accountID,
		  category_id: categoryID,
		  amount,
		  is_income: isIncome,
		  note,
		  transaction_date: new Date().toISOString(),  // Store current date as transaction date
		  recurring_id: '',  // Add a recurring ID if applicable
		}
	  );
	  console.log('Transaction logged successfully:', transaction);
	  return transaction;
	} catch (error) {
	  console.error('Error logging transaction:', error);
	  throw error;
	}
};

export const createAccount = async (name, balance = 0) => {
	try {
	  const user = await getCurrentUser();  // Assume `getCurrentUser` retrieves the current logged-in user
	  if (!user) throw new Error('User not found.');
  
	  const newAccount = await databases.createDocument(
		config.databaseId,
		config.accountCollectionId,  // The account collection ID
		ID.unique(),
		{
		  user_id: user.accountID,  // Link account to the current user
		  account_id: ID.unique(),  // Auto-generate account ID
		  name,
		  balance,  // Initial balance (default to 0)
		}
	  );
	  console.log('Account created successfully:', newAccount);
	  return newAccount;
	} catch (error) {
	  console.error('Error creating account:', error);
	  throw error;
	}
};