import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableHighlight,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Button } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import firebase from "../Config";
import { supabase } from "../Config";

const auth = firebase.auth();
const database = firebase.database();

export default function Signup(props) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uriLocalImage, setUriLocalImage] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUriLocalImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri, userId) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    await supabase.storage
      .from("ProfilImages")
      .upload(`image-${userId}`, arraybuffer, {
        contentType: "image/*",
      });

    const { data } = supabase.storage
      .from("ProfilImages")
      .getPublicUrl(`image-${userId}`);
    return data.publicUrl;
  };

  const handleSignup = async () => {
    if (!prenom || !nom || !telephone || !email || !password || !confirmPassword) {
      alert("Please fill out all fields!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await auth.createUserWithEmailAndPassword(email, password);
      const currentid = auth.currentUser.uid;

      const imageUrl = uriLocalImage ? await uploadImage(uriLocalImage, currentid) : null;
      const ref_profilsList = database.ref(`ProfilsList/oneProfil${currentid}`);
      await ref_profilsList.set({
        id: currentid,
        nom,
        prenom,
        telephone,
        linkImage: imageUrl,
        online: true,
      });

      alert("Signup successful!");
      props.navigation.navigate("Home", { currentid: currentid });
    } catch (error) {
      alert("Signup failed: " + error.message);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.title}>Create an Account</Text>

      <TouchableHighlight onPress={pickImage}>
        <Image
          source={
            uriLocalImage
              ? { uri: uriLocalImage }
              : require("../assets/avatar.webp")
          }
          style={styles.profileImage}
        />
      </TouchableHighlight>

      <TextInput
        placeholder="First Name"
        placeholderTextColor="#fff"
        value={prenom}
        onChangeText={setPrenom}
        style={styles.input}
      />
      <TextInput
        placeholder="Last Name"
        placeholderTextColor="#fff"
        value={nom}
        onChangeText={setNom}
        style={styles.input}
      />
      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#fff"
        value={telephone}
        onChangeText={setTelephone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#fff"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#fff"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSignup} style={styles.button}>
        Sign Up
      </Button>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "purple",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  input: {
    width: "80%",
    backgroundColor: "#0004",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: "#fff",
    height: 50,
  },
  button: {
    backgroundColor: "purple",
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
});
