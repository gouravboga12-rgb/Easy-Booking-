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
import * as WebBrowser from 'expo-web-browser';

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
    async function setupNotifications() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Order Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF8C00',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          });
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        // Fetch Expo push token or native device push token and send to backend
        try {
          let pushToken = '';
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: '5224f65b-1ac1-47a6-9adf-f6441a6268e1'
            });
            pushToken = tokenData.data;
          } catch (e) {
            // Fallback to native device token
            const deviceTokenData = await Notifications.getDevicePushTokenAsync();
            pushToken = deviceTokenData.data;
          }

          if (pushToken && webViewRef.current) {
            const sendTokenJS = `
              (function() {
                try {
                  const authToken = localStorage.getItem('token');
                  if (authToken) {
                    fetch('https://parrowskills.com/api/auth/expo-push-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
                      body: JSON.stringify({ token: '${pushToken}' })
                    }).then(r => r.json()).catch(err => console.error('Push token sync err:', err));
                  }
                } catch (e) {}
              })();
            `;
            webViewRef.current.injectJavaScript(sendTokenJS);
          }
        } catch (tokenErr) {
          console.warn('Push token fetch error:', tokenErr);
        }
      } catch (err) {
        console.warn('Error setting up notifications:', err);
      }
    }
    setupNotifications();
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
      if (!data) return;

      if (data.type === 'GET_PUSH_TOKEN' || data.type === 'SYNC_PUSH_TOKEN' || data.type === 'USER_LOGGED_IN') {
        try {
          let pushToken = '';
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: '5224f65b-1ac1-47a6-9adf-f6441a6268e1'
            });
            pushToken = tokenData.data;
          } catch (e) {
            const deviceTokenData = await Notifications.getDevicePushTokenAsync();
            pushToken = deviceTokenData.data;
          }

          const userAuthToken = data.token;
          if (pushToken && webViewRef.current) {
            const sendTokenJS = `
              (function() {
                try {
                  const authToken = '${userAuthToken || ''}' || localStorage.getItem('token');
                  if (authToken) {
                    fetch('https://parrowskills.com/api/auth/expo-push-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
                      body: JSON.stringify({ token: '${pushToken}' })
                    }).then(r => r.json()).catch(err => console.error('Push token sync err:', err));
                  }
                } catch (e) {}
              })();
            `;
            webViewRef.current.injectJavaScript(sendTokenJS);
          }
        } catch (e) {}
      } else if (data.type === 'SHOW_NOTIFICATION' || data.type === 'DEVICE_NOTIFICATION') {
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

    // Allow accounts.google.com to load directly within app WebView
    if (url.includes('accounts.google.com')) {
      return true;
    }

    // Intercept phone calls, WhatsApp messages, emails, SMS, UPI & payment gateway intent links
    const isExternalScheme = 
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('whatsapp:') ||
      url.startsWith('sms:') ||
      url.startsWith('intent:') ||
      url.startsWith('upi:') ||
      url.startsWith('phonepe:') ||
      url.startsWith('paytmmp:') ||
      url.startsWith('gpay:') ||
      url.startsWith('tez:') ||
      url.startsWith('razorpay:') ||
      url.startsWith('cred:') ||
      url.startsWith('paytm:') ||
      url.includes('api.whatsapp.com') ||
      url.includes('wa.me');

    if (isExternalScheme) {
      Linking.openURL(url).catch(err => console.warn('Could not open external URL:', url, err));
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
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        applicationNameForUserAgent="Chrome/124.0.0.0 Mobile Safari/537.36"
        javaScriptEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        androidHardwareAccelerationDisabled={false}
        overScrollMode="never"
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
