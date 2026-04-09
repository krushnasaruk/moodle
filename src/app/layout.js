import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar/Navbar';

export const metadata = {
  title: 'StudyHub. — The Student OS',
  description: 'Find notes, PYQs, assignments, and ace your exams with a sleek platform built for modern students.',
  keywords: 'notes, pyqs, assignments, college, exam prep, study material, futuristic',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
