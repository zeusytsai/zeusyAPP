// 小土小紅家 - Firebase 設定
// Firebase App（核心）與 Realtime Database SDK 透過 index.html 的 CDN 載入

var firebaseConfig = {
  apiKey: "AIzaSyCA1FVh9V5ZfHM43SGZBXFQH6J01YbUz_A",
  authDomain: "zeusyapp-84f6d.firebaseapp.com",
  databaseURL: "https://zeusyapp-84f6d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zeusyapp-84f6d",
  storageBucket: "zeusyapp-84f6d.firebasestorage.app",
  messagingSenderId: "265951198410",
  appId: "1:265951198410:web:baa3522ce109eced688833"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 匯出資料庫參考（全域可用）
var db = firebase.database();
