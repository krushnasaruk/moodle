'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

/* ── SVG Icon Components ───────────────────────── */
const Icons = {
    Book: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
    ),
    Search: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    ),
    Moon: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    ),
    Sun: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    ),
    Upload: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
    ),
    User: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
    ),
    BarChart: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
    ),
    GraduationCap: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
        </svg>
    ),
    MessageCircle: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
    ),
    Building: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/>
        </svg>
    ),
    Settings: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    ),
    Newspaper: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
    ),
    UploadCloud: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
    ),
    LogOut: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
    ),
    X: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    ),
    Command: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
        </svg>
    ),
    ArrowRight: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
    ),
};

/* ── Spotlight Quick Links ────────────────────── */
const spotlightLinks = [
    { href: '/', label: 'Home', icon: '🏠', section: 'Pages' },
    { href: '/notes', label: 'Notes', icon: '📝', section: 'Pages' },
    { href: '/subjects', label: 'Subjects', icon: '📚', section: 'Pages' },
    { href: '/pyqs', label: 'Past Year Questions', icon: '📄', section: 'Pages' },
    { href: '/assignments', label: 'Assignments', icon: '📋', section: 'Pages' },
    { href: '/exam-mode', label: 'Exam Mode', icon: '🎯', section: 'Pages' },
    { href: '/community', label: 'Community', icon: '💬', section: 'Social' },
    { href: '/clubs', label: 'Clubs', icon: '🏢', section: 'Social' },
    { href: '/news', label: 'College News', icon: '📰', section: 'Social' },
    { href: '/assistant', label: 'AI Tutor', icon: '🤖', section: 'Tools' },
    { href: '/upload', label: 'Upload Resources', icon: '📤', section: 'Tools' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊', section: 'Tools' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [spotlightOpen, setSpotlightOpen] = useState(false);
    const [spotlightQuery, setSpotlightQuery] = useState('');
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [showAvatarTip, setShowAvatarTip] = useState(false);
    const menuRef = useRef(null);
    const spotlightInputRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        function handleScroll() {
            setScrolled(window.scrollY > 20);
        }
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    /* ── First-time Avatar Tooltip (only shown once) ── */
    useEffect(() => {
        if (user && !localStorage.getItem('sutras_avatar_tooltip_seen')) {
            const timer = setTimeout(() => setShowAvatarTip(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const dismissAvatarTip = () => {
        setShowAvatarTip(false);
        localStorage.setItem('sutras_avatar_tooltip_seen', 'true');
    };

    /* ── ⌘K Spotlight Keyboard Shortcut ── */
    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSpotlightOpen(prev => !prev);
                setSpotlightQuery('');
                setSpotlightIndex(0);
            }
            if (e.key === 'Escape' && spotlightOpen) {
                setSpotlightOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [spotlightOpen]);

    /* Focus spotlight input when opened */
    useEffect(() => {
        if (spotlightOpen && spotlightInputRef.current) {
            setTimeout(() => spotlightInputRef.current?.focus(), 50);
        }
    }, [spotlightOpen]);

    /* ── Spotlight filtering ── */
    const filteredLinks = spotlightLinks.filter(link =>
        link.label.toLowerCase().includes(spotlightQuery.toLowerCase())
    );

    /* Group by section */
    const groupedLinks = filteredLinks.reduce((acc, link) => {
        if (!acc[link.section]) acc[link.section] = [];
        acc[link.section].push(link);
        return acc;
    }, {});

    const handleSpotlightNav = useCallback((href) => {
        router.push(href);
        setSpotlightOpen(false);
        setSpotlightQuery('');
    }, [router]);

    const handleSpotlightKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSpotlightIndex(prev => Math.min(prev + 1, filteredLinks.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSpotlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredLinks[spotlightIndex]) {
            handleSpotlightNav(filteredLinks[spotlightIndex].href);
        }
    };

    const handleSpotlightSearch = (e) => {
        e.preventDefault();
        if (spotlightQuery.trim()) {
            router.push(`/notes?q=${encodeURIComponent(spotlightQuery.trim())}`);
            setSpotlightOpen(false);
            setSpotlightQuery('');
        }
    };

    const links = [
        { href: '/', label: 'Home' },
        { href: '/notes', label: 'Notes' },
        { href: '/subjects', label: 'Subjects' },
        { href: '/pyqs', label: 'PYQs' },
        { href: '/assignments', label: 'Assignments' },
        { href: '/exam-mode', label: 'Exam Mode' },
    ];

    /* ── Dropdown menu config ── */
    const menuGroups = [
        {
            items: [
                { href: `/profile/${user?.uid}`, label: 'My Profile', icon: <Icons.User /> },
                { href: '/dashboard', label: 'Dashboard', icon: <Icons.BarChart /> },
                ...(user?.role === 'teacher' ? [{ href: '/teacher', label: 'Teacher Dashboard', icon: <Icons.GraduationCap />, accent: true }] : []),
            ]
        },
        {
            title: 'Social',
            items: [
                { href: '/community', label: 'Community', icon: <Icons.MessageCircle /> },
                { href: '/clubs', label: 'Clubs', icon: <Icons.Building /> },
                { href: '/clubs/manage', label: 'Club Management', icon: <Icons.Settings /> },
                { href: '/news', label: 'College News', icon: <Icons.Newspaper /> },
            ]
        },
        {
            items: [
                { href: '/upload', label: 'Upload Resources', icon: <Icons.UploadCloud /> },
            ]
        }
    ];

    return (
        <>
            <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
                <div className={styles.navInner}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoIcon}>
                            <Icons.Book />
                        </span>
                        <span className={styles.logoText}>Sutras</span>
                    </Link>

                    {/* Search Trigger — opens Spotlight */}
                    <button
                        className={styles.searchTrigger}
                        onClick={() => { setSpotlightOpen(true); setSpotlightQuery(''); setSpotlightIndex(0); }}
                    >
                        <Icons.Search size={13} />
                        <span className={styles.searchPlaceholder}>Search anything...</span>
                        <kbd className={styles.searchKbd}>
                            <Icons.Command />K
                        </kbd>
                    </button>

                    {/* Nav Links */}
                    <div className={styles.navLinks}>
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className={styles.navActions}>
                        <button
                            className={styles.themeToggle}
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        >
                            <span className={styles.themeIconWrap}>
                                {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
                            </span>
                        </button>

                        <Link href="/upload" className={styles.uploadBtn}>
                            <Icons.Upload />
                            <span>Upload</span>
                        </Link>

                        {user ? (
                            <div className={styles.profileWrapper} ref={menuRef}>
                                <button
                                    className={styles.avatar}
                                    onClick={() => { setMenuOpen(!menuOpen); if (showAvatarTip) dismissAvatarTip(); }}
                                    aria-label="User menu"
                                >
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className={styles.avatarFallback}>
                                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                    <span className={styles.avatarRing} />
                                </button>

                                {/* First-Time Avatar Tooltip */}
                                {showAvatarTip && !menuOpen && (
                                    <div className={styles.avatarTooltip}>
                                        <div className={styles.avatarTooltipArrow} />
                                        <div className={styles.avatarTooltipContent}>
                                            <span className={styles.avatarTooltipEmoji}>💡</span>
                                            <p className={styles.avatarTooltipText}>
                                                Tap your <strong>profile picture</strong> to access Dashboard, Community, Clubs, News & more!
                                            </p>
                                            <button className={styles.avatarTooltipBtn} onClick={dismissAvatarTip}>
                                                Got it!
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {menuOpen && (
                                    <div className={`${styles.profileMenu} ${scrolled ? styles.profileMenuScrolled : ''}`}>
                                        {/* User Header Card */}
                                        <div className={styles.menuHeader}>
                                            <div className={styles.menuHeaderAvatar}>
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className={styles.menuHeaderAvatarFallback}>
                                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.menuHeaderInfo}>
                                                <span className={styles.menuHeaderName}>{user.name}</span>
                                                <span className={styles.menuHeaderEmail}>{user.email}</span>
                                            </div>
                                        </div>

                                        <div className={styles.profileMenuDivider} />

                                        {/* Menu Groups */}
                                        {menuGroups.map((group, gi) => (
                                            <div key={gi}>
                                                {group.title && (
                                                    <div className={styles.menuGroupTitle}>{group.title}</div>
                                                )}
                                                {group.items.map((item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className={`${styles.profileMenuItem} ${item.accent ? styles.profileMenuItemAccent : ''}`}
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        <span className={styles.menuItemIcon}>{item.icon}</span>
                                                        {item.label}
                                                    </Link>
                                                ))}
                                                {gi < menuGroups.length - 1 && (
                                                    <div className={styles.profileMenuDivider} />
                                                )}
                                            </div>
                                        ))}

                                        <div className={styles.profileMenuDivider} />
                                        <button className={`${styles.profileMenuItem} ${styles.profileMenuItemDanger}`} onClick={logout}>
                                            <span className={styles.menuItemIcon}><Icons.LogOut /></span>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className={styles.loginBtn}>
                                Sign In
                                <Icons.ArrowRight />
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Spotlight / Command Palette ── */}
            {spotlightOpen && (
                <div className={styles.spotlightOverlay} onClick={() => setSpotlightOpen(false)}>
                    <div className={styles.spotlightModal} onClick={e => e.stopPropagation()}>
                        {/* Spotlight Search Bar */}
                        <form className={styles.spotlightSearch} onSubmit={handleSpotlightSearch}>
                            <Icons.Search size={18} />
                            <input
                                ref={spotlightInputRef}
                                type="text"
                                className={styles.spotlightInput}
                                placeholder="Search pages, notes, subjects..."
                                value={spotlightQuery}
                                onChange={e => { setSpotlightQuery(e.target.value); setSpotlightIndex(0); }}
                                onKeyDown={handleSpotlightKeyDown}
                            />
                            <button type="button" className={styles.spotlightClose} onClick={() => setSpotlightOpen(false)}>
                                <span>ESC</span>
                            </button>
                        </form>

                        {/* Results */}
                        <div className={styles.spotlightResults}>
                            {Object.keys(groupedLinks).length === 0 ? (
                                <div className={styles.spotlightEmpty}>
                                    <span>No results for &ldquo;{spotlightQuery}&rdquo;</span>
                                    <span className={styles.spotlightEmptySub}>Press Enter to search in notes</span>
                                </div>
                            ) : (
                                Object.entries(groupedLinks).map(([section, items]) => (
                                    <div key={section} className={styles.spotlightGroup}>
                                        <div className={styles.spotlightGroupTitle}>{section}</div>
                                        {items.map((item) => {
                                            const flatIndex = filteredLinks.indexOf(item);
                                            return (
                                                <button
                                                    key={item.href}
                                                    className={`${styles.spotlightItem} ${flatIndex === spotlightIndex ? styles.spotlightItemActive : ''}`}
                                                    onClick={() => handleSpotlightNav(item.href)}
                                                    onMouseEnter={() => setSpotlightIndex(flatIndex)}
                                                >
                                                    <span className={styles.spotlightItemIcon}>{item.icon}</span>
                                                    <span className={styles.spotlightItemLabel}>{item.label}</span>
                                                    {flatIndex === spotlightIndex && (
                                                        <span className={styles.spotlightItemArrow}>
                                                            <Icons.ArrowRight />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className={styles.spotlightFooter}>
                            <span><kbd>↑↓</kbd> Navigate</span>
                            <span><kbd>↵</kbd> Open</span>
                            <span><kbd>esc</kbd> Close</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
