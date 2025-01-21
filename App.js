import { View, Text } from 'react-native'
import React from 'react'
import Auth from './screens/Auth'
import Home from './screens/Home'
import NewUser from './screens/NewUser'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Chat from './screens/Chat'
import MediaHistory from './screens/homeScreens/MediaHistory'
import ChatBot from './screens/homeScreens/ChatBot'
const STACK = createNativeStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <STACK.Navigator screenOptions={{headerShown:false}}>
        <STACK.Screen name='Auth' component={Auth}></STACK.Screen>
        <STACK.Screen name='Home' component={Home}></STACK.Screen>
        <STACK.Screen name='NewUser' component={NewUser} options={{headerShown: true}}></STACK.Screen>
        <STACK.Screen name='Chat' component={Chat}></STACK.Screen>
        <STACK.Screen name='MediaHistory' component={MediaHistory}></STACK.Screen>
        <STACK.Screen name='ChatBot' component={ChatBot}></STACK.Screen>
      </STACK.Navigator>
    </NavigationContainer>
  )
}