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
