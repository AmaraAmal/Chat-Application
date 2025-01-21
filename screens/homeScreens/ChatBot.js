import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import firebase from "../../Config";
import Icon from "react-native-vector-icons/Ionicons";


const database = firebase.database();
const chatbotMessagesRef = database.ref("ChatBotMessages");

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");


  useEffect(() => {
    chatbotMessagesRef.on("value", (snapshot) => {
      const data = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        data.push({ id: childSnapshot.key, ...message });
      });
      data.sort((a, b) => a.timestamp - b.timestamp); 
      setMessages(data);
    });

    return () => chatbotMessagesRef.off(); 
  }, []);

  {/*const getChatBotResponse = async (userInput) => {
    const apiKey = ""; 
  
    try {
      const response = await fetch("https://api.tidio.com/contacts/{contactId}/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
        },
        body: JSON.stringify({
          input: userInput,
        }),
      });
  
      const data = await response.json();
      console.log(data)
      return data.output; 
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      return "Sorry, I couldn't process your request.";
    }; */}
  
    const getChatBotResponse = async (userInput) => {
      try {
        const response = await fetch("http://localhost:5000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: userInput }),
        });
        const data = await response.json();
        return data.response;
      } catch (error) {
        console.error("Error:", error);
        return "Sorry, something went wrong.";
      }
    };
    
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message,
      timestamp: Date.now(),
    };

    const messageKey = chatbotMessagesRef.push().key;
    chatbotMessagesRef.child(messageKey).set(userMessage);

    const botReply = await getChatBotResponse(message);
    const botMessage = {
      sender: "bot",
      text: botReply,
      timestamp: Date.now(),
    };

    chatbotMessagesRef.child(chatbotMessagesRef.push().key).set(botMessage);

    setMessage("");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.sender === "user" ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  messageList: { padding: 10 },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    maxWidth: "70%",
  },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#4CAF50" },
  botMessage: { alignSelf: "flex-start", backgroundColor: "#f0f0f0" },
  messageText: { fontSize: 16, color: "#000" },
  inputContainer: { flexDirection: "row", padding: 10, backgroundColor: "#fff" },
  textInput: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  sendButton: { backgroundColor: "#4CAF50", padding: 10, borderRadius: 20, marginLeft: 10 },
});
