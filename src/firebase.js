// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGXhkhZarEhQXdDirSwkP_wgO_YvWUkT4",
  authDomain: "talent-luckyhospitality.firebaseapp.com",
  projectId: "talent-luckyhospitality",
  storageBucket: "talent-luckyhospitality.appspot.com",
  messagingSenderId: "734014152195",
  appId: "1:734014152195:web:abe2bebfb06346b16b7836",
  measurementId: "G-R4YCWMGK55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const storage = getStorage(app);