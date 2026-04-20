'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        
        function handleScroll() {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        
        // Initial check
        handleScroll();
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/notes?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
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

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
            <div className={styles.navInner}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>📚</span>
                    Sutras
                </Link>

                {/* Search */}
                <form className={styles.searchWrapper} onSubmit={handleSearch}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search notes, PYQs, subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

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
                        onClick={toggleTheme} 
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px', color: 'inherit' }}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>

                    <Link href="/upload" className={styles.uploadBtn}>
                        📤 <span>Upload</span>
                    </Link>

                    {user ? (
                        <div className={styles.profileWrapper} ref={menuRef}>
                            <div
                                className={styles.avatar}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                                ) : (
                                    <div className={styles.avatarFallback}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            {menuOpen && (
                                <div className={`${styles.profileMenu} ${scrolled ? styles.profileMenuScrolled : ''}`}>
                                    <div className={styles.profileMenuItem} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {user.name}
                                    </div>
                                    <div className={styles.profileMenuDivider} />
                                    <Link href={`/profile/${user.uid}`} className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        👤 My Profile
                                    </Link>
                                    <Link href="/dashboard" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        📊 Dashboard
                                    </Link>
                                    {user.role === 'teacher' && (
                                        <Link href="/teacher" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)' }}>
                                            🎓 Teacher Dashboard
                                        </Link>
                                    )}
                                    <Link href="/community" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        💬 Community
                                    </Link>
                                    <Link href="/clubs" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        🏢 Clubs
                                    </Link>
                                    <Link href="/clubs/manage" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        ⚙️ Club Management
                                    </Link>
                                    <Link href="/news" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        📰 College News
                                    </Link>
                                    <Link href="/upload" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                                        📤 Upload Resources
                                    </Link>
                                    <div className={styles.profileMenuDivider} />
                                    <button className={styles.profileMenuItem} onClick={logout} style={{ color: 'var(--danger)' }}>
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className={styles.loginBtn}>
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
