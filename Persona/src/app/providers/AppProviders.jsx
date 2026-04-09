import { AuthProvider } from '../../features/auth/useAuth';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import { EventProvider } from './EventContext';
import { PrivacyProvider } from './PrivacyContext';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <EventProvider>
            <PrivacyProvider>
              {children}
            </PrivacyProvider>
          </EventProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
