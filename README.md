# Parivartan - Waste Management Partner Platform

A modern web application for waste management partners to manage waste collection requests, track impact, and redeem rewards.

## Features

- **Partner Authentication**: Secure signup and login for waste management partners
- **Waste Request Management**: View, accept, and update waste collection requests
- **Real-time Dashboard**: Track active requests, completed pickups, and impact metrics
- **Location & Routes**: Optimized routing for waste collection
- **Impact Analytics**: Visualize environmental impact and performance metrics
- **Rewards System**: Earn points for completed pickups and redeem vouchers
- **Profile Management**: Manage partner information and preferences

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Charts**: Recharts
- **Routing**: React Router

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)

2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider

3. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode

4. Enable Storage (optional, for document uploads):
   - Go to Storage
   - Create storage bucket

5. Get your Firebase config:
   - Go to Project settings > General
   - Scroll to "Your apps" section
   - Click "Add app" > Web app
   - Copy the config object

6. Update `src/config/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

## Firestore Data Structure

### Partners Collection
```json
{
  "id": "user-uid",
  "name": "Partner Name",
  "email": "partner@example.com",
  "phone": "+91-XXXXXXXXXX",
  "organization": "Company Name",
  "partnerType": "Individual/Organization",
  "address": "Full Address",
  "status": "pending|approved",
  "documents": ["doc1.pdf", "doc2.pdf"],
  "rewardPoints": 1250,
  "createdAt": "2025-12-26T10:00:00Z"
}
```

### Waste Requests Collection
```json
{
  "id": "request-id",
  "partnerId": "partner-uid",
  "image": "https://example.com/image.jpg",
  "type": "Plastic Bottles",
  "confidence": 95,
  "quantity": "10 kg",
  "location": "Downtown Area",
  "status": "Assigned|Accepted|In Progress|Completed",
  "date": "2025-12-26T10:00:00Z",
  "createdAt": "2025-12-26T09:00:00Z"
}
```

### Impact Metrics Collection (per partner)
```json
{
  "wasteProcessed": 1250,
  "co2Reduction": 375,
  "updatedAt": "2025-12-26T10:00:00Z"
}
```

### Vouchers Collection
```json
{
  "id": "voucher-id",
  "title": "₹500 Amazon Gift Card",
  "description": "Redeem for ₹500 Amazon gift card",
  "pointsRequired": 1000,
  "image": "https://example.com/voucher.jpg",
  "category": "Gift Cards",
  "status": "available|redeemed",
  "redeemedDate": "2025-12-26T10:00:00Z",
  "redeemedBy": "partner-uid"
}
```

### Reward Transactions Collection
```json
{
  "id": "transaction-id",
  "partnerId": "partner-uid",
  "type": "earned|redeemed",
  "points": 50,
  "description": "Completed plastic waste pickup",
  "date": "2025-12-26T10:00:00Z",
  "voucherId": "voucher-id"
}
```

## Installation & Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd parivartan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase (see Firebase Setup section above)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file in the root directory (optional, Firebase config is hardcoded for simplicity):

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Firebase configuration
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # Firebase service functions
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.