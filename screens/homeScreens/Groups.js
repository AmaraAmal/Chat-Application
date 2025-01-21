import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import firebase from "../../Config";

const database = firebase.database();
const ref_profilsList = database.ref("ProfilsList");
const ref_groups = database.ref("Groups");

export default function CreateGroup(props) {
  const currentid = props.route.params.currentid; 
  const [groupName, setGroupName] = useState(""); 
  const [friends, setFriends] = useState([]); 
  const [selectedParticipants, setSelectedParticipants] = useState([]); 
  
  useEffect(() => {
    ref_profilsList.on("value", (snapshot) => {
      const friendsList = [];
      snapshot.forEach((profile) => {
        const profileData = profile.val();
        if (profileData.id !== currentid) {
          friendsList.push(profileData);
        }
      });
      setFriends(friendsList);
    });

    return () => ref_profilsList.off();
  }, [currentid]);

  const toggleParticipantSelection = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    try {
      if (!groupName.trim()) {
        alert("Please enter a group name!");
        return;
      }
      if (selectedParticipants.length === 0) {
        alert("Please select at least one participant!");
        return;
      }
  
      const groupId = ref_groups.push().key;
  
      const participants = [currentid, ...selectedParticipants];
  
      const groupData = {
        groupName,
        createdBy: currentid,
        participants: participants.reduce((acc, userId) => {
          acc[userId] = true;
          return acc;
        }, {}),
        messages: {},
      };
  
      await ref_groups.child("group-"+groupId).set(groupData);
  
      alert(`Group "${groupName}" created successfully!`);
      props.navigation.navigate("ListProfils",{currentid:currentid}); 
    } catch (error) {
      console.error("Error creating group:", error);
      alert("An error occurred while creating the group. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <Text style={styles.subtitle}>Select Participants:</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.participantItem,
              selectedParticipants.includes(item.id) && styles.selectedParticipant,
            ]}
            onPress={() => toggleParticipantSelection(item.id)}
          >
            <Text style={styles.participantText}>{item.nom} {item.prenom}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#8b458f",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  participantItem: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectedParticipant: {
    backgroundColor: "#cce5ff",
    borderColor: "#007bff",
  },
  participantText: {
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
