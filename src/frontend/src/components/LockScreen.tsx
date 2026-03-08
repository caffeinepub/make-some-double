import { Lock, Scan } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { usePasswordSession } from "../providers/PasswordSessionProvider";

export function LockScreen() {
  const { unlock } = usePasswordSession();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleUnlock = () => {
    if (!password) return;
    const success = unlock(password);
    if (!success) {
      setError(true);
      setShaking(true);
      setPassword("");
      setTimeout(() => {
        setShaking(false);
        setError(false);
        inputRef.current?.focus();
      }, 600);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleUnlock();
  };

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.72 0.18 55) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.18 55) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className={`relative w-full max-w-sm mx-4 ${shaking ? "animate-shake" : ""}`}
      >
        {/* App header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded">
            <Scan className="text-primary w-8 h-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wide text-foreground font-display uppercase">
              Make Some Double!!
            </h1>
            <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
              Barcode & Label System
            </p>
          </div>
        </div>

        {/* Lock card */}
        <div className="bg-card border border-border rounded p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Enter Password
            </span>
          </div>

          <input
            ref={inputRef}
            type="password"
            inputMode="text"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="password"
            className={`
              w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-4 rounded
              bg-input border outline-none
              transition-all duration-150
              placeholder:text-muted-foreground/40
              ${
                error
                  ? "border-destructive text-destructive scan-input-error-glow"
                  : "border-border text-foreground focus:border-primary scan-input-glow"
              }
            `}
            autoComplete="current-password"
          />

          {error && (
            <p className="text-destructive text-sm text-center mt-2 font-medium">
              Incorrect password — try again
            </p>
          )}

          <button
            type="button"
            onClick={handleUnlock}
            disabled={!password}
            className="
              mt-4 w-full py-4 rounded font-bold text-base uppercase tracking-widest
              bg-primary text-primary-foreground
              disabled:opacity-40 disabled:cursor-not-allowed
              active:scale-[0.98] transition-all duration-100
              touch-manipulation
            "
            style={{ minHeight: 56 }}
          >
            UNLOCK
          </button>
        </div>
      </div>
    </div>
  );
}
