# 🌱 Parivartan – Smart Waste Management Platform

A modern, scalable platform empowering waste management partners and communities to collaborate for a cleaner and greener environment.

Parivartan combines **waste collection operations**, **community engagement**, and **admin intelligence** into one unified ecosystem.

---

## 🚀 Key Highlights

* ♻️ Smart Waste Collection System
* 🤝 Community Engagement (Social Feature)
* 📊 Real-time Analytics Dashboard
* 🛡️ Admin Moderation & Monitoring
* 🎁 Reward-Based Incentive System
* 📍 Location & Route Optimization

---

## 📱 Platform Modules

### 1️⃣ Partner Platform (Web App)

Designed for waste collection partners to efficiently manage operations.

**Features:**

* 🔐 Secure Authentication (Login/Signup)
* 📦 Waste Request Management
* 📊 Real-time Dashboard (Active, Completed, Impact)
* 🗺️ Route Optimization
* 🌍 Environmental Impact Tracking
* 🎁 Rewards & Voucher Redemption
* 👤 Profile Management
* ⏰ Availability Confirmation System

---

### 2️⃣ Community Feature (Mobile App)

A social platform where users contribute to sustainability.

**Features:**

* 📝 Create posts (recycling activities, awareness)
* ❤️ Like, 💬 Comment, 🔄 Share
* 🌱 Promote eco-friendly habits
* 👥 Build a sustainability-driven community

---

### 3️⃣ Admin Dashboard (Web Panel)

Advanced monitoring and control system for platform management.

**Community Moderation Features:**

* 👁️ View all community posts
* 🚩 Flag inappropriate content
* ❌ Delete posts/comments
* 📊 Monitor engagement (likes, comments)
* ⚡ Real-time updates using Firestore
* 🛡️ Content control system (basic moderation)

---

## 🛠️ Tech Stack

### Frontend

* React 18
* TypeScript
* Tailwind CSS
* Vite

### Backend & Services

* Firebase Authentication
* Firestore Database
* Cloudinary (File Storage)

### Additional Tools

* Recharts (Analytics)
* React Router (Navigation)

---

## 🔥 Firebase Setup

1. Go to Firebase Console
2. Create a new project

### Enable Authentication

* Go to Authentication → Sign-in method
* Enable Email/Password

### Enable Firestore

* Create database in production mode

### Get Config

* Project Settings → Web App → Copy config

---

## ☁️ Cloudinary Setup

Used as a free alternative to Firebase Storage.

1. Create account on Cloudinary
2. Get Cloud Name
3. Create Upload Preset
4. Add credentials to `.env`

---

## 🗄️ Firestore Database Structure

### 📌 communityPosts (NEW 🔥)

```json
{
  "caption": "string",
  "comments": 0,
  "createdAt": "timestamp",
  "imageUrl": "string",
  "likedBy": ["userId"],
  "likes": 2,
  "userId": "string",
  "userName": "string"
}
```

---

### 📌 partners

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "organization": "string",
  "status": "pending | approved",
  "rewardPoints": 1000
}
```

---

### 📌 wasteRequests

```json
{
  "type": "Plastic",
  "quantity": "10kg",
  "status": "Assigned | Completed",
  "location": "string"
}
```

---

### 📌 vouchers

```json
{
  "title": "Gift Card",
  "pointsRequired": 1000,
  "status": "available"
}
```

---

## ⚙️ Installation & Setup

```bash
git clone <repo-url>
cd parivartan
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create `.env` file:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Gemini AI
VITE_GEMINI_API_KEY=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

---

## 📁 Project Structure

```
src/
├── components/
├── config/
├── hooks/
├── pages/
├── services/
├── types/
├── App.tsx
├── main.tsx
```

---

## 🌟 Unique Features

* 🔄 Community-driven waste awareness
* 📊 Real-time admin monitoring
* 🤖 AI-ready architecture (future scope)
* 🎯 Incentive-based recycling model

---

## 🚀 Future Enhancements

* AI-based content moderation
* Smart waste classification
* Gamification system
* Advanced analytics dashboard

---

## 📌 Vision

> "Empowering communities to take small steps toward a sustainable future through technology."

---

## 👩‍💻 Developed By

Team Aarambha 💚
