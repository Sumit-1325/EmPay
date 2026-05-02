import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  animationClass = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("grid gap-2", animationClass)}>
      <Label
        htmlFor={id}
        className="text-[0.7rem] font-semibold tracking-[0.12em] text-white/50 uppercase"
      >
        {label}
      </Label>
      <div className="group relative">
        {Icon && (
          <Icon
            className={cn(
              "pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors",
              error
                ? "text-destructive/70"
                : "text-white/30 group-focus-within:text-primary"
            )}
            size={16}
          />
        )}
        <Input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange ?? (() => {})}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "auth-input-focus h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/25 hover:border-white/[0.15] hover:bg-white/[0.06]",
            Icon ? "pl-10" : "pl-4",
            isPassword ? "pr-10" : "pr-4",
            error && "border-destructive/50 focus-visible:ring-destructive/30",
            disabled && "opacity-50 cursor-not-allowed hover:border-white/[0.08] hover:bg-white/[0.04]"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
