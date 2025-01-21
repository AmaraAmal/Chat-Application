// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { createClient } from '@supabase/supabase-js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdcjMfrGBSWFoW1YTkwxQ4UxqDLsojRys",
  authDomain: "whatsappclone-d4f84.firebaseapp.com",
  databaseURL: "https://whatsappclone-d4f84-default-rtdb.firebaseio.com",
  projectId: "whatsappclone-d4f84",
  storageBucket: "whatsappclone-d4f84.firebasestorage.app",
  messagingSenderId: "248873935135",
  appId: "1:248873935135:web:1301ebd55bbfd67cc8502a"
};

const supabaseUrl = "https://duggzbjgkidkvrugumkx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Z2d6Ympna2lka3ZydWd1bWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MzQyOTUsImV4cCI6MjA0ODExMDI5NX0.j4ekVNtYVBjOy3svX59dOXR0OWcI-zC8FIYEDQJKtCg";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);
export default firebase;
export {supabase};