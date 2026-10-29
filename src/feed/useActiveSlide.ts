import { useEffect, useState, type RefObject } from 'react';
export function useActiveSlide(root: RefObject<HTMLDivElement | null>, count: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    setActiveIndex(0);
    element.scrollTop = 0;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= 0.6)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveIndex(Number((visible.target as HTMLElement).dataset.index));
    }, { root: element, threshold: [0, 0.6, 0.9, 1] });
    Array.from(element.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [root, count]);
  return activeIndex;
}
