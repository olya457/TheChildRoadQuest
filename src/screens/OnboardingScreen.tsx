import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const PAGES = [
  {
    key: 'p1',
    bg: require('../assets/onb_1.png'),
    text: 'One day, someone dear to me was taken away.\nLocked behind cold stone walls.\nI cannot reach them on my own.',
    button: 'Begin the Journey',
  },
  {
    key: 'p2',
    bg: require('../assets/onb_2.png'),
    text: 'Every small step matters.\nSolve crosswords\nto move closer.',
    button: 'Move Forward',
  },
  {
    key: 'p3',
    bg: require('../assets/onb_3.png'),
    text: 'I need to restore the nest.\nTests help me make it stronger and safer.',
    button: 'Build the Nest',
  },
  {
    key: 'p4',
    bg: require('../assets/onb_4.png'),
    text: 'I remember how I prepared.\nThe quiet joy.\nHow everything slowly changed.',
    button: 'Listen to the Stories',
  },
] as const;
type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmall = height <= 700;
  const [index, setIndex] = useState(0);

  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const page = PAGES[index];

  const sizes = useMemo(() => {
    const textSize = Math.max(16, Math.min(22, Math.round(width * (isSmall ? 0.048 : 0.052))));
    const btnH = isSmall ? 56 : 62;
    const btnW = Math.min(320, Math.round(width * 0.72));
    const btnRadius = 10;
    const bottomPad = Math.max(18, insets.bottom + (isSmall ? 10 : 18));
    const textDrop = 160;

    return { textSize, btnH, btnW, btnRadius, bottomPad, textDrop };
  }, [width, isSmall, insets.bottom]);

  const animateTo = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIndex(nextIndex);
      translateY.setValue(12);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const onPrimaryPress = () => {
    const isLast = index === PAGES.length - 1;
    if (isLast) {
      navigation.replace('Home');
      return;
    }
    animateTo(index + 1);
  };

  return (
    <ImageBackground source={page.bg} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.overlay, { opacity, transform: [{ translateY }] }]}>
          <View style={[styles.textWrap, { paddingTop: sizes.textDrop + Math.max(0, insets.top * 0.1) }]}>
            <Text
              style={[
                styles.storyText,
                {
                  fontSize: sizes.textSize,
                  lineHeight: Math.round(sizes.textSize * 1.35),
                  paddingHorizontal: Math.round(width * 0.09),
                },
              ]}
            >
              {page.text}
            </Text>
          </View>

          <View style={[styles.bottom, { paddingBottom: sizes.bottomPad }]}>
            <Pressable
              onPress={onPrimaryPress}
              style={({ pressed }) => [
                styles.primaryBtn,
                { width: sizes.btnW, height: sizes.btnH, borderRadius: sizes.btnRadius },
                pressed && styles.primaryPressed,
              ]}
            >
              <Text style={[styles.primaryText, { fontSize: isSmall ? 16 : 17 }]}>{page.button}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  overlay: { flex: 1 },

  textWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  storyText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.92)',
    ...Platform.select({
      ios: { fontWeight: '600' },
      android: { fontWeight: '600' },
    }),
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  bottom: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C4F0E',
    borderWidth: 1,
    borderColor: 'rgba(255,214,130,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  primaryPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },

  primaryText: {
    color: '#FFD89B',
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
