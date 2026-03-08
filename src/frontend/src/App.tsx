import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "./components/AppShell";
import { LockScreen } from "./components/LockScreen";
import {
  PasswordSessionProvider,
  usePasswordSession,
} from "./providers/PasswordSessionProvider";

function AppContent() {
  const { isUnlocked } = usePasswordSession();
  return isUnlocked ? <AppShell /> : <LockScreen />;
}

export default function App() {
  return (
    <PasswordSessionProvider>
      <div className="dark">
        <AppContent />
        <Toaster />
      </div>
    </PasswordSessionProvider>
  );
}
