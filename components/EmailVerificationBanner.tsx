import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MailCheck, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESEND_COOLDOWN_SECONDS = 30;
const AUTO_REFRESH_INTERVAL_MS = 25000;

const buildBannerFeedback = (tone, text) => ({ tone, text });

const EmailVerificationBanner = ({
  email,
  onResend,
  onRefresh,
  isBusy = false,
}) => {
  const insets = useSafeAreaInsets();
  const appStateRef = useRef(AppState.currentState);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [bannerFeedback, setBannerFeedback] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const secondsLeft = useMemo(() => {
    if (!cooldownUntil) {
      return 0;
    }

    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }, [cooldownUntil]);

  useEffect(() => {
    if (!cooldownUntil) {
      return undefined;
    }

    const timer = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const refreshVerification = async ({ silent = false } = {}) => {
    if (!onRefresh || isRefreshing || isBusy) {
      return null;
    }

    setIsRefreshing(true);
    if (!silent) {
      setBannerFeedback(null);
    }

    const response = await onRefresh();
    setIsRefreshing(false);

    if (response?.ok && response?.session?.user?.email_confirmed_at) {
      if (!silent) {
        setBannerFeedback(
          buildBannerFeedback('success', 'Listo. Tu email ya figura como verificado.')
        );
      }
      return response;
    }

    if (response?.ok && !silent) {
      setBannerFeedback(
        buildBannerFeedback(
          'info',
          'Todavía no vemos la confirmación. Revisá el correo y volvé a intentar.'
        )
      );
      return response;
    }

    if (!silent) {
      setBannerFeedback(
        buildBannerFeedback(
          'error',
          response?.message || 'No pudimos actualizar el estado de tu cuenta.'
        )
      );
    }

    return response;
  };

  useEffect(() => {
    if (!onRefresh) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';

      appStateRef.current = nextState;

      if (wasBackground && nextState === 'active') {
        void refreshVerification({ silent: true });
      }
    });

    const intervalId = setInterval(() => {
      void refreshVerification({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [isBusy, onRefresh]);

  const handleResend = async () => {
    if (!onResend || secondsLeft > 0 || isBusy || isResending) {
      return;
    }

    setIsResending(true);
    setBannerFeedback(null);

    const response = await onResend();

    setIsResending(false);

    if (response?.ok) {
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setBannerFeedback(
        buildBannerFeedback(
          'success',
          'Reenviamos el email. Revisá tu bandeja y la carpeta de spam.'
        )
      );
      return;
    }

    setBannerFeedback(
      buildBannerFeedback(
        'error',
        response?.message || 'No pudimos reenviar el email.'
      )
    );
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MailCheck color="#F3E8FF" size={18} />
          </View>

          <View style={styles.copy}>
            <Text style={styles.eyebrow}>EMAIL PENDIENTE</Text>
            <Text style={styles.title}>Verificá tu cuenta</Text>
            <Text style={styles.subtitle}>
              {email
                ? `Ya registraste ${email}. Confirmá el correo para dejar la cuenta completamente activa.`
                : 'La cuenta todavía no tiene el correo confirmado.'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (secondsLeft > 0 || isResending || isBusy) && styles.buttonDisabled,
            ]}
            onPress={handleResend}
            disabled={secondsLeft > 0 || isResending || isBusy}
          >
            {isResending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {secondsLeft > 0 ? `Reenviar en ${secondsLeft}s` : 'Reenviar email'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (isRefreshing || isBusy) && styles.buttonDisabled,
            ]}
            onPress={() => {
              void refreshVerification();
            }}
            disabled={isRefreshing || isBusy}
          >
            {isRefreshing ? (
              <ActivityIndicator color="#E9D5FF" />
            ) : (
              <>
                <RefreshCw color="#E9D5FF" size={16} />
                <Text style={styles.secondaryButtonText}>Ya verifiqué</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {bannerFeedback?.text ? (
          <View
            style={[
              styles.feedbackCard,
              bannerFeedback.tone === 'success' && styles.feedbackCardSuccess,
              bannerFeedback.tone === 'error' && styles.feedbackCardError,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                bannerFeedback.tone === 'success' && styles.feedbackTextSuccess,
                bannerFeedback.tone === 'error' && styles.feedbackTextError,
              ]}
            >
              {bannerFeedback.text}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.26)',
    backgroundColor: 'rgba(15, 10, 26, 0.96)',
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.18)',
    backgroundColor: 'rgba(20, 25, 42, 0.92)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#E9D5FF',
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  feedbackCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  feedbackCardSuccess: {
    backgroundColor: 'rgba(20, 83, 45, 0.22)',
    borderColor: 'rgba(74, 222, 128, 0.16)',
  },
  feedbackCardError: {
    backgroundColor: 'rgba(76, 29, 29, 0.38)',
    borderColor: 'rgba(248, 113, 113, 0.18)',
  },
  feedbackText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
  },
  feedbackTextSuccess: {
    color: '#BBF7D0',
  },
  feedbackTextError: {
    color: '#FCA5A5',
  },
});

export default EmailVerificationBanner;
