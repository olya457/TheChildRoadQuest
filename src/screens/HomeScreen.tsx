import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const bg = require('../assets/home_bg.png');
const logo = require('../assets/logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const items: Array<{ title: string; route: keyof RootStackParamList }> = [
  { title: 'Crossword Quest', route: 'CrosswordQuest' },
  { title: 'Nest', route: 'Nest' },
  { title: 'Mini Test', route: 'MiniTest' },
  { title: 'Mother Stories', route: 'MotherStories' },
];

export default function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmall = height <= 700;
  const isTiny = height <= 620;

  const intro = useRef(new Animated.Value(0)).current;
  const buttonsIntro = useRef(new Animated.Value(0)).current;

  const btn1 = useRef(new Animated.Value(0)).current;
  const btn2 = useRef(new Animated.Value(0)).current;
  const btn3 = useRef(new Animated.Value(0)).current;
  const btn4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const enter = Animated.timing(intro, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const enterButtons = Animated.timing(buttonsIntro, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const stagger = Animated.stagger(90, [
      Animated.timing(btn1, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(btn2, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(btn3, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(btn4, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    Animated.sequence([enter, enterButtons, stagger]).start();
  }, [intro, buttonsIntro, btn1, btn2, btn3, btn4]);

  const sizes = useMemo(() => {
    const contentW = Math.min(360, Math.round(width * (isTiny ? 0.90 : isSmall ? 0.86 : 0.82)));
    const btnW = Math.min(320, contentW);

    const btnH = isTiny ? 50 : isSmall ? 56 : 62;
    const btnRadius = 10;

    const gap = isTiny ? 10 : isSmall ? 14 : 16;

    const logoW = Math.min(360, Math.round(width * (isTiny ? 0.84 : 0.88)));
    const logoH = Math.round(logoW * 0.42);
    const topPadBase = Math.max(10, insets.top + (isTiny ? 10 : isSmall ? 16 : 22));
    const bottomPad = Math.max(18, insets.bottom + (isTiny ? 10 : 16));
    const contentOffsetY = isTiny ? 24 : isSmall ? 32 : 60;

    const logoBottom = isTiny ? 8 : 10;

    return {
      btnW,
      btnH,
      btnRadius,
      gap,
      logoW,
      logoH,
      topPadBase,
      bottomPad,
      logoBottom,
      contentOffsetY,
      contentW,
    };
  }, [width, height, isSmall, isTiny, insets.top, insets.bottom]);

  const logoStyle = {
    opacity: intro,
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [-14, 0],
        }),
      },
      {
        scale: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  } as const;

  const buttonsWrapStyle = {
    opacity: buttonsIntro,
    transform: [
      {
        translateY: buttonsIntro.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  } as const;

  const pressScale = (pressed: boolean) => (pressed ? 0.988 : 1);

  const buttonAnimStyle = (v: Animated.Value) =>
    ({
      opacity: v,
      transform: [
        {
          translateY: v.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0],
          }),
        },
      ],
    }) as const;

  const renderButton = (title: string, route: keyof RootStackParamList, anim: Animated.Value, mt: number) => (
    <Animated.View key={route} style={[buttonAnimStyle(anim), { marginTop: mt }]}>
      <Pressable
        onPress={() => navigation.navigate(route)}
        style={({ pressed }) => [
          styles.btnOuter,
          {
            width: sizes.btnW,
            height: sizes.btnH,
            borderRadius: sizes.btnRadius,
            transform: [{ scale: pressScale(pressed) }],
            opacity: pressed ? 0.95 : 1,
          },
        ]}
      >
        <View style={[styles.btnInner, { borderRadius: sizes.btnRadius - 2 }]}>
          <Text style={[styles.btnText, { fontSize: isTiny ? 16 : isSmall ? 18 : 19 }]}>{title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View
          style={[
            styles.container,
            {
              paddingTop: sizes.topPadBase,
              paddingBottom: sizes.bottomPad,
            },
          ]}
        >
       
          <View style={{ width: sizes.contentW, alignItems: 'center', transform: [{ translateY: sizes.contentOffsetY }] }}>
            <Animated.View style={[styles.logoWrap, logoStyle]}>
              <Image source={logo} style={{ width: sizes.logoW, height: sizes.logoH }} resizeMode="contain" />
            </Animated.View>

            <Animated.View style={[styles.buttons, buttonsWrapStyle]}>
              {renderButton(items[0].title, items[0].route, btn1, sizes.logoBottom)}
              {renderButton(items[1].title, items[1].route, btn2, sizes.gap)}
              {renderButton(items[2].title, items[2].route, btn3, sizes.gap)}
              {renderButton(items[3].title, items[3].route, btn4, sizes.gap)}
            </Animated.View>
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  btnOuter: {
    backgroundColor: '#B64B12',
    borderWidth: 2,
    borderColor: '#7E2B08',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  btnInner: {
    flex: 1,
    margin: 3,
    backgroundColor: '#F28A1A',
    borderWidth: 2,
    borderColor: 'rgba(255,220,160,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFE5B6',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.2,
  },
});
