import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchWithTimeout, getAPIUrl } from '../utils/apiConfig';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
}

// Animated typing indicator component
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 150);
    const anim3 = createAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const API_URL = getAPIUrl();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('loginStatus');
      router.replace('/register')
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setHasStartedChat(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText
    };

    const messageText = inputText; // Store before clearing
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const url = `${API_URL}/text_query`;
      console.log('[Chat] API Request:', {
        url,
        method: 'POST',
        messageLength: messageText.length,
        timestamp: new Date().toISOString(),
      });
      
      const response = await fetchWithTimeout(url, {
        method: "POST",
        body: JSON.stringify({
          text_input: messageText
        }),
      }, 30000, 2); // 30 second timeout, 2 retries (3 total attempts)

      console.log('[Chat] Response received:', {
        status: response.status,
        statusText: response.statusText,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Chat] Response data received successfully');
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data?.reply || "Sorry, I couldn't find an answer."
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      // Safely handle error object - it might be null, undefined, or not have expected properties
      const errorName = error?.name || 'Unknown';
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'N/A';
      
      console.error('[Chat] Error occurred:');
      console.error('  - Name:', errorName);
      console.error('  - Message:', errorMessage);
      console.error('  - Code:', errorCode);
      
      let userMsg = '❌ ';
      
      if (errorName === 'AbortError') {
        userMsg += 'Request timeout - The server took too long to respond. Please check your connection or try again.';
      } else if (typeof errorMessage === 'string' && errorMessage.includes('Network')) {
        userMsg += 'Network error - Unable to reach the server. Please check your internet connection.';
      } else if (typeof errorMessage === 'string' && errorMessage.includes('HTTP 50')) {
        userMsg += 'Server error - The server is having issues. Please try again in a moment.';
      } else if (typeof errorMessage === 'string' && errorMessage.includes('HTTP 40')) {
        userMsg += 'Request error - There was an issue with your request. Please try again.';
      } else if (typeof errorMessage === 'string' && errorMessage.includes('HTTP')) {
        userMsg += `Server error: ${errorMessage}`;
      } else {
        userMsg += (typeof errorMessage === 'string' ? errorMessage : 'Unknown error occurred. Please try again.');
      }
      
      // Add retry suggestion for network errors
      if (errorName === 'AbortError' || (typeof errorMessage === 'string' && errorMessage.includes('Network'))) {
        userMsg += ' [Automatically retried, but still failed]';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: userMsg
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loginStatus = await AsyncStorage.getItem('loginStatus');

        if (loginStatus === 'success') {
          setLoading(false);
        } else {
          navigation.navigate('newlogin' as never);
        }
      } catch (error) {
        console.error('Error reading login status:', error);
        navigation.navigate('newlogin' as never);
      }
    };

    checkLoginStatus();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.container}>
        {!hasStartedChat ? (
          // Landing View - Centered Chat Box
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.landingContainer}
          >
          <Text style={styles.landingTitle}>QueryMe AI</Text>
          <Text style={styles.landingSubtitle}>Ask anything</Text>
          
          <View style={styles.centeredInputWrapper}>
            <TextInput
              style={styles.centeredTextInput}
              placeholder="Message QueryMe..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.centeredSendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        // Chat View - Messages at Top, Input at Bottom
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatViewContainer}
        >
          <>
            {/* Header Bar */}
            <View style={styles.headerBar}>
              <View style={styles.headerIndicator}>
                <View style={styles.assistantIndicator} />
              </View>
              <Text style={styles.headerTitle}>QueryMe AI Assistant</Text>
              
            </View>

            {/* Messages Container */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.type === 'user' ? styles.userMessage : styles.assistantMessage
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      message.type === 'user' ? styles.userBubble : styles.assistantBubble
                    ]}
                  >
                    {message.type === 'assistant' ? (
                      <Markdown
                        style={{
                          text: {
                            color: '#000',
                            fontSize: 15,
                            lineHeight: 22,
                          },
                          paragraph: {
                            color: '#000',
                            marginBottom: 8,
                          },
                          code_inline: {
                            backgroundColor: '#e5e5e5',
                            paddingHorizontal: 4,
                            borderRadius: 4,
                            color: '#000',
                          },
                        }}
                      >
                        {message.content}
                      </Markdown>
                    ) : (
                      <Text style={styles.messageText}>{message.content}</Text>
                    )}
                  </View>
                </View>
              ))}

              {isLoading && (
                <View style={styles.messageBubble}>
                  <View style={styles.assistantBubble}>
                    <TypingIndicator />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Floating Input Area at Bottom */}
            <View style={styles.floatingInputArea}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Message QueryMe..."
                  placeholderTextColor="#999"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        </KeyboardAvoidingView>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff"
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  // Landing Screen Styles
  landingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    backgroundImage: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
  },
  chatViewContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  landingTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  landingSubtitle: {
    fontSize: 20,
    color: "#999",
    textAlign: "center",
    marginBottom: 50,
    fontWeight: "400",
    letterSpacing: 0.2,
    lineHeight: 28,
  },
  centeredInputWrapper: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "column",
    backgroundColor: "#ffffff",
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: "#0084ff",
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  centeredTextInput: {
    fontSize: 17,
    color: "#1a1a1a",
    maxHeight: 140,
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e8eaed",
    fontWeight: "500",
    lineHeight: 24,
  },
  centeredSendButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 18,
    backgroundColor: "#0084ff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: "#0084ff",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  // Chat Screen Styles
  headerBar: {
    backgroundColor: "#0084ff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  headerIndicator: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerPlaceholder: {
    width: 40,
  },
  assistantIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10dd10",
    shadowColor: "#10dd10",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  logoutButton: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    marginVertical: 10,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  assistantMessage: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  userBubble: {
    backgroundColor: "#0084ff",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0084ff",
    opacity: 0.6,
  },
  typingText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "500",
  },
  floatingInputArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f8f9fa",
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e8eaed",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    maxHeight: 100,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontWeight: "500",
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
    backgroundColor: "#0084ff",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 42,
    shadowColor: "#0084ff",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 0.4,
  },
});
