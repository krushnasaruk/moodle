'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show custom cursor on non-touch devices
        if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
            setVisible(true);
        } else {
            return;
        }

        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
            }
        };

        const animate = () => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
            }
            requestAnimationFrame(animate);
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            const isInteractive =
                target.closest('a') ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('select') ||
                target.closest('textarea') ||
                target.closest('[role="button"]');
            setIsHovering(!!isInteractive);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseLeave = () => setVisible(false);
        const handleMouseEnter = () => setVisible(true);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        document.documentElement.addEventListener('mouseenter', handleMouseEnter);

        const animId = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
            document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
            cancelAnimationFrame(animId);
        };
    }, []);

    if (!visible) return null;

    return (
        <>
            {/* Inner dot */}
            <div
                ref={dotRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    willChange: 'transform',
                    transition: isHovering ? 'width 0.2s, height 0.2s, background 0.2s' : 'none',
                    mixBlendMode: 'difference',
                }}
            />
            {/* Outer ring */}
            <div
                ref={ringRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: isHovering ? '56px' : '40px',
                    height: isHovering ? '56px' : '40px',
                    borderRadius: '50%',
                    border: `2px solid var(--primary)`,
                    pointerEvents: 'none',
                    zIndex: 99998,
                    willChange: 'transform',
                    transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s',
                    opacity: isClicking ? 0.3 : isHovering ? 0.6 : 0.3,
                    transform: `translate(-20px, -20px)`,
                    marginLeft: isHovering ? '-8px' : '0px',
                    marginTop: isHovering ? '-8px' : '0px',
                }}
            />
        </>
    );
}
