"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if app is already installed
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install prompt on non-iOS if not installed
      if (!isIosDevice) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If it's iOS and not standalone, show the custom iOS prompt
    if (isIosDevice && !isStandaloneMode) {
      const hasSeenPrompt = localStorage.getItem("tukki_ios_prompt_seen");
      if (!hasSeenPrompt) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem("tukki_ios_prompt_seen", "true");
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-md mx-auto flex flex-col gap-3">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0B6B3A] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Installer TUKKI</h3>
            <p className="text-sm text-gray-500">
              {isIOS 
                ? "Ajoutez l'application sur votre écran d'accueil" 
                : "Installez l'application pour un accès plus rapide"}
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 flex items-center gap-2">
            Appuyez sur <Share className="w-4 h-4" /> puis <strong>Sur l'écran d'accueil</strong>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full bg-[#0B6B3A] text-white py-2.5 rounded-xl font-medium hover:bg-[#095a31] transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Installer l'application
          </button>
        )}
      </div>
    </div>
  );
}
