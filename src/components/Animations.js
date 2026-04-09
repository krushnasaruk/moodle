'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * ScrollReveal - Animates children when they enter the viewport
 * Usage: <ScrollReveal><div>Content</div></ScrollReveal>
 */
export function ScrollReveal({ children, delay = 0, direction = 'up', className = '' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('sr-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const directionMap = {
        up: 'sr-up',
        down: 'sr-down',
        left: 'sr-left',
        right: 'sr-right',
        scale: 'sr-scale',
    };

    return (
        <div
            ref={ref}
            className={`sr-init ${directionMap[direction] || 'sr-up'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/**
 * TextReveal - Stagger-reveals each word
 */
export function TextReveal({ text, className = '', tag: Tag = 'span', delay = 0 }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('tr-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const words = text.split(' ');

    return (
        <Tag ref={ref} className={`tr-init ${className}`}>
            {words.map((word, i) => (
                <span
                    key={i}
                    className="tr-word"
                    style={{ transitionDelay: `${delay + i * 80}ms` }}
                >
                    {word}&nbsp;
                </span>
            ))}
        </Tag>
    );
}

/**
 * CountUp - Animates a number counting up
 */
export function CountUp({ end, duration = 2000, suffix = '', className = '' }) {
    const ref = useRef(null);
    const counted = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !counted.current) {
                    counted.current = true;
                    animateCount();
                    observer.unobserve(el);
                }
            },
            { threshold: 0.5 }
        );

        const animateCount = () => {
            const numericEnd = parseInt(end.toString().replace(/[^0-9]/g, ''));
            const startTime = performance.now();

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(numericEnd * eased);

                if (el) {
                    el.textContent = current.toLocaleString() + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        };

        observer.observe(el);
        return () => observer.disconnect();
    }, [end, duration, suffix]);

    return <span ref={ref} className={className}>0{suffix}</span>;
}
