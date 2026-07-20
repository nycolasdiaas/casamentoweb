"use client";

import { useEffect, useState } from "react";

export type DemoMessage = { name: string; when: string; text: string };
export type DemoGift = { name: string; priceReais: number };

type Options = {
  storageKey: string;
  targetDate: string;
  partyEndsAt: string;
  guests: string[];
  gifts: DemoGift[];
  seedMessages: DemoMessage[];
};

type Saved = {
  rsvp?: Record<string, "yes" | "no">;
  confirmed?: boolean;
  messages?: DemoMessage[];
};

// Estado compartilhado pelas 3 prévias de template: contagem regressiva,
// RSVP, modal de presente com Pix falso, mural de recados e o toggle de
// prévia do álbum pós-festa. Cada template só muda a aparência (JSX);
// o comportamento é este hook, único.
export function useWeddingDemoState({
  storageKey,
  targetDate,
  partyEndsAt,
  guests,
  gifts,
  seedMessages,
}: Options) {
  const target = new Date(targetDate).getTime();
  const partyEnd = new Date(partyEndsAt).getTime();

  const [now, setNow] = useState<number | null>(null);
  const [rsvp, setRsvp] = useState<Record<string, "yes" | "no">>({});
  const [confirmed, setConfirmed] = useState(false);
  const [giftIndex, setGiftIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<DemoMessage[]>(seedMessages);
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [albumPreview, setAlbumPreview] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const frame = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);

    const restore = () => {
      try {
        const saved: Saved = JSON.parse(
          localStorage.getItem(storageKey) ?? "{}"
        );
        if (saved.rsvp) setRsvp(saved.rsvp);
        if (saved.confirmed) setConfirmed(true);
        if (Array.isArray(saved.messages) && saved.messages.length > 0) {
          setMessages(saved.messages);
        }
      } catch {
        // primeiro acesso ou storage indisponível
      }
    };
    restore();

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [storageKey]);

  function persist(patch: Saved) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ rsvp, confirmed, messages, ...patch })
      );
    } catch {
      // sem storage disponível
    }
  }

  function setAnswer(guest: string, value: "yes" | "no") {
    const next = { ...rsvp, [guest]: value };
    setRsvp(next);
    persist({ rsvp: next });
  }

  function confirm() {
    if (Object.keys(rsvp).length === 0) return;
    setConfirmed(true);
    persist({ confirmed: true });
  }

  function editAnswers() {
    setConfirmed(false);
    persist({ confirmed: false });
  }

  function openGift(index: number) {
    setGiftIndex(index);
    setCopied(false);
  }

  function closeGift() {
    setGiftIndex(null);
  }

  async function copyPixCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        el.remove();
      } catch {
        // clipboard indisponível
      }
    }
    setCopied(true);
  }

  function sendMessage() {
    const text = guestMessage.trim();
    if (!text) return;
    const name = guestName.trim() || "Convidado(a)";
    const next = [{ name, text, when: "agora mesmo" }, ...messages];
    setMessages(next);
    setGuestName("");
    setGuestMessage("");
    persist({ messages: next });
  }

  const diff = now == null ? null : Math.max(0, target - now);
  const pad = (value: number) => String(value).padStart(2, "0");
  const countdown =
    diff == null
      ? { days: "–", hours: "–", minutes: "–", seconds: "–" }
      : {
          days: String(Math.floor(diff / 86_400_000)),
          hours: pad(Math.floor(diff / 3_600_000) % 24),
          minutes: pad(Math.floor(diff / 60_000) % 60),
          seconds: pad(Math.floor(diff / 1_000) % 60),
        };

  const albumUnlocked = albumPreview || (now != null && now > partyEnd);
  const gift = giftIndex != null ? gifts[giftIndex] : null;

  return {
    countdown,
    guests,
    rsvp,
    setAnswer,
    confirmed,
    canConfirm: Object.keys(rsvp).length > 0,
    confirm,
    editAnswers,
    gifts,
    gift,
    giftIndex,
    openGift,
    closeGift,
    copied,
    copyPixCode,
    messages,
    guestName,
    setGuestName,
    guestMessage,
    setGuestMessage,
    sendMessage,
    albumUnlocked,
    albumPreview,
    setAlbumPreview,
  };
}
