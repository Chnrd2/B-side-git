import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MailCheck, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESEND_COOLDOWN_SECONDS = 30;

const EmailVerificationBanner = ({
  email,
  onResend,
  onRefresh,
  isBusy = false,
}) => {
  const insets = useSafeAreaInsets();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [bannerMessage, setBannerMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const secondsLeft = useMemo(() => {
    if (!cooldownUntil) {
      return 0;
    }

    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }, [cooldownUntil]);

  const handleResend = async () => {
    if (!onResend || secondsLeft > 0) {
      return;
    }

    setIsResending(true);
    setBannerMessage('');

    const response = await onResend();

    setIsResending(false);

    if (response?.ok) {
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setBannerMessage('Reenviamos el email. Revisá tu bandeja y la carpeta de spam.');
      return;
    }

    setBannerMessage(response?.message || 'No pudimos reenviar el email.');
  };

  const handleRefresh = async () => {
    if (!onRefresh) {
      return;
    }

    setIsRefreshing(true);
    setBannerMessage('');

    const response = await onRefresh();

    setIsRefreshing(false);

    if (response?.ok && response?.session?.user?.email_confirmed_at) {
      setBannerMessage('Listo. Tu email ya figura como verificado.');
      return;
    }

    if (response?.ok) {
      setBannerMessage('Todavía no vemos la confirmación. Probá otra vez en unos segundos.');
      return;
    }

    setBannerMessage(
      response?.message || 'No pudimos actualizar el estado de verificación.'
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
            <Text style={styles.title}>Verificá tu email</Text>
            <Text style={styles.subtitle}>
              {email
                ? `Tu cuenta está conectada con ${email}, pero todavía falta confirmar el correo.`
                : 'Tu cuenta todavía no tiene el correo confirmado.'}
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
            disabled={secondsLeft > 0 || isResending || isBusy}>
            {isResending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {secondsLeft > 0 ? `Reenviar (${secondsLeft}s)` : 'Reenviar email'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (isRefreshing || isBusy) && styles.buttonDisabled,
            ]}
            onPress={handleRefresh}
            disabled={isRefreshing || isBusy}>
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

        {bannerMessage ? <Text style={styles.bannerMessage}>{bannerMessage}</Text> : null}
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(138, 43, 226, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: 'white',
    fontSize: 16,
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
  bannerMessage: {
    color: '#C4B5FD',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default EmailVerificationBanner;
