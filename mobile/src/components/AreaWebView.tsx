import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAppSelector } from '../shared/src/native';
import styles from '../style/index';

interface AreaWebViewProps {
  url: string;
}

export function AreaWebView({ url }: AreaWebViewProps) {
  const { token } = useAppSelector((state) => state.auth);

  const injectedJS = `
    (function () {
      try {
        if (window.location.origin === 'https://front.mambokara.dev') {
          const token = ${JSON.stringify(token || '')};
          if (token) {
            localStorage.setItem('area_token', token);
            console.log('Token set successfully');
          }
        }
      } catch (e) {
        console.error('Error setting token:', e);
      }
    })();
    true;
  `;

  const isUrlAllowed = (url: string) => {
    return (
      url.startsWith('https://front.mambokara.dev') || url.startsWith('area://')
    );
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['https://front.mambokara.dev/*', 'area://*']}
        onShouldStartLoadWithRequest={(request) => {
          if (isUrlAllowed(request.url)) {
            return true;
          }
          return false;
        }}
        startInLoadingState={true}
        style={styles.webview}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#e94560' />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
        }}
        onLoadStart={() => console.log('WebView loading started')}
        onLoadEnd={() => console.log('WebView loading ended')}
        mixedContentMode='never'
        allowsInlineMediaPlayback={false}
        mediaPlaybackRequiresUserAction={true}
        sharedCookiesEnabled={true}
      />
    </View>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   webview: {
//     flex: 1,
//   },
//   loadingContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//   },
// });
