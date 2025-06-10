import { Client, Databases } from 'appwrite';

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

async function updateExpenseCategories() {
  try {
    console.log('Fetching existing categories...');
    
    // Get all categories that don't have a type field (existing expense categories)
    const categories = await databases.listDocuments(
      config.databaseId,
      config.categoryCollectionId
    );
    
    console.log(`Found ${categories.documents.length} categories`);
    
    // Update each category that doesn't have a type to be 'expense'
    for (const category of categories.documents) {
      if (!category.type) {
        const result = await databases.updateDocument(
          config.databaseId,
          config.categoryCollectionId,
          category.$id,
          { type: 'expense' }
        );
        console.log(`Updated category: ${category.name} to expense type`);
      } else {
        console.log(`Category ${category.name} already has type: ${category.type}`);
      }
    }
    
    console.log('Successfully updated all expense categories!');
  } catch (error) {
    console.error('Error updating expense categories:', error);
  }
}

// Run the script
updateExpenseCategories(); 