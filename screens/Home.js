import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Groups from './homeScreens/Groups';
import MyProfil from './homeScreens/MyProfil';
import ListProfils from './homeScreens/ListProfils';
import ChatBot from './homeScreens/ChatBot';

const TAB = createMaterialBottomTabNavigator();
export default function Home(props) {
  const currentid = props.route.params.currentid;
  return (
    <TAB.Navigator>
      <TAB.Screen name = "MyProfil" component={MyProfil} initialParams={{currentid:currentid}}></TAB.Screen>
      <TAB.Screen name = "Groups" component={Groups} initialParams={{currentid:currentid}}></TAB.Screen>
      <TAB.Screen name = "ListProfils" component={ListProfils} initialParams={{currentid:currentid}}></TAB.Screen>
      <TAB.Screen name = "ChatBot" component={ChatBot} initialParams={{currentid:currentid}}></TAB.Screen>
    </TAB.Navigator>
  )
}