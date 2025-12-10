// Clerk Authentication Integration
import { useUser, useAuth } from '@clerk/clerk-react';

// Re-export Clerk hooks for convenience
export { useUser, useAuth, useClerk, SignIn, SignUp, UserButton, SignInButton, SignUpButton } from '@clerk/clerk-react';

// Helper to get current user ID
export const useUserId = () => {
  const { user } = useUser();
  return user?.id || null;
};

// Auth state helper
export const useAuthState = () => {
  const { isSignedIn, isLoaded } = useUser();
  return { isSignedIn, isLoaded };
};
