import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/" />;
  }

  return (
    <div className="flex gap-2">
      <SignInButton mode="modal">
        <Button variant="default">Sign In</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="outline">Sign Up</Button>
      </SignUpButton>
    </div>
  );
}
