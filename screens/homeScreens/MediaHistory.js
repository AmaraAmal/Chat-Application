import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import firebase from "../../Config";

const database = firebase.database();

export default function MediaHistory({ route }) {
  const { currentid, secondid } = route.params;
  const [media, setMedia] = useState([]);

  useEffect(() => {
    const fetchMedia = async () => {
      const ref_onediscussion = database
        .ref("Discussions")
        .child(currentid > secondid ? currentid + secondid : secondid + currentid);
        const ref_messages = ref_onediscussion.child("Messages")

        ref_messages.on("value", (snapshot) => {
        const sharedMedia = [];
        snapshot.forEach((messageSnapshot) => {
          const message = messageSnapshot.val();
          if (message.attachment?.publicUrl) {
            sharedMedia.push(message.attachment.publicUrl);
          }
        });
        setMedia(sharedMedia);
      });

      return () => ref_onediscussion.off();
    };

    fetchMedia();
  }, [currentid, secondid]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Media</Text>
      {media.length > 0 ? (
        <FlatList
          data={media}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => console.log("Clicked on", item)}>
              <Image source={{ uri: item }} style={styles.mediaImage} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.noMediaText}>No media shared yet!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginTop: 30
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  mediaImage: {
    width: 150,
    height: 150,
    margin: 5,
    borderRadius: 10,
    resizeMode: "cover",
  },
  noMediaText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  mediaButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#8b458f",
    borderRadius: 5,
    alignItems: "center",
  },
  mediaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
