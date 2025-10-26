import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { removeToken } from "../utils/auth";

export default function LandingPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const checkLogin = async () => {
  //     const token = await getToken();
  //     if (!token) {
  //       router.replace("/login");
  //     }
  //     setLoading(false);
  //   };
  //   checkLogin();
  // }, []);

  const handleLogout = async () => {
    await removeToken();
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading2, setLoading2] = useState(false);

  // Replace this URL with your actual backend or OpenAI API endpoint
  const API_URL = "https://queryme.in/smondoville/app/text_query";

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading2(true);
    setReply("");
    Keyboard.dismiss();

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text_input: query
        }),
      });

      const data = await response.json();
      if (data?.reply) {
        setReply(data.reply);
      } else {
        setReply("Sorry, I couldn’t find an answer.");
      }
    } catch (error) {
      console.log(error);
      setReply("Error fetching response. Please try again.");
    } finally {
      setLoading2(false);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loginStatus = await AsyncStorage.getItem('loginStatus');

        if (loginStatus === 'success') {
          // ✅ Stay on this page
          setLoading(false);
        } else {
          // 🚫 Not logged in — redirect to Login screen
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
    // ⏳ Show loader until check completes
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>QueryMe AI Assistant</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="How can I help you today?"
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {loading2 && <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />}

        {reply ? (
          <View style={styles.responseContainer}>
            <Text style={styles.questionTitle}>Question:</Text>
            <Text style={styles.questionText}>{query}</Text>

            {reply ? (
              <>
                <Text style={styles.replyTitle}>Assistant's Reply:</Text>
                <Text style={styles.replyText}>{reply}</Text>
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* <TouchableOpacity style={styles.button2} onPress={handleLogout}>
        <Text style={styles.buttonText2}>Logout</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b132b" },
  // title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 30 },
  button2: { backgroundColor: "#FF3B30", padding: 15, borderRadius: 10, marginBlock: 20 },
  buttonText2: { color: "#fff", fontWeight: "bold" },

  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c2541",
    borderRadius: 8,
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    flex: 1,
    color: "#000",
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  responseContainer: {
    backgroundColor: "#1c2541",
    borderRadius: 10,
    padding: 20
  },
  questionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },
  questionText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 20,
  },
  replyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },
  replyText: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 24,
  },
});