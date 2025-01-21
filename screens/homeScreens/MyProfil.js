import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import firebase from "../../Config";
import { supabase } from "../../Config";

const database = firebase.database();

export default function MyProfil(props) {
  const currentid = props.route.params.currentid;

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [linkImage, setLinkImage] = useState(null);
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [uriLocalImage, setUriLocalImage] = useState(null);

  useEffect(() => {
    const ref_oneProfil = database.ref(`ProfilsList/oneProfil${currentid}`);
    ref_oneProfil.on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNom(data.nom);
        setPrenom(data.prenom);
        setTelephone(data.telephone);
        setLinkImage(data.linkImage);
        setIsDefaultImage(!data.linkImage);
      }
    });

    return () => ref_oneProfil.off();
  }, [currentid]);

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();
    await supabase.storage
      .from("ProfilImages")
      .upload(`image-${currentid}`, arraybuffer, { contentType: "image/*" });
    const { data } = supabase.storage
      .from("ProfilImages")
      .getPublicUrl(`image-${currentid}`);
    return data.publicUrl;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setIsDefaultImage(false);
      setUriLocalImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    try {
      let updatedImage = linkImage;

      if (uriLocalImage) {
        updatedImage = await uploadImage(uriLocalImage);
      }

      const ref_oneProfil = database.ref(`ProfilsList/oneProfil${currentid}`);
      await ref_oneProfil.update({
        nom,
        prenom,
        telephone,
        linkImage: updatedImage,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile: " + error.message);
    }
  };

  const handleDisconnect = () => {
    firebase.auth().signOut().then(() => {
      props.navigation.navigate("Auth");
      const ref_oneProfil = database.ref(`ProfilsList/oneProfil${currentid}`);
      ref_oneProfil.update({online:false})
    }).catch((error) => {
      alert("Failed to disconnect: " + error.message);
    });
  };

  return (
    <ImageBackground
      source={require("../../assets/Acc_Backgrd.png")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>Manage Account</Text>

      <TouchableHighlight onPress={pickImage}>
        <Image
          source={
            isDefaultImage
              ? require("../../assets/avatar.webp")
              : { uri: uriLocalImage || linkImage }
          }
          style={styles.profileImage}
        />
      </TouchableHighlight>

      <TextInput
        onChangeText={setNom}
        value={nom}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Last Name"
        style={styles.textinputstyle}
      />
      <TextInput
        onChangeText={setPrenom}
        value={prenom}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="First Name"
        style={styles.textinputstyle}
      />
      <TextInput
        onChangeText={setTelephone}
        value={telephone}
        placeholderTextColor="#fff"
        textAlign="center"
        placeholder="Phone Number"
        keyboardType="phone-pad"
        style={styles.textinputstyle}
      />

      <TouchableHighlight
        onPress={saveProfile}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.saveButton}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableHighlight>

      <TouchableHighlight
        onPress={handleDisconnect}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.disconnectButton}
      >
        <Text style={styles.disconnectButtonText}>Disconnect</Text>
      </TouchableHighlight>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  textinputstyle: {
    fontWeight: "bold",
    backgroundColor: "#0004",
    fontSize: 20,
    color: "#fff",
    width: "75%",
    height: 50,
    borderRadius: 10,
    margin: 5,
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "#8b458f",
    fontWeight: "bold",
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    height: 200,
    width: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#8b458f",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  disconnectButton: {
    marginTop: 20,
    backgroundColor: "#75c7fb",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  disconnectButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
