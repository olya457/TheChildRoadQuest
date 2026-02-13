import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ImageBackground, Image, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { WebView } from 'react-native-webview';

const bg = require('../assets/loader_bg.png');    
const logo = require('../assets/logo.png');       
type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

export default function LoaderScreen({ navigation }: Props) {
  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 5000);

    return () => clearTimeout(t);
  }, [navigation]);

  const loaderHtml = useMemo(
    () => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
/>
<style>
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    background: transparent;
    overflow: hidden;
  }

  .wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .loader {
    width: 112px;
    height: 112px;
    position: relative;
  }

  .box1, .box2, .box3 {
    border: 16px solid #f5f5f5;
    box-sizing: border-box;
    position: absolute;
    display: block;
  }

  .box1 {
    width: 112px;
    height: 48px;
    margin-top: 64px;
    margin-left: 0px;
    animation: abox1 4s 1s forwards ease-in-out infinite;
  }

  .box2 {
    width: 48px;
    height: 48px;
    margin-top: 0px;
    margin-left: 0px;
    animation: abox2 4s 1s forwards ease-in-out infinite;
  }

  .box3 {
    width: 48px;
    height: 48px;
    margin-top: 0px;
    margin-left: 64px;
    animation: abox3 4s 1s forwards ease-in-out infinite;
  }

  @keyframes abox1 {
    0% { width:112px; height:48px; margin-top:64px; margin-left:0px; }
    12.5% { width:48px; height:48px; margin-top:64px; margin-left:0px; }
    25% { width:48px; height:48px; margin-top:64px; margin-left:0px; }
    37.5% { width:48px; height:48px; margin-top:64px; margin-left:0px; }
    50% { width:48px; height:48px; margin-top:64px; margin-left:0px; }
    62.5% { width:48px; height:48px; margin-top:64px; margin-left:0px; }
    75% { width:48px; height:112px; margin-top:0px; margin-left:0px; }
    87.5% { width:48px; height:48px; margin-top:0px; margin-left:0px; }
    100% { width:48px; height:48px; margin-top:0px; margin-left:0px; }
  }

  @keyframes abox2 {
    0% { width:48px; height:48px; margin-top:0px; margin-left:0px; }
    12.5% { width:48px; height:48px; margin-top:0px; margin-left:0px; }
    25% { width:48px; height:48px; margin-top:0px; margin-left:0px; }
    37.5% { width:48px; height:48px; margin-top:0px; margin-left:0px; }
    50% { width:112px; height:48px; margin-top:0px; margin-left:0px; }
    62.5% { width:48px; height:48px; margin-top:0px; margin-left:64px; }
    75% { width:48px; height:48px; margin-top:0px; margin-left:64px; }
    87.5% { width:48px; height:48px; margin-top:0px; margin-left:64px; }
    100% { width:48px; height:48px; margin-top:0px; margin-left:64px; }
  }

  @keyframes abox3 {
    0% { width:48px; height:48px; margin-top:0px; margin-left:64px; }
    12.5% { width:48px; height:48px; margin-top:0px; margin-left:64px; }
    25% { width:48px; height:112px; margin-top:0px; margin-left:64px; }
    37.5% { width:48px; height:48px; margin-top:64px; margin-left:64px; }
    50% { width:48px; height:48px; margin-top:64px; margin-left:64px; }
    62.5% { width:48px; height:48px; margin-top:64px; margin-left:64px; }
    75% { width:48px; height:48px; margin-top:64px; margin-left:64px; }
    87.5% { width:48px; height:48px; margin-top:64px; margin-left:64px; }
    100% { width:112px; height:48px; margin-top:64px; margin-left:0px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="loader" aria-label="loading">
      <span class="box1"></span>
      <span class="box2"></span>
      <span class="box3"></span>
    </div>
  </div>
</body>
</html>`,
    []
  );

  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <View style={styles.centerWrap} pointerEvents="none">
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.loaderWrap} pointerEvents="none">
        <WebView
          originWhitelist={['*']}
          source={{ html: loaderHtml }}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          containerStyle={styles.webviewContainer}
          {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : {})}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 40 }], 
  },

  logo: {
    width: 220,
    height: 220,
  },

  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 40 + 170 }], 
  },

  webviewContainer: {
    backgroundColor: 'transparent',
  },

  webview: {
    width: 140,
    height: 140,
    backgroundColor: 'transparent',
    opacity: 0.95,
  },
});
