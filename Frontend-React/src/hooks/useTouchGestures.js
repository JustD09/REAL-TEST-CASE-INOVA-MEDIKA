import { useEffect, useRef, useCallback, useState } from 'react';

export function useSwipeDrawer({
  onOpen,
  onClose,
  isOpen,
  threshold = 80,
  edgeWidth = 30,
  enabled = true,
}) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchCurrentRef = useRef({ x: 0, y: 0 });
  const isSwipingRef = useRef(false);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    
    // Only start from left edge for opening, or from anywhere if already open for closing
    if (!isOpen && clientX > edgeWidth) return;
    
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    touchCurrentRef.current = { x: clientX, y: clientY };
    isSwipingRef.current = true;
  }, [enabled, isOpen, edgeWidth]);

  const handleTouchMove = useCallback((e) => {
    if (!isSwipingRef.current || !enabled) return;
    
    const touch = e.touches[0];
    touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current) return;
    
    const { x: startX } = touchStartRef.current;
    const { x: currentX } = touchCurrentRef.current;
    const deltaX = currentX - startX;
    const absDeltaX = Math.abs(deltaX);
    const deltaY = Math.abs(touchCurrentRef.current.y - touchStartRef.current.y);
    
    // Require more horizontal than vertical movement
    if (deltaY > absDeltaX * 0.5) {
      isSwipingRef.current = false;
      return;
    }
    
    if (!isOpen && deltaX > threshold) {
      // Swipe right to open
      onOpen();
    } else if (isOpen && deltaX < -threshold) {
      // Swipe left to close
      onClose();
    }
    
    isSwipingRef.current = false;
  }, [isOpen, onOpen, onClose, threshold]);

  useEffect(() => {
    const element = elementRef.current || document;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref: elementRef };
}

export function usePullToRefresh({
  onRefresh,
  threshold = 100,
  maxPull = 150,
  enabled = true,
}) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef({ y: 0, time: 0 });
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing) return;
    
    // Only allow pull-to-refresh at top of scroll
    const element = elementRef.current;
    if (element && element.scrollTop > 0) return;
    
    touchStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || isRefreshing) return;
    if (touchStartRef.current.y === 0) return;
    
    const element = elementRef.current;
    if (element && element.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current.y;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, maxPull);
      setPullDistance(distance);
      setIsPulling(true);
    }
  }, [enabled, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    touchStartRef.current = { y: 0, time: 0 };
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const element = elementRef.current || document;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ref: elementRef,
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1),
  };
}

export function useSwipeAction({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  enabled = true,
}) {
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchCurrentRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled) return;
    touchCurrentRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    
    const { x: startX, y: startY } = touchStartRef.current;
    const { x: currentX, y: currentY } = touchCurrentRef.current;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Require more horizontal than vertical movement
    if (absDeltaY > absDeltaX * 0.5) return;
    if (absDeltaX < threshold) return;
    
    if (deltaX > 0) {
      onSwipeRight?.();
    } else {
      onSwipeLeft?.();
    }
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, elementRef]);

  return { ref: elementRef };
}