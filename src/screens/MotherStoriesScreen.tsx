import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ASSETS = {
  bg: require('../assets/cq_play_bg.png'),
  back: require('../assets/back_arrow.png'),

  s1: require('../assets/story_1.png'),
  s2: require('../assets/story_2.png'),
  s3: require('../assets/story_3.png'),
  s4: require('../assets/story_4.png'),
  s5: require('../assets/story_5.png'),
};

type Story = {
  id: string;
  title: string;
  text: string;
  image: any;
};

const STORIES: Story[] = [
  {
    id: 's1',
    title: 'Before Everything Changed',
    text: 'I remember the quiet days.\nWhen I was just waiting.\nListening to my own heartbeat.\nEverything felt simple then.',
    image: ASSETS.s1,
  },
  {
    id: 's2',
    title: 'Preparing the Nest',
    text: 'I tried to make it safe.\nI brought everything I could find.\nEvery feather mattered.',
    image: ASSETS.s2,
  },
  {
    id: 's3',
    title: 'A Quiet Joy',
    text: 'I talked to you every day.\nYou couldn’t hear me.\nBut I knew you were there.',
    image: ASSETS.s3,
  },
  {
    id: 's4',
    title: 'The Moment I Lost You',
    text: 'One moment everything was here.\nAnd then…\nOnly silence remained.',
    image: ASSETS.s4,
  },
  {
    id: 's5',
    title: 'I Am Still Waiting',
    text: 'I haven’t moved.\nI haven’t forgotten.\nI believe you will come back.',
    image: ASSETS.s5,
  },
];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function MotherStoriesScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTiny = height <= 670;
  const isMini = height <= 610;

  const TOP_LIFT = 10;

  const [index, setIndex] = useState(0);
  const story = STORIES[index];

  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.985)).current;

  const imgFade = useRef(new Animated.Value(0)).current;
  const imgPop = useRef(new Animated.Value(0.96)).current;

  const btnLift = useRef(new Animated.Value(8)).current;

  const animateIn = () => {
    fade.setValue(0);
    pop.setValue(0.985);
    imgFade.setValue(0);
    imgPop.setValue(0.96);
    btnLift.setValue(8);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pop, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.05)), useNativeDriver: true }),

      Animated.timing(imgFade, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(imgPop, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(1.25)), useNativeDriver: true }),

      Animated.timing(btnLift, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    try {
      navigation?.setOptions?.({ headerShown: false });
    } catch {}
  }, [navigation]);

  useEffect(() => {
    animateIn();
  }, [index]);

  const sizes = useMemo(() => {
    const safeTop = Math.max(10, insets.top + 8 - TOP_LIFT);
    const safeBottom = Math.max(12, insets.bottom);

    const headerSize = isMini ? 18 : isTiny ? 19 : 20;

    const cardW = Math.min(460, Math.round(width * (isMini ? 0.92 : isTiny ? 0.90 : 0.88)));
    const cardH = clamp(Math.round(height * (isMini ? 0.42 : isTiny ? 0.44 : 0.46)), 290, 430);

    const titleSize = isMini ? 14 : isTiny ? 15 : 16;
    const textSize = isMini ? 12 : isTiny ? 13 : 14;

    const imgSize = clamp(Math.round(cardW * (isMini ? 0.48 : isTiny ? 0.50 : 0.52)), 165, 240);
    const imgRadius = 50;

    const btnW = Math.min(190, Math.round((cardW - 18) / 2));
    const btnH = isMini ? 40 : isTiny ? 42 : 44;

    const cardPadH = isMini ? 16 : 18;
    const cardPadTop = isMini ? 14 : 16;

    const textLineHeight = isMini ? 17 : isTiny ? 18 : 19;

    return {
      safeTop,
      safeBottom,
      headerSize,
      cardW,
      cardH,
      titleSize,
      textSize,
      imgSize,
      imgRadius,
      btnW,
      btnH,
      cardPadH,
      cardPadTop,
      textLineHeight,
    };
  }, [width, height, insets.top, insets.bottom, isTiny, isMini]);

  const goBack = () => navigation?.goBack?.();

  const onNext = () => setIndex(prev => (prev >= STORIES.length - 1 ? 0 : prev + 1));

  const onShare = async () => {
    const msg = `${story.title}\n\n${story.text}`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  return (
    <ImageBackground source={ASSETS.bg} style={styles.bg} resizeMode="cover">
      <View pointerEvents="none" style={styles.dim} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { paddingTop: sizes.safeTop }]}>
          <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Image source={ASSETS.back} style={styles.backIcon} resizeMode="contain" />
          </Pressable>

          <Text style={[styles.headerTitle, { fontSize: sizes.headerSize }]}>Mothers Stories</Text>

          <View style={{ width: 44, height: 44 }} />
        </View>

        <View style={styles.center}>
          <Animated.View
            style={[
              styles.card,
              {
                width: sizes.cardW,
                height: sizes.cardH,
                paddingHorizontal: sizes.cardPadH,
                paddingTop: sizes.cardPadTop,
                opacity: fade,
                transform: [{ scale: pop }],
              },
            ]}
          >
            <Text style={[styles.cardTitle, { fontSize: sizes.titleSize }]} numberOfLines={2}>
              {story.title}
            </Text>

            <Text
              style={[styles.cardText, { fontSize: sizes.textSize, lineHeight: sizes.textLineHeight }]}
              numberOfLines={8}
            >
              {story.text}
            </Text>

            <View style={styles.cardImageWrap}>
              <Animated.View style={{ opacity: imgFade, transform: [{ scale: imgPop }] }}>
                <Image
                  source={story.image}
                  style={{
                    width: sizes.imgSize,
                    height: sizes.imgSize,
                    borderRadius: sizes.imgRadius, 
                  }}
                  resizeMode="cover"
                />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.bottom,
            {
              paddingBottom: Math.max(14, sizes.safeBottom + 12),
              transform: [{ translateY: btnLift }],
              opacity: fade,
            },
          ]}
        >
          <View style={[styles.btnRow, { width: sizes.cardW }]}>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => [
                styles.goldBtnOuter,
                { width: sizes.btnW, height: sizes.btnH, borderRadius: 18 },
                pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
              ]}
            >
              <View style={[styles.goldBtnInner, { borderRadius: 16 }]}>
                <Text style={styles.goldBtnText}>Share</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={onNext}
              style={({ pressed }) => [
                styles.goldBtnOuter,
                { width: sizes.btnW, height: sizes.btnH, borderRadius: 18 },
                pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
              ]}
            >
              <View style={[styles.goldBtnInner, { borderRadius: 16 }]}>
                <Text style={styles.goldBtnText}>Next</Text>
              </View>
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
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },

  topBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  backBtn: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  backIcon: { width: 22, height: 22 },

  headerTitle: {
    color: '#FFD89B',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: 'rgba(245,236,225,0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    textAlign: 'center',
    color: 'rgba(25,16,10,0.95)',
    fontWeight: '900',
  },
  cardText: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(25,16,10,0.72)',
    fontWeight: '700',
  },
  cardImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },

  bottom: { alignItems: 'center', justifyContent: 'flex-end' },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  goldBtnOuter: {
    backgroundColor: '#7E2B08',
    borderWidth: 2,
    borderColor: '#5B1D06',
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  goldBtnInner: {
    flex: 1,
    margin: 3,
    backgroundColor: '#B8741A',
    borderWidth: 2,
    borderColor: 'rgba(255,220,160,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBtnText: {
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
