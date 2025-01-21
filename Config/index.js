// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { createClient } from '@supabase/supabase-js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "whatsappclone-d4f84.firebaseapp.com",
  databaseURL: "https://whatsappclone-d4f84-default-rtdb.firebaseio.com",
  projectId: "whatsappclone-d4f84",
  storageBucket: "whatsappclone-d4f84.firebasestorage.app",
  messagingSenderId: "",
  appId: ""
};

const supabaseUrl = "https://duggzbjgkidkvrugumkx.supabase.co";
const supabaseKey = "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);
export default firebase;
export {supabase};