import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, Text, TextInput, View, TouchableOpacity,  } from 'react-native';
import { Button } from 'react-native-paper';
import firebase from '../Config';
import { useEffect } from 'react';
const auth = firebase.auth();
const database = firebase.database();
export default function Auth(props) {
    var email,password;
    
  return (
    <ImageBackground source={require("../assets/background.png")} 
    style={styles.container}>
      <View style={{
        height: 300,
        width: "98%",
        alignItems: 'center',
        borderRadius:50
      }}>
      <StatusBar style="light" />
      <Text style={{
        fontSize: 20,
        fontWeight: "bold",
        color: "purple",
        marginBottom: 50
      }}>Welcome !</Text>
      <TextInput
      onChangeText={(txt)=>{
        email=txt
      }}    
      keyboardType='email-address'
      placeholder='Email@gmail.site' 
      style={styles.textInputStyle}></TextInput>

      <TextInput
      onChangeText={(pwd)=>{
        password=pwd
      }}
      placeholder='Password'
      secureTextEntry={true} 
      style={styles.textInputStyle}></TextInput>
      <View style={{
        flexDirection:"row"
      }}>
      <Button 
      textColor='white'
      onPress={()=>{
        auth.signInWithEmailAndPassword(email,password)
        .then(()=>{
          const currentid = auth.currentUser.uid;

          const ref_oneProfil = database.ref(`ProfilsList/oneProfil${currentid}`);
          ref_oneProfil.update({ online: true });

          ref_oneProfil.onDisconnect().update({ online: false });

          props.navigation.navigate("Home", {currentid:currentid})
        })
        .catch((error)=>{alert(error)});
      }}
      style={{borderRadius:25, backgroundColor:"purple"}} title="submit">Validate</Button>
      <Button textColor='white' style={{borderRadius:25, backgroundColor:"purple", marginLeft: 15}} title="exit">Exit</Button>
      </View>
      <TouchableOpacity 
  onPress={() => {
    props.navigation.navigate("NewUser");
  }} 
  style={{
    backgroundColor: "pink", 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20, 
    alignSelf: "center", 
    marginTop: 20,
  }}
>
  <Text style={{
    color: "white", 
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  }}>
    Create New User
  </Text>
</TouchableOpacity>

      </View>
      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'yellow',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputStyle:{
    borderRadius:10,
    height: 50,
    backgroundColor: "white",
    width : "70%",
    marginBottom: 20,
    paddingLeft: 10
  }
  
});
