// Hook for detecting user inactivity and triggering timeout
import { useEffect, useRef, useCallback } from 'react';

export interface UseInactivityTimeoutOptions {
  /**
   * Time in milliseconds before timeout (default: 30 minutes)
   */
  timeoutMs?: number;
  /**
   * Time in milliseconds before showing warning (default: 5 minutes before timeout)
   */
  warningMs?: number;
  /**
   * Callback when user becomes inactive (warning phase)
   */
  onWarning?: (remainingMs: number) => void;
  /**
   * Callback when timeout is reached
   */
  onTimeout: () => void;
  /**
   * Whether the timeout is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Events to listen for activity (default: all common events)
   */
  events?: string[];
}

const DEFAULT_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout

/**
 * Hook to detect user inactivity and trigger callbacks
 * 
 * @example
 * ```tsx
 * useInactivityTimeout({
 *   timeoutMs: 30 * 60 * 1000, // 30 minutes
 *   warningMs: 5 * 60 * 1000,  // Warn 5 minutes before
 *   onWarning: (remaining) => console.log(`Warning: ${remaining}ms left`),
 *   onTimeout: () => logout(),
 *   enabled: isAuthenticated,
 * });
 * ```
 */
export const useInactivityTimeout = ({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
  onWarning,
  onTimeout,
  enabled = true,
  events = DEFAULT_EVENTS,
}: UseInactivityTimeoutOptions) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  // Calculate when warning should be shown
  const warningTime = timeoutMs - warningMs;

  // Reset timers
  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Reset state
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    if (!enabled) {
      return;
    }

    // Set warning timer
    if (onWarning && warningMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        const remaining = timeoutMs - (Date.now() - lastActivityRef.current);
        warningShownRef.current = true;
        onWarning(Math.max(0, remaining));
      }, warningTime);
    }

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, warningMs, warningTime, onWarning, onTimeout, enabled]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Only reset if user was actually inactive (avoid resetting on every tiny movement)
    // Reset if more than 1 second has passed since last activity
    if (timeSinceLastActivity > 1000) {
      lastActivityRef.current = now;
      
      // If warning was shown, reset it
      if (warningShownRef.current) {
        warningShownRef.current = false;
      }
      
      resetTimers();
    }
  }, [resetTimers]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) {
      // Clear timers if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      return;
    }

    // Initial setup
    resetTimers();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [enabled, events, handleActivity, resetTimers]);

  // Manual reset function (useful for explicit user actions)
  const reset = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  return { reset };
};
