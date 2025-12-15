"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl animate-in slide-in-from-top duration-300">
        <div className="container-main py-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-4">
              {/* Search icon */}
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un article, un joueur, une équipe..."
                className="flex-1 text-lg md:text-xl font-medium text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
              />

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fermer la recherche"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="mt-4 h-px bg-gray-200" />

            {/* Quick links */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 mb-3">
                Recherches populaires
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "CAN 2025",
                  "Sadio Mané",
                  "Mohamed Salah",
                  "Mercato",
                  "Sénégal",
                  "Maroc",
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-[#9DFF20] hover:text-[#345C00] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
