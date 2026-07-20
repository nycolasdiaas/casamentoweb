import { WHATSAPP_LINK } from "@/lib/site";

export default function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white pl-3 pr-4 py-3 shadow-lg hover:scale-105 transition-transform"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="size-5"
      >
        <path d="M12 2C6.48 2 2 6.32 2 11.65c0 1.9.57 3.67 1.55 5.16L2.2 21.5l4.87-1.27a10.3 10.3 0 0 0 4.93 1.24c5.52 0 10-4.32 10-9.65S17.52 2 12 2Zm0 17.6a8.4 8.4 0 0 1-4.28-1.16l-.31-.18-2.89.75.77-2.73-.2-.3a7.6 7.6 0 0 1-1.29-4.33c0-4.28 3.63-7.77 8.2-7.77s8.2 3.49 8.2 7.77-3.63 7.75-8.2 7.75Zm4.5-5.8c-.25-.12-1.47-.7-1.7-.78-.23-.08-.4-.12-.56.12-.16.24-.64.78-.78.94-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.8c-.25-.42.25-.39.71-1.3.08-.16.04-.3-.02-.42-.06-.12-.56-1.3-.77-1.78-.2-.47-.41-.4-.56-.41h-.48c-.16 0-.42.06-.64.3-.22.24-.84.8-.84 1.94s.86 2.25.98 2.4c.12.16 1.7 2.5 4.1 3.5.57.24 1.02.38 1.37.49.58.18 1.1.15 1.52.09.46-.07 1.47-.58 1.68-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.47-.28Z" />
      </svg>
      <span className="text-sm font-medium">WhatsApp</span>
    </a>
  );
}
