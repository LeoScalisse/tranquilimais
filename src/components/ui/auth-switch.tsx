import { cn } from "@/lib/utils";
import { useState } from "react";

interface AuthSwitchProps {
  onNewUser: () => void;
  onExistingUser: () => void;
}

export const AuthSwitch = ({ onNewUser, onExistingUser }: AuthSwitchProps) => {
  const [selected, setSelected] = useState<"new" | "existing" | null>(null);

  const handleSelect = (type: "new" | "existing") => {
    setSelected(type);
    if (type === "new") {
      onNewUser();
    } else {
      onExistingUser();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto gap-4">
      <button
        onClick={() => handleSelect("new")}
        className={cn(
          "w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 border-2",
          selected === "new"
            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
            : "bg-card text-foreground border-border hover:border-primary/50 hover:shadow-md"
        )}
      >
        Sou novo aqui
      </button>
      <button
        onClick={() => handleSelect("existing")}
        className={cn(
          "w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 border-2",
          selected === "existing"
            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
            : "bg-card text-foreground border-border hover:border-primary/50 hover:shadow-md"
        )}
      >
        Já tenho conta
      </button>
    </div>
  );
};

export default AuthSwitch;
