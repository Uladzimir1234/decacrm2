import { MessageCircle, X } from 'lucide-react';

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-12 h-12 rounded-full bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/25 flex items-center justify-center transition-all duration-200 hover:scale-105"
    >
      {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
    </button>
  );
}
