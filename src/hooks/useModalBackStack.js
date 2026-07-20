import { useEffect, useRef } from 'react';

/**
 * useModalBackStack — wires a modal into the browser history so the Android
 * hardware back button closes the modal instead of navigating away from the page.
 *
 * When `isOpen` becomes true, a history entry is pushed. If the user presses
 * back (popstate), `onClose` is invoked. If the modal is closed programmatically
 * (X button / submit), the pushed entry is popped via history.back() so the
 * back stack stays clean. Listeners are removed on unmount.
 *
 * Usage: const MyModal = ({ onClose }) => { useModalBackStack(true, onClose); ... }
 */
export function useModalBackStack(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const closedByPopRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    closedByPopRef.current = false;

    // Push a sentinel history entry while the modal is open.
    window.history.pushState({ modalOpen: true }, '');

    const onPop = () => {
      // Hardware/back button pressed while modal open → close cleanly.
      closedByPopRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed via UI (not back button) → remove the pushed entry so back
      // history isn't left with a stale modal entry.
      if (!closedByPopRef.current) {
        window.history.back();
      }
    };
  }, [isOpen]);
}

export default useModalBackStack;