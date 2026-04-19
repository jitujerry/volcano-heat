// ── FIREBASE.JS ──────────────────────────────────────
// Volcano Heat — Firestore Database Connection
// All database operations live here
// ─────────────────────────────────────────────────────

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── YOUR CONFIG ───────────────────────────────────────
// Replace ALL values below with your real Firebase config
// Get it from: console.firebase.google.com
// → Project Settings → Your apps → </> web icon
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcvX_8tMB0Q-OlDkpIWa5RF2U7lduRlUs",
  authDomain: "volcano-heat.firebaseapp.com",
  projectId: "volcano-heat",
  storageBucket: "volcano-heat.firebasestorage.app",
  messagingSenderId: "175307242833",
  appId: "1:175307242833:web:2a8278f7c92f885a25a770",
  measurementId: "G-MG1S2WMS31"
};

// ── INIT ──────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── ORDERS ────────────────────────────────────────────
// Saves a new order document to the "orders" collection
export async function saveOrder(orderData) {
  try {
    const ref = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    console.log("✅ Order saved to Firebase. ID:", ref.id);
    return ref.id;
  } catch (e) {
    console.error("❌ Order save failed:", e);
    throw e;
  }
}

// ── REVIEWS ───────────────────────────────────────────
// Saves a new review to the "reviews" collection
export async function saveReview(reviewData) {
  try {
    const ref = await addDoc(collection(db, "reviews"), {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    console.log("✅ Review saved to Firebase. ID:", ref.id);
    return ref.id;
  } catch (e) {
    console.error("❌ Review save failed:", e);
    throw e;
  }
}

// Loads all reviews from Firestore, newest first
export async function loadReviews() {
  try {
    const q = query(
      collection(db, "reviews"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (e) {
    console.error("❌ Load reviews failed:", e);
    return [];
  }
}

// ── USERS ─────────────────────────────────────────────
// Saves a new user record when someone signs up
export async function saveUser(userData) {
  try {
    await addDoc(collection(db, "users"), {
      ...userData,
      joinedAt: serverTimestamp()
    });
    console.log("✅ User saved to Firebase.");
  } catch (e) {
    console.error("❌ User save failed:", e);
  }
}