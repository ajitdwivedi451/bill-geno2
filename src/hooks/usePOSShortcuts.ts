import { useEffect } from 'react';

type ShortcutMap = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
};

export function usePOSShortcuts(shortcuts: ShortcutMap[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 🟢 BUG FIX: Agar browser koi khali event (undefined key) bhejta hai, toh aage mat badho. 
      // Isse 'toLowerCase' ka crash hamesha ke liye khatam ho jayega!
      if (!event || !event.key) return;

      shortcuts.forEach((shortcut) => {
        const isKeyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const isCtrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
        const isAltMatch = shortcut.altKey ? event.altKey : true;
        const isShiftMatch = shortcut.shiftKey ? event.shiftKey : true;

        // Agar saari conditions match hoti hain
        if (isKeyMatch && isCtrlMatch && isAltMatch && isShiftMatch) {
          event.preventDefault(); // Browser ke default action ko roko (jaise Ctrl+S se page save hona)
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}