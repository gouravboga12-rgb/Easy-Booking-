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
    // Listen for deep link URL redirects (parrowskills://oauth#access_token=...) from Chrome after Google Sign-In
    const handleDeepLink = (event) => {
      const url = typeof event === 'string' ? event : (event && event.url ? event.url : '');
      if (!url) return;
      const hashIndex = url.indexOf('#');
      const hashFragment = hashIndex !== -1 ? url.slice(hashIndex + 1) : (url.includes('?') ? url.split('?')[1] : '');
      const hashParams = new URLSearchParams(hashFragment);
      const accessToken = hashParams.get('access_token');
      if (accessToken && webViewRef.current) {
        console.log('Deep link token received in app:', accessToken.slice(0, 10));
        webViewRef.current.injectJavaScript(`
          (function() {
            try {
              if (window.__handleGoogleAccessToken) {
                window.__handleGoogleAccessToken('${accessToken}');
              } else {
                window.location.replace('/#access_token=${accessToken}&token_type=Bearer');
              }
            } catch(e) {
              window.location.replace('/#access_token=${accessToken}&token_type=Bearer');
            }
          })();
        `);
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  useEffect(() => {
    // Fast startup timer to prevent long orange spinner overlay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
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
      } else if (data.type === 'OPEN_GOOGLE_AUTH') {
        try {
          const authUrl = data.url;
          // For mobile app: use parrowskills.com as redirect — WebBrowser intercepts it before it fully loads
          const redirectUri = 'https://parrowskills.com';
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
          
          if (result.type === 'success' && result.url && webViewRef.current) {
            // Extract the access_token from the hash fragment of the result URL
            // Google returns: https://parrowskills.com/#access_token=XXX&token_type=Bearer&...
            const resultUrl = result.url;
            const hashIndex = resultUrl.indexOf('#');
            const hashFragment = hashIndex !== -1 ? resultUrl.slice(hashIndex + 1) : '';
            const hashParams = new URLSearchParams(hashFragment);
            const accessToken = hashParams.get('access_token');
            
            if (accessToken) {
              // Inject JS to call the backend with the token directly (no page reload!)
              const injectJS = `
                (function() {
                  try {
                    // Call the global handler set up by Login.jsx / App.jsx
                    if (window.__handleGoogleAccessToken) {
                      window.__handleGoogleAccessToken('${accessToken}');
                    } else {
                      // Fallback: navigate to home with hash so the App.jsx listener picks it up
                      window.location.replace('/#access_token=${accessToken}&token_type=Bearer');
                    }
                  } catch(e) {
                    window.location.replace('/#access_token=${accessToken}&token_type=Bearer');
                  }
                })();
              `;
              webViewRef.current.injectJavaScript(injectJS);
            } else {
              // No token found — navigate with the full URL so hash listener can try
              webViewRef.current.injectJavaScript(`window.location.replace("${resultUrl}");`);
            }
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            // User cancelled — inject JS to reset the loading state
            webViewRef.current && webViewRef.current.injectJavaScript(`
              (function() {
                try { window.__googleAuthCancelled && window.__googleAuthCancelled(); } catch(e) {}
              })();
            `);
          }
        } catch (authErr) {
          console.warn('Google Auth Session Error:', authErr);
        }
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

    // Intercept accounts.google.com to open in native WebBrowser Custom Tab (prevents Google 400 error in WebView)
    if (url.includes('accounts.google.com')) {
      WebBrowser.openAuthSessionAsync(url, 'https://parrowskills.com').then((result) => {
        if (result.type === 'success' && result.url && webViewRef.current) {
          const resultUrl = result.url;
          const hashIndex = resultUrl.indexOf('#');
          const hashFragment = hashIndex !== -1 ? resultUrl.slice(hashIndex + 1) : '';
          const hashParams = new URLSearchParams(hashFragment);
          const accessToken = hashParams.get('access_token');
          if (accessToken) {
            webViewRef.current.injectJavaScript(`
              (function() {
                try {
                  if (window.__handleGoogleAccessToken) {
                    window.__handleGoogleAccessToken('${accessToken}');
                  } else {
                    window.location.replace('/#access_token=${accessToken}&token_type=Bearer');
                  }
                } catch(e) {
                  window.location.replace('/#access_token=${accessToken}&token_type=Bearer');
                }
              })();
            `);
          } else {
            webViewRef.current.injectJavaScript(`window.location.replace("${resultUrl}");`);
          }
        }
      }).catch(e => console.warn('Google auth load err:', e));
      return false;
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

  const injectedSafeLayoutJS = `
    (function() {
      function injectStyles() {
        var styleEl = document.getElementById('mobile-app-safe-area-fix');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'mobile-app-safe-area-fix';
          document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = \`
          .navbar {
            padding-top: 18px !important;
            height: auto !important;
            min-height: 58px !important;
          }
          .nav-inner {
            height: 54px !important;
          }
          .worker-top-header {
            padding-top: 18px !important;
            padding-bottom: 8px !important;
            height: auto !important;
            min-height: 56px !important;
          }
          .bottom-nav {
            padding-top: 6px !important;
            padding-bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important;
            height: auto !important;
            min-height: 72px !important;
            align-items: stretch !important;
            background: #ffffff !important;
            border-top: 1px solid #eaeaea !important;
          }
          .worker-bottom-nav {
            padding-top: 6px !important;
            padding-bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important;
            height: auto !important;
            min-height: 72px !important;
            align-items: stretch !important;
            background: #ffffff !important;
            border-top: 1px solid #eaeaea !important;
          }
          .bn-tab {
            justify-content: flex-start !important;
            padding: 4px 4px 6px !important;
          }
          .bn-icon {
            font-size: 22px !important;
            width: 22px !important;
            height: 22px !important;
            transform: none !important;
          }
          .bn-label {
            font-size: 10.5px !important;
            font-weight: 600 !important;
          }
          .wbn-item {
            justify-content: flex-start !important;
            padding: 4px 2px 6px !important;
            overflow: visible !important;
          }
          .wbn-item span {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 9.5px !important;
            font-weight: 600 !important;
            color: #64748b !important;
            white-space: nowrap !important;
            overflow: visible !important;
            line-height: 1.2 !important;
          }
          .wbn-item.active span {
            color: #ff8c00 !important;
            font-weight: 700 !important;
          }
          .wbn-icon {
            width: 22px !important;
            height: 22px !important;
          }
          .worker-content {
            padding-bottom: 110px !important;
          }
          .brand-footer {
            margin-bottom: 110px !important;
          }
        \`;
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
      } else {
        injectStyles();
      }
      setInterval(injectStyles, 1500);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://parrowskills.com/login-select' }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedSafeLayoutJS}
        injectedJavaScript={injectedSafeLayoutJS}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: Platform.OS === 'android' ? 20 : 12,
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
