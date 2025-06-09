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
	
export const getTransactions = async (userID) => {
	try {
	  let allTransactions = [];
	  let lastDocumentId = null;
	  const limit = 100; // Fetch 100 documents per request (adjust as needed, max 5000)
  
	  while (true) {
		// Build queries
		const queries = [Query.equal("user_id", userID), Query.limit(limit)];
		if (lastDocumentId) {
		  queries.push(Query.cursorAfter(lastDocumentId)); // Use cursor for pagination
		}
  
		// Fetch documents
		const response = await databases.listDocuments(
		  config.databaseId,
		  config.transactionCollectionId,
		  queries
		);
  
		// Map documents to desired format
		const transactionsMapped = response.documents.map((doc) => ({
		  $id: doc.$id,
		  name: doc.name,
		  account_id: {
			$id: doc.account_id.$id,
			name: doc.account_id.name,
			balance: doc.account_id.balance,
		  },
		  amount: doc.amount,
		  category_id: {
			$id: doc.category_id.$id,
			name: doc.category_id.name,
			icon: doc.category_id.icon,
			color: doc.category_id.color,
		  },
		  is_income: doc.is_income,
		  note: doc.note,
		  transaction_date: doc.transaction_date,
		  user_id: {
			$id: doc.user_id.$id,
			avatar: doc.user_id.avatar,
			email: doc.user_id.email,
			username: doc.user_id.username,
		  },
		}));
  
		// Add to the result array
		allTransactions = [...allTransactions, ...transactionsMapped];
  
		// Check if there are more documents to fetch
		if (response.documents.length < limit) {
		  break; // Exit loop if fewer documents than limit are returned
		}
  
		// Update cursor to the last document's ID
		lastDocumentId = response.documents[response.documents.length - 1].$id;
	  }
  
	  return allTransactions;
	} catch (error) {
	  console.error("Error fetching transactions:", error);
	  throw error;
	}
  };
  
export const logTransaction = async (name, accountID, categoryID, amount, isIncome, note, transactionDate) => {
	try {
	const user = await getCurrentUser();
	
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
	  return transaction;
	} catch (error) {
	  console.error('Error logging transaction:', error);
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
	  console.log('Account created successfully:', newAccount);
	  return newAccount;
	} catch (error) {
	  console.error('Error creating account:', error);
	  throw error;
	}
};