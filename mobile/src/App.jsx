import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';

// Set notification handler to present notification even when app is open or in background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function requestNotifPermissions() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Notification permission status:', finalStatus);
        }
      } catch (err) {
        console.warn('Error requesting notification permissions:', err);
      }
    }
    requestNotifPermissions();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const reloadApp = () => {
    setHasError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && (data.type === 'SHOW_NOTIFICATION' || data.type === 'DEVICE_NOTIFICATION')) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: data.title || 'Parrow Skills Alert',
            body: data.body || 'New order status update',
            data: data.extraData || {},
            sound: 'default',
          },
          trigger: null,
        });
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    if (!url) return true;

    // Intercept phone calls, WhatsApp messages, emails, SMS
    if (
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('whatsapp:') ||
      url.startsWith('sms:') ||
      url.startsWith('intent:') ||
      url.includes('api.whatsapp.com') ||
      url.includes('wa.me')
    ) {
      Linking.openURL(url).catch(err => console.warn('Could not open external URL:', err));
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://parrowskills.com/login-select' }}
        style={styles.webview}
        userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        javaScriptEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        geolocationEnabled={true}
        startInLoadingState={true}
        allowFileAccess={true}
        allowContentAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setHasError(true);
          setLoading(false);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff8c00" />
          </View>
        )}
      />
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorSub}>Unable to connect to Parrow Skills service. Please check your internet connection.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reloadApp}>
            <Text style={styles.retryText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
