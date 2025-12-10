// StyleSync App Entry Point
import React from 'react';
import { createRoot } from "react-dom/client";
import { ClerkProvider } from '@clerk/clerk-react';
import App from "./App.tsx";
import "./index.css";

// Clerk publishable key (public - safe to include in client code)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_c21hcnQtbGxhbWEtNzQuY2xlcmsuYWNjb3VudHMuZGV2JA';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
