import { Client, Databases, ID } from 'appwrite';

// Initialize Appwrite
const client = new Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67e4f1be003a228b8e5c');

const databases = new Databases(client);

const config = {
  databaseId: '67e4f34a001bc870e5b0',
  categoryCollectionId: '681a0784002b15439421',
};

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

async function addIncomeCategories() {
  try {
    console.log('Adding income categories...');
    
    for (const category of incomeCategories) {
      const result = await databases.createDocument(
        config.databaseId,
        config.categoryCollectionId,
        ID.unique(),
        category
      );
      console.log(`Added category: ${category.name} (${result.$id})`);
    }
    
    console.log('Successfully added all income categories!');
  } catch (error) {
    console.error('Error adding income categories:', error);
  }
}

// Run the script
addIncomeCategories(); 