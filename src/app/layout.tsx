import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HR AI SaaS - Intelligent Resume Screening',
  description: 'AI-powered resume screening and candidate evaluation system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Production-grade error handling for browser extensions
              (function() {
                // Suppress extension connection errors that don't affect app functionality
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (
                    message.includes('Could not establish connection') ||
                    message.includes('Receiving end does not exist') ||
                    message.includes('Extension context invalidated') ||
                    message.includes('chrome-extension://') ||
                    message.includes('moz-extension://')
                  ) {
                    // Log to a separate channel for debugging but don't spam console
                    if (window.extensionErrorCount === undefined) {
                      window.extensionErrorCount = 0;
                    }
                    window.extensionErrorCount++;
                    return; // Suppress these specific errors
                  }
                  // Allow all other errors through
                  originalConsoleError.apply(console, args);
                };

                // Global error handler for unhandled promise rejections
                window.addEventListener('unhandledrejection', function(event) {
                  const message = event.reason?.message || event.reason;
                  if (
                    message?.includes('Could not establish connection') ||
                    message?.includes('Receiving end does not exist')
                  ) {
                    event.preventDefault(); // Prevent the error from showing
                    return;
                  }
                });

                // Global error handler for runtime errors
                window.addEventListener('error', function(event) {
                  if (
                    event.message?.includes('Could not establish connection') ||
                    event.message?.includes('Receiving end does not exist') ||
                    event.filename?.includes('extension')
                  ) {
                    event.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}