"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type PointerEvent,
} from "react";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function EyeIcon({ slashed }: { slashed: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {slashed ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c7 0 10 7 10 7a17.5 17.5 0 0 1-3.2 4.4" />
          <path d="M6.1 6.1A17.7 17.7 0 0 0 2 12s3 7 10 7a9.8 9.8 0 0 0 4.3-1" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function PasswordInput({
  className,
  onSelect,
  ...props
}: PasswordInputProps) {
  const { locale, dir } = useLocale();
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const restoreFocusRef = useRef(false);

  const rememberSelection = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    selectionRef.current = {
      start: input.selectionStart ?? input.value.length,
      end: input.selectionEnd ?? input.value.length,
    };
  }, []);

  useLayoutEffect(() => {
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const input = inputRef.current;
    const saved = selectionRef.current;
    if (!input) return;
    input.focus();
    if (!saved) return;
    try {
      input.setSelectionRange(saved.start, saved.end);
    } catch {
      /* Some browsers block selection APIs on password inputs. */
    }
  }, [visible]);

  function handleTogglePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    rememberSelection();
  }

  return (
    <div className="password-field" dir={dir}>
      <input
        {...props}
        ref={inputRef}
        className={className}
        type={visible ? "text" : "password"}
        spellCheck={false}
        onSelect={(event) => {
          rememberSelection();
          onSelect?.(event);
        }}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={
          visible
            ? msg("auth.hidePassword", locale)
            : msg("auth.showPassword", locale)
        }
        aria-pressed={visible}
        onPointerDown={handleTogglePointerDown}
        onClick={() => {
          restoreFocusRef.current = true;
          rememberSelection();
          setVisible((current) => !current);
        }}
      >
        <EyeIcon slashed={visible} />
      </button>
    </div>
  );
}
