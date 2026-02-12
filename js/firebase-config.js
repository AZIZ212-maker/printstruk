// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDkKSkQIVuV-eVxxyQSO1VhzX6PA2R74Ok",
    authDomain: "print-struk.firebaseapp.com",
    databaseURL: "https://print-struk-default-rtdb.firebaseio.com",
    projectId: "print-struk",
    storageBucket: "print-struk.firebasestorage.app",
    messagingSenderId: "1080514897099",
    appId: "1:1080514897099:web:695c345063d9efbf6be74e",
    measurementId: "G-TDL031ZLKD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Check if Firebase is configured
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY";
}
