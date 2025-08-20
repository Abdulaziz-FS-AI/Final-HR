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
              // Temporary debug mode - log all errors to diagnose Brave browser issues
              (function() {
                console.log('🔍 DEBUG MODE: All errors will be logged for Brave browser debugging');
                
                // Track extension errors separately but don't suppress them yet
                window.addEventListener('unhandledrejection', function(event) {
                  const message = event.reason?.message || event.reason;
                  console.error('🚨 UNHANDLED REJECTION:', {
                    message: message,
                    reason: event.reason,
                    stack: event.reason?.stack,
                    isBrowserExtension: message?.includes('Could not establish connection') || 
                                       message?.includes('Receiving end does not exist')
                  });
                  // Don't prevent - let all errors show for debugging
                });

                // Log all runtime errors
                window.addEventListener('error', function(event) {
                  console.error('🚨 RUNTIME ERROR:', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                    isBrowserExtension: event.filename?.includes('extension') ||
                                       event.message?.includes('Could not establish connection')
                  });
                  // Don't prevent - let all errors show for debugging
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}