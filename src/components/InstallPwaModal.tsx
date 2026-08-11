import React, { useState, useEffect } from 'react';
import { Download, Monitor, Laptop, Laptop2, CheckCircle2, X, ExternalLink, Sparkles } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<'chromebook' | 'windows' | 'mac'>('chromebook');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setIsInstalling(false);
      if (choiceResult.outcome === 'accepted') {
        if (onInstalled) onInstalled();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900 font-sans"
        id="install-pwa-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-100 font-bold block">
                EduTN43 Desktop &amp; Chromebook App
              </span>
              <h3 className="font-bold text-lg leading-tight">Install EduTN43 GRADIENT</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Direct Install Button if prompt captured */}
          {deferredPrompt ? (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <strong className="text-indigo-950 font-bold block text-sm mb-0.5">
                  1-Click Direct Desktop Installation Available
                </strong>
                <p className="text-xs text-slate-600">
                  Click below to install directly to your Chromebook shelf, Windows Start Menu, or Mac Launchpad.
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Installing...' : 'Install Desktop App'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700">
              <strong className="text-slate-900 font-bold block mb-1">Web App Ready for Desktop Installation</strong>
              Follow the quick 2-step OS guide below to pin EduTN43 Gradient to your device.
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <div className="flex border-b border-slate-200 gap-2 mb-4">
              <button
                onClick={() => setActiveTab('chromebook')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chromebook'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Chromebook (ChromeOS)</span>
              </button>

              <button
                onClick={() => setActiveTab('windows')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'windows'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Windows 10 / 11</span>
              </button>

              <button
                onClick={() => setActiveTab('mac')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'mac'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop2 className="w-4 h-4" />
                <span>macOS (Mac)</span>
              </button>
            </div>

            {/* Tab Instructions */}
            {activeTab === 'chromebook' && (
              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Look at the Chrome Address Bar</strong>
                    Click the <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">Install</span> icon (a monitor with a down arrow) at the far right of your URL bar.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Or Use Chrome Options Menu</strong>
                    Click the three dots <span className="font-bold">⋮</span> in top right → <span className="font-semibold text-indigo-700">Save and share</span> → <span className="font-semibold text-indigo-700">Install EduTN43 Gradient...</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Pin to Chromebook Shelf</strong>
                    Right-click the app icon on your shelf and select <span className="font-semibold">Pin</span> for instant offline task differentiation!
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'windows' && (
              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Chrome or Microsoft Edge</strong>
                    Look for the <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">Install</span> button in the top address bar.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Menu Shortcut</strong>
                    Click the browser menu <span className="font-bold">⋮</span> → <span className="font-semibold text-indigo-700">Apps</span> / <span className="font-semibold text-indigo-700">Save and share</span> → <span className="font-semibold text-indigo-700">Install EduTN43 Gradient</span>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Desktop &amp; Start Menu Tile</strong>
                    The app launches in a standalone window with its own icon on your Taskbar and Start Menu.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mac' && (
              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Safari (macOS Sonoma or later)</strong>
                    Click <span className="font-semibold text-indigo-700">File</span> in top menu bar → <span className="font-semibold text-indigo-700">Add to Dock...</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Chrome for Mac</strong>
                    Click the install icon in the address bar OR <span className="font-bold">⋮</span> → <span className="font-semibold text-indigo-700">Save and share</span> → <span className="font-semibold text-indigo-700">Install EduTN43 Gradient</span>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-slate-900 font-semibold block">Mac Launchpad &amp; Dock</strong>
                    Access EduTN43 directly from your Mac Launchpad and Dock like a native Mac application.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
