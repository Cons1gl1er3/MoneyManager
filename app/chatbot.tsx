import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../lib/appwrite';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatbotScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch user ID when component mounts
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.$id);
          console.log('User ID fetched:', user.$id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();
  }, []);

  // Add initial greeting message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: 'Hello! I\'m your transaction assistant. How can I help you today?',
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !userId) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send message to your webhook with user ID
      const response = await fetch('https://n8n-production-b59a.up.railway.app/webhook/ba65b513-ba7e-495c-b5a4-5583b17bec0b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'exp://192.168.1.3:8081'  // Add your app's origin
        },
        body: JSON.stringify({
          message: inputText,
          timestamp: new Date().toISOString(),
          userId: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Server response data:', data);

      // Add bot response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error.message}. Please try again.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 px-4 pt-12">
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full">
            <Ionicons name="arrow-back" size={24} color={Platform.OS === 'ios' ? '#007AFF' : '#000'} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold ml-4 text-gray-800 dark:text-white">Transaction Assistant</Text>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 mb-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-800'
                }`}
              >
                <Text
                  className={`text-base ${
                    message.isUser ? 'text-white' : 'text-gray-800 dark:text-white'
                  }`}
                >
                  {message.text}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View className="items-start mb-4">
              <View className="bg-gray-200 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <ActivityIndicator size="small" color="#666" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-row items-center mb-4"
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#666"
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-3 mr-2 text-gray-800 dark:text-white"
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-full ${
              !inputText.trim() || isLoading
                ? 'bg-gray-300 dark:bg-gray-700'
                : 'bg-blue-500'
            }`}
          >
            <Ionicons
              name="send"
              size={24}
              color={!inputText.trim() || isLoading ? '#666' : 'white'}
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default ChatbotScreen; 