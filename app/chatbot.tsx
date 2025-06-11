import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
        text: "Hello! I'm AoraAI, your AI-based transaction assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !userId) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send message to your webhook with user ID
      const response = await fetch(
        'https://n8n-production-b59a.up.railway.app/webhook/ba65b513-ba7e-495c-b5a4-5583b17bec0b',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: 'exp://192.168.1.3:8081', // Add your app's origin
          },
          body: JSON.stringify({
            message: inputText,
            timestamp: new Date().toISOString(),
            userId: userId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Add bot response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${(error as Error).message}. Please try again.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Fine-tune this offset as needed
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Platform.OS === 'ios' ? '#007AFF' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContentContainer}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubbleContainer,
                message.isUser ? styles.userMessage : styles.botMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessageBubble : styles.botMessageBubble,
                ]}
              >
                <Text style={message.isUser ? styles.userMessageText : styles.botMessageText}>
                  {message.text}
                </Text>
                <Text style={message.isUser ? styles.userTimestamp : styles.botTimestamp}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageBubbleContainer, styles.botMessage]}>
              <View style={[styles.messageBubble, styles.botMessageBubble]}>
                <ActivityIndicator size="small" color="#666" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#666"
            style={styles.textInput}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.disabledSendButton,
            ]}
          >
            <Ionicons
              name="send"
              size={24}
              color={!inputText.trim() || isLoading ? '#666' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Using StyleSheet for better organization and performance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // or your dark mode color
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#f0f0f0', // or your dark mode color
    borderRadius: 9999,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#1f2937', // or your dark mode color
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContentContainer: {
    paddingBottom: 20,
  },
  messageBubbleContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
  },
  botMessageBubble: {
    backgroundColor: '#E5E7EB', // or your dark mode color
  },
  userMessageText: {
    fontSize: 16,
    color: 'white',
  },
  botMessageText: {
    fontSize: 16,
    color: '#1f2937', // or your dark mode color
  },
  userTimestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#D1E8FF',
  },
  botTimestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280', // or your dark mode color
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // or your dark mode color
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f0f0f0', // or your dark mode color
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    color: '#1f2937', // or your dark mode color
  },
  sendButton: {
    padding: 12,
    borderRadius: 9999,
    backgroundColor: '#007AFF',
  },
  disabledSendButton: {
    backgroundColor: '#D1D5DB', // or your dark mode color
  },
});

export default ChatbotScreen;