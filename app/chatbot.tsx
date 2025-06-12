// ChatbotScreen.tsx

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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

  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

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

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.4,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.4,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.4,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      dot1Opacity.setValue(0.4);
      dot2Opacity.setValue(0.4);
      dot3Opacity.setValue(0.4);
    }
  }, [isLoading, dot1Opacity, dot2Opacity, dot3Opacity]);

  const sendMessage = async () => {
    if (!inputText.trim() || !userId) return;

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
      const response = await fetch(
        'https://n8n-production-b59a.up.railway.app/webhook/ba65b513-ba7e-495c-b5a4-5583b17bec0b',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: 'exp://192.168.1.3:8081',
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
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
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

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
      >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => {
              const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubbleContainer,
                    { justifyContent: message.isUser ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  {!message.isUser ? (
                    <>
                      <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                          <Ionicons name="logo-electron" size={18} color="#3b82f6" />
                        </View>
                      </View>
                      <View style={[styles.messageBubble, styles.botMessageBubble]}>
                        <Text style={styles.botMessageText}>{message.text}</Text>
                        <Text style={styles.botTimestamp}>{time}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.messageBubble, styles.userMessageBubble]}>
                        <Text style={styles.userMessageText}>{message.text}</Text>
                        <Text style={styles.userTimestamp}>{time}</Text>
                      </View>
                      <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.userAvatar]}>
                          <Ionicons name="person" size={18} color="#3b82f6" />
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })}

            {isLoading && (
              <View style={[styles.messageBubbleContainer, { justifyContent: 'flex-start' }]}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Ionicons name="logo-electron" size={18} color="#3b82f6" />
                  </View>
                </View>
                <View style={[styles.messageBubble, styles.botMessageBubble, styles.loadingBubble]}>
                  <View style={styles.typingIndicator}>
                    <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
                    <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
                    <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
                  </View>
                </View>
              </View>
            )}
            <View style={styles.messageEndPadding} />
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#6B7280"
              style={styles.textInput}
              multiline={Platform.OS !== 'web'}
              maxLength={500}
              textAlignVertical="center"
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
                size={20}
                color={!inputText.trim() || isLoading ? '#9CA3AF' : 'white'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', marginLeft: 16, color: '#111827' },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messagesContentContainer: { paddingBottom: 20, paddingTop: 8 },
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    maxWidth: '70%',
  },
  userMessageBubble: { backgroundColor: '#3b82f6' },
  botMessageBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userMessageText: { fontSize: 16, color: 'white', lineHeight: 22 },
  botMessageText: { fontSize: 16, color: '#1f2937', lineHeight: 22 },
  userTimestamp: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  botTimestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginRight: 8,
    color: '#1f2937',
    maxHeight: 120,
    minHeight: Platform.OS === 'web' ? 44 : 40,
    textAlign: 'left',
    ...(Platform.OS === 'web' && {
      textAlign: 'left',
      height: 44,
      lineHeight: 24,
    }),
  },
  sendButton: {
    padding: 10,
    borderRadius: 9999,
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: { backgroundColor: '#D1D5DB' },
  avatarContainer: {
    width: 40,
    height: 40,
    alignSelf: 'flex-end',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
  },
  userAvatar: {
    backgroundColor: '#EBF5FF',
    borderColor: '#BFDBFE',
  },
  loadingBubble: {
    minWidth: 76,
    minHeight: 36,
    justifyContent: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
    marginHorizontal: 3,
    opacity: 0.6,
  },
  messageEndPadding: {
    height: 20,
  },
});

export default ChatbotScreen;
