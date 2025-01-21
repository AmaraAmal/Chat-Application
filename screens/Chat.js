import React, { useState, useEffect } from "react";
import { 
  KeyboardAvoidingView, 
  FlatList, 
  ImageBackground, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Linking, Keyboard,
  Alert,
  Modal
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Button, TextInput } from "react-native-paper";
import firebase from "../Config";
import * as DocumentPicker from "expo-document-picker";
import { Video, Audio} from "expo-av"; 
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { supabase } from "../Config"; 
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; 
import * as ImagePicker from 'expo-image-picker';

const database = firebase.database();
const ref_discussions = database.ref("Discussions");

export default function Chat(props) {
  const currentid = props.route.params.currentid;
  const secondid = props.route.params.secondid;
  const iddisc = currentid > secondid ? currentid + secondid : secondid + currentid;
  const ref_onediscussion = ref_discussions.child(iddisc);
  const ref_messages = ref_onediscussion.child("Messages")
  const ref_typing_status = ref_onediscussion.child("TypingStatus")
  const ref_secondid_istyping = ref_typing_status.child(secondid + "isTyping");
  const ref_currentid_istyping = ref_typing_status.child(currentid + "isTyping");

  const [message, setMessage] = useState("");
  const [data, setData] = useState([]);
  const [secondIsTyping, setSecondIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null); 
  const [secondUserOnline, setSecondUserOnline] = useState(false);
  const [recording, setRecording] = useState(null);
  const [msgIsSeen, setSeen] = useState(false);
  const [profileData, setProfileData] = useState({
    linkImage: "LINK",
    nickname: { nickname: "Default Nickname" },
  });
  const [participantsData, setParticipantsData] = useState({});

  const ref_chatStatus = ref_onediscussion.child("ChatStatus").child(currentid + "Viewing");
  ref_chatStatus.set(true);
  const ref_chatStatus2 = ref_onediscussion.child("ChatStatus").child(secondid + "Viewing");
  //ref_chatStatus2.set(false)

  const [nickname, setNickname] = useState('');
const [isModalVisible, setModalVisible] = useState(false);

// Handle modal visibility
const openNicknameModal = () => {
  setModalVisible(true);
};

const closeNicknameModal = () => {
  setModalVisible(false);
};

const saveNickname = () => {
  const ref_nicknames = database.ref(`ProfilsList/oneProfil${secondid}`);
  ref_nicknames.child("nickname").set({ nickname })
    .then(() => {
      alert("Nickname saved!");
      closeNicknameModal();
    })
    .catch((error) => alert("Failed to save nickname: " + error.message));
};


  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location is required!');
        return;
      }
      
      const { coords } = await Location.getCurrentPositionAsync({});
      const locationUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;

      const msgKey = ref_messages.push().key;
      await ref_messages.child(msgKey).set({
        message: locationUrl,
        time: new Date().toLocaleString(),
        sender: currentid,
        receiver: secondid,
        attachment: null,
        seen: false
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const startRecording = async () => {
    try {

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
  
      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recordingInstance.startAsync();
  
      setRecording(recordingInstance); 
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const stopRecording = async () => {
    try {
      if (!recording) {
        console.error("No recording instance available");
        return;
      }
  
      console.log("Stopping recording...");
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); 
      console.log("Recording stopped and stored at", uri);

      const audioFile = {
        uri: uri,
        name: `recording-${Date.now()}.mp3`,
        type: "audio/mpeg",
      };
      setRecording(null);

      console.log("Sending recording as message...");
      await sendFileMessage(audioFile);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };
  
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, 
        aspect: [4, 3], 
        quality: 1, 
      });
      if (!result.canceled) {
        const cameraFile = {
          uri: result.assets[0].uri,
          name: `photo-${Date.now()}.jpeg`,
          type: result.assets[0].mimeType,
        };
        console.log("CAMERA FILE:", cameraFile)
        sendFileMessage(cameraFile); 
      }
    } else {
      alert('Permission to access camera is required.');
    }
  };

  const handleDeleteMessage = (messageKey) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const ref_message_to_delete = ref_messages.child(messageKey);
              await ref_message_to_delete.remove();
              alert("Message deleted successfully!");
            } catch (error) {
              console.error("Failed to delete message:", error);
            }
          },
        },
      ]
    );
  };
  

  useEffect(() => {
    if (secondid.startsWith("group-")) {
      const ref_group = database.ref(`Groups/${secondid}/participants`);
      ref_group.once("value", (snapshot) => {
        const participants = snapshot.val();
        const participantsInfo = {};
  
        const fetchParticipantDetails = async () => {
          const promises = Object.keys(participants).map(async (userId) => {
            const ref_user = database.ref(`ProfilsList/oneProfil${userId}`);
            const userSnapshot = await ref_user.once("value");
            const userData = userSnapshot.val();
            if (userData) {
              participantsInfo[userId] = {
                prenom: userData.prenom,
                nom: userData.nom,
                linkImage: userData.linkImage,
              };
            }
          });
  
          await Promise.all(promises);
          setParticipantsData(participantsInfo);
        };
  
        fetchParticipantDetails();
      });
    }
    const ref_target = secondid.startsWith("group-") 
    ? database.ref(`Groups/${secondid}/messages`)
    : ref_messages; 

    ref_target.on("value", (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        const messageData = childSnapshot.val();
        messages.push({ key: childSnapshot.key, ...messageData });
      });
      setData(messages);
    });

    ref_chatStatus2.on("value", (snapshot) => {
      setSeen(snapshot.val());
    });

    ref_secondid_istyping.on("value", (snapshot) => {
      setSecondIsTyping(snapshot.val());
    });

    const ref_secondProfil = database.ref(`ProfilsList/oneProfil${secondid}`);
    const onlineListener = ref_secondProfil.child("online").on("value", (snapshot) => {
      setSecondUserOnline(snapshot.val() === true);
    });

    const keyboardDidShow = () => ref_currentid_istyping.set(true);
    const keyboardDidHide = () => ref_currentid_istyping.set(false);

    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", keyboardDidShow);
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", keyboardDidHide);

    const ref_oneProfil = database.ref(`ProfilsList/oneProfil${secondid}`);
    ref_oneProfil.on("value", (snapshot) => {
      const profilevals = snapshot.val();
      if (profilevals) {
        setProfileData(profilevals);
      } else {
        console.log(`No profile data found for secondid: ${secondid}`);
      }
    });

    return () => {
      ref_onediscussion.off();
      ref_secondid_istyping.off();
      ref_secondProfil.child("online").off("value", onlineListener);
      //ref_chatStatus.set(false);
      keyboardShowListener.remove();
      keyboardHideListener.remove();
      ref_oneProfil.off();
    };
  }, [currentid, secondid]);

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
  
      console.log("Result object:", result);
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setAttachment(selectedFile);
        sendFileMessage(selectedFile)

      } else {
        console.log("FILE NOT SELECTED");
      }
    } catch (error) {
      console.error("File selection error:", error);
    }
  };
  
  const uploadFileToSupabase = async (file) => {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();
    await supabase.storage.from("ProfilImages").upload(`attachments/${currentid}/${file.name}`,arraybuffer, {contentType: blob.type});
    const {data} = supabase.storage.from("ProfilImages").getPublicUrl(`attachments/${currentid}/${file.name}`);
    return data;
  };

  const sendMessage = async () => {
    try {
      if (!message.trim()) {
        alert("Cannot send an empty message!");
        return;
      }
    const isGroupChat = secondid.startsWith("group-");
    const ref_target = isGroupChat
      ? database.ref(`Groups/${secondid}/messages`)
      : ref_messages;

      const msgKey = ref_target.push().key;
  
      const newMessage = {
        message:message,
        time: new Date().toLocaleString(),
        sender: currentid,
        receiver: secondid,
        attachment: null,
        seen: false,
      };
      await ref_target.child(msgKey).set(newMessage);
      console.log("Message sent:", newMessage);
  
      setMessage("");
      ref_chatStatus2.set(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const sendFileMessage = async (file = null) => {
    try {
      {/*if (!file && !message.trim()) {
        alert("Cannot send an empty message!");
        return;
      }*/}
        
      const isGroupChat = secondid.startsWith("group-");
      const ref_target = isGroupChat
      ? database.ref(`Groups/${secondid}/messages`)
      : ref_messages;
      const msgKey = ref_target.push().key;

      //const msgKey = ref_messages.push().key;
      //const ref_onemessage = ref_messages.child(msgKey);
  
      const newMessage = {
        message:"Sent an attachment",
        time: new Date().toLocaleString(),
        sender: currentid,
        receiver: secondid,
        attachment: null,
        seen: false,
      };
  
      if (file) {
        console.log("Uploading file...");
        const attachmentUrl = await uploadFileToSupabase(file);
        if (attachmentUrl) {
          newMessage.attachment = attachmentUrl;
          console.log("Attachment uploaded:", attachmentUrl);
        } else {
          console.error("Failed to upload attachment.");
          return;
        }
      }
      await ref_target.child(msgKey).set(newMessage);
      //await ref_onemessage.set(newMessage);
      console.log("Message sent:", newMessage);
  
      // Reset the message input and attachment
      setMessage("");
      setAttachment(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  return (
    <ImageBackground
      source={require("../assets/Acc_Backgrd.png")}
      style={styles.container}
    >
     <View style={styles.userInfoBar}>
      {!secondid.startsWith("group-") && profileData && (
        <>
          {profileData?.linkImage && (
            <Image source={{ uri: profileData.linkImage }} style={styles.userImage} />
          )}
          {profileData?.nickname ? (
            <Text style={styles.userName}>{profileData.nickname.nickname}</Text>
          ) : (
            <Text style={styles.userName}>Nickname not set</Text>
          )}
          <TouchableOpacity onPress={openNicknameModal}>
            <Text style={styles.setNicknameText}>Set Nickname</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeNicknameModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.nicknameInput}
            placeholder="Enter nickname"
            value={nickname}
            onChangeText={setNickname}
          />
          <TouchableOpacity onPress={saveNickname} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeNicknameModal} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.chatContainer} behavior="padding">
      <FlatList
  style={styles.messageList}
  data={data}
  renderItem={({ item }) => {
    const isSender = item.sender === currentid;
    const isGroupChat = secondid.startsWith("group-");
    const senderName =
      isGroupChat && participantsData[item.sender]
        ? `${participantsData[item.sender].prenom} ${participantsData[item.sender].nom}`
        : item.sender; // Default to sender ID if no data is found.

    const color = isSender ? "purple" : "#75c7fb";
    const flex = isSender ? "flex-end" : "flex-start";

    return (
      <TouchableOpacity
        onLongPress={() => handleDeleteMessage(item.key)}
        style={[styles.messageContainer, { backgroundColor: color, alignSelf: flex }]}
      >
        {!isSender && isGroupChat && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        {item.message?.startsWith("https://www.google.com/maps?q=") ? (
          <TouchableOpacity onPress={() => Linking.openURL(item.message)}>
            <Text style={[styles.locationLink, { color: "blue" }]}>View Location</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.messageText}>{item.message}</Text>
        )}
        {item.attachment?.publicUrl && (
          <TouchableOpacity onPress={() => Linking.openURL(item.attachment.publicUrl)}>
            {item.attachment.publicUrl.endsWith(".jpg") ||
            item.attachment.publicUrl.endsWith(".jpeg") ||
            item.attachment.publicUrl.endsWith(".png") ? (
              <Image source={{ uri: item.attachment.publicUrl }} style={styles.attachmentImage} />
            ) : item.attachment.publicUrl.endsWith(".mp4") ? (
              <Video
                source={{ uri: item.attachment.publicUrl }}
                style={styles.attachmentVideo}
                useNativeControls
              />
            ) : item.attachment.publicUrl.endsWith(".mp3") ? (
              <View style={styles.audioContainer}>
                <Text style={styles.audioLabel}>Audio Message:</Text>
                <Video
                  source={{ uri: item.attachment.publicUrl }}
                  style={styles.audioPlayer}
                  useNativeControls
                  audioOnly={true}
                />
              </View>
            ) : (
              <Text style={styles.attachmentFile}>Open Attachment</Text>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.timeText}>{item.time}</Text>
      </TouchableOpacity>
    );
  }}
  ListEmptyComponent={() => <Text style={{ textAlign: "center", marginTop: 20 }}>No messages to display.</Text>}
/>

  {msgIsSeen && <Text style={styles.typingIndicator}>SEEN</Text>}
  {secondIsTyping && <Text style={styles.typingIndicator}>is Typing...</Text>}

  <View style={styles.inputRow}>
    <TextInput
      //onFocus={() => ref_currentid_istyping.set(true)}
      //onBlur={() => ref_currentid_istyping.set(false)}
      style={styles.textInput}
      onChangeText={setMessage}
      value={message}
      placeholder="Type a message"
    />
    <TouchableOpacity onPress={sendMessage}>
      <Icon name="send" size={28} color="#4CAF50" />
    </TouchableOpacity>
  </View>

  <View style={styles.buttonRow}>
    <TouchableOpacity onPress={selectFile}>
      <Icon name="paperclip" size={28} color="#000" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
      <Text>📷</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={startRecording}>
      <Icon name="microphone" size={28} color="#F44336" />
    </TouchableOpacity>
    <TouchableOpacity onPress={stopRecording}>
      <Icon name="stop" size={28} color="#000" />
    </TouchableOpacity>
    <TouchableOpacity onPress={sendLocation}>
      <Icon name="map-marker" size={28} color="#2196F3" />
    </TouchableOpacity>
    <TouchableOpacity
  style={styles.mediaButton}
  onPress={() => props.navigation.navigate("MediaHistory", { currentid, secondid })}>
  <Text style={styles.mediaButtonText}>Media</Text>
</TouchableOpacity>

  </View>
</KeyboardAvoidingView>
</ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  recordButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  locationButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#4caf50',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  userInfoContainer: {
    marginTop: 40,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  chatContainer: {
    flex: 1,
    justifyContent: "space-between",
    marginTop:25,
    marginRight:10
  },
  messageList: {
    flex: 1,
    marginTop: 10,
    marginLeft:10
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    maxWidth: "70%",
  },
  messageText: {
    fontSize: 16,
     color: "#fff"
  },
  timeText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  typingIndicator: {
    color: "purple",
    fontSize: 14,
    marginBottom: 10,
    marginLeft:10,
    alignSelf: "flex-end"
    
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    marginVertical: 5,
  },
  textInput: {
    flex: 1,
    height: 45,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
    marginBottom: 10
  },
  sendButton: {
    backgroundColor: "purple",
    justifyContent: "center",
  },
  attachmentButton: {
    marginLeft: 10,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    marginTop: 5,
    borderRadius: 5,
  },
  attachmentVideo: {
    width: 150,
    height: 100,
    marginTop: 5,
  },
  attachmentFile: {
    fontSize: 14,
    color: "#4CAF50",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  audioContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  audioLabel: {
    fontSize: 14,
    color: "gray",
    marginBottom: 3,
  },
  audioPlayer: {
    width: 200,
    height: 30,
  },
  locationLink: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
  senderName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },
  userInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginTop:20
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  setNicknameText: {
    color: "#8b458f",
    fontSize: 16,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
  },
  nicknameInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#8b458f",
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
  },
  mediaButtonText:{
    marginTop:5,
    fontSize:15, 
    fontWeight: "bold"

  }
});
