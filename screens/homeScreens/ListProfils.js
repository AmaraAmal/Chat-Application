import { View, Text, ImageBackground, StyleSheet, FlatList, Image, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { StatusBar } from "expo-status-bar";
import firebase from '../../Config';
import React, { useState, useEffect } from 'react';

const database = firebase.database();
const ref_profilsList = database.ref("ProfilsList");
const ref_groups = database.ref("Groups");

export default function ListProfils(props) {
  const currentid = props.route.params.currentid;
  const [friends, setFriends] = useState([]); 
  const [groups, setGroups] = useState([]); 

  useEffect(() => {
    // Fetch friends
    ref_profilsList.on("value", (snapshot) => {
      const friendData = [];
      const lastMessagesPromises = []; // To store promises for fetching last messages
      snapshot.forEach((oneProfil) => {
        if (oneProfil.val().id !== currentid) {
          const friendId = oneProfil.val().id;
          const discussionId =
            currentid > friendId ? currentid + friendId : friendId + currentid;
          const ref_discussion = database.ref(`Discussions/${discussionId}/Messages`);
  
          // Fetch last message
          const lastMessagePromise = ref_discussion.limitToLast(1).once("value").then((snapshot) => {
            const lastMessageSnapshot = snapshot.val();
            let lastMessage = null;
            if (lastMessageSnapshot) {
              const lastKey = Object.keys(lastMessageSnapshot)[0];
              lastMessage = lastMessageSnapshot[lastKey];
            }
            return { friendId, lastMessage };
          });
  
          lastMessagesPromises.push(lastMessagePromise);
  
          friendData.push(oneProfil.val());
        }
      });
  
      // Resolve all last message promises and combine data
      Promise.all(lastMessagesPromises).then((lastMessages) => {
        const friendsWithLastMessages = friendData.map((friend) => {
          const lastMessage = lastMessages.find((msg) => msg.friendId === friend.id)?.lastMessage;
          return { ...friend, lastMessage };
        });
        setFriends(friendsWithLastMessages);
      });
    });
  
    // Fetch groups
    ref_groups.on("value", (snapshot) => {
      const groupData = [];
      snapshot.forEach((group) => {
        const groupDetails = group.val();
        if (groupDetails.participants[currentid]) {
          groupData.push({ ...groupDetails, groupId: group.key });
        }
      });
      setGroups(groupData);
    });
  
    return () => {
      ref_profilsList.off();
      ref_groups.off();
    };
  }, [currentid]);
  

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number not available.");
      return;
    }
    const telUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Error", "Calling is not supported on this device.");
        } else {
          return Linking.openURL(telUrl);
        }
      })
      .catch((err) => {
        console.error("Error while opening the phone dialer", err);
      });
  };

  const renderFriend = ({ item }) => (
    <View style={styles.profileContainer}>
      <Image
        source={{ uri: item.linkImage }}
        style={styles.profileImage}
      />
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{item.nom} {item.prenom}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.smallButton, styles.chatButton]}
              onPress={() => {
                props.navigation.navigate("Chat", {
                  currentid,
                  secondid: item.id,
                });
              }}
            >
              <Icon name="chatbubble-ellipses-outline" size={16} color="#fff" />
            </TouchableOpacity>
  
            <TouchableOpacity
              style={[styles.smallButton, styles.callButton]}
              onPress={() => handleCall(item.telephone)}
            >
              <Icon name="call-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 5,
              backgroundColor: item.online ? "green" : "gray",
              marginRight: 5,
              marginTop:-30
            }}
          />
          <View>
            <Text style={styles.statusText}>
              {item.online ? "Online" : "Offline"}
            </Text>
            <Text style={styles.lastMessageText}>
              {item.lastMessage ? item.lastMessage.message : "No messages yet"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
  

  const renderGroup = ({ item }) => (
    <View style={styles.groupContainer}>
      <Text style={styles.groupName}>{item.groupName}</Text>
      <TouchableOpacity
        style={styles.groupChatButton}
        onPress={() => {
          props.navigation.navigate("Chat", {
            currentid,
            secondid: item.groupId,
          });
        }}
      >
        <Icon name="chatbubble-ellipses-outline" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../assets/Acc_Backgrd.png")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>Friends & Groups</Text>

      <Text style={styles.subtitle}>Groups</Text>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.groupId}
        style={styles.list}
      />

      <Text style={styles.subtitle}>Friends</Text>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f4",
  },
  textstyle: {
    fontSize: 35,
    fontFamily: "serif",
    color: "#8b458f",
    fontWeight: "bold",
    marginTop: 30,
  },
  profileContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "#e0e0e0",
    elevation: 2,
  },
  chatButton: {
    backgroundColor: "#8b458f",
  },
  callButton: {
    backgroundColor: "#4caf50",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#888",
    marginRight: 10,
    marginTop:10
  },
  lastMessageText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  list: {
    width: "95%",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#4caf50",
  },
  groupContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  groupChatButton: {
    backgroundColor: "#4caf50",
    padding: 8,
    borderRadius: 5,
  },
});

