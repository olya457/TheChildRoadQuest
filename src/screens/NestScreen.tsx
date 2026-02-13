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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_FEATHERS = 'feathers_total_v1';
const STORAGE_NEST_LEVEL = 'nest_level_v1'; 
const STORAGE_QUIZ_PERFECT = 'quiz_perfect_unlock_v1'; 

const ASSETS = {
  back: require('../assets/back_arrow.png'),

  nestBg1: require('../assets/nest_1.png'),
  nestBg2: require('../assets/nest_2.png'),
  nestBg3: require('../assets/nest_3.png'),
  nestBg4: require('../assets/nest_4.png'),

  eggGold: require('../assets/egg_gold.png'),
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

async function getInt(key: string, def: number) {
  try {
    const raw = await AsyncStorage.getItem(key);
    const v = raw ? Number(raw) : def;
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : def;
  } catch {
    return def;
  }
}

async function setInt(key: string, v: number) {
  try {
    await AsyncStorage.setItem(key, String(Math.max(0, Math.floor(v))));
  } catch {}
}

async function getBool(key: string) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

async function addFeathers(delta: number) {
  const cur = await getInt(STORAGE_FEATHERS, 0);
  const next = Math.max(0, cur + Math.floor(delta));
  await setInt(STORAGE_FEATHERS, next);
  return next;
}

type Level = 1 | 2 | 3 | 4;

const LEVEL_BG: Record<Level, any> = {
  1: ASSETS.nestBg1,
  2: ASSETS.nestBg2,
  3: ASSETS.nestBg3,
  4: ASSETS.nestBg4,
};

function getCostToNext(level: Level) {
  return level === 4 ? 0 : 20;
}

export default function NestScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTiny = height <= 670;
  const isMini = height <= 610;

  const TOP_LIFT = 10;

  const [feathers, setFeathers] = useState(0);
  const [level, setLevel] = useState<Level>(1);

  const [eggUnlocked, setEggUnlocked] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const uiAppear = useRef(new Animated.Value(0)).current;

  const bgFadeIn = useRef(new Animated.Value(1)).current;
  const bgFadeNext = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1)).current;

  const eggPop = useRef(new Animated.Value(0)).current;

  const modalFade = useRef(new Animated.Value(0)).current;

  const [bgCurrent, setBgCurrent] = useState<any>(LEVEL_BG[1]);
  const [bgNext, setBgNext] = useState<any | null>(null);

  useEffect(() => {
    try {
      navigation?.setOptions?.({ headerShown: false });
    } catch {}
  }, [navigation]);

  const sizes = useMemo(() => {
    const safeTop = Math.max(10, insets.top + 8 - TOP_LIFT);
    const safeBottom = Math.max(10, insets.bottom);

    const titleSize = isMini ? 18 : isTiny ? 19 : 20;

    const pillMinW = 64;

    const btnW = Math.min(360, Math.round(width * 0.72));
    const btnH = isMini ? 44 : isTiny ? 48 : 52;

    const eggSize = clamp(Math.round(width * (isMini ? 0.28 : 0.30)), 72, 120);

    const modalW = Math.min(420, Math.round(width * 0.82));
    const modalPad = isMini ? 12 : 14;

    const bottomPad = Math.max(14, safeBottom + (isMini ? 18 : 26));

    return {
      safeTop,
      safeBottom,
      titleSize,
      pillMinW,
      btnW,
      btnH,
      eggSize,
      modalW,
      modalPad,
      bottomPad,
    };
  }, [width, height, insets.top, insets.bottom, isTiny, isMini]);

  const goBack = () => navigation?.goBack?.();

  const animateEgg = () => {
    eggPop.setValue(0);
    Animated.timing(eggPop, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.back(1.35)),
      useNativeDriver: true,
    }).start();
  };

  const load = async () => {
    const [f, lvlRaw, egg] = await Promise.all([
      getInt(STORAGE_FEATHERS, 0),
      getInt(STORAGE_NEST_LEVEL, 1),
      getBool(STORAGE_QUIZ_PERFECT),
    ]);

    const lvl = clamp(lvlRaw, 1, 4) as Level;

    setFeathers(f);
    setLevel(lvl);
    setEggUnlocked(egg);

    setBgCurrent(LEVEL_BG[lvl]);
    setBgNext(null);

    uiAppear.setValue(0);
    Animated.timing(uiAppear, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (egg) animateEgg();
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const unsub = navigation?.addListener?.('focus', async () => {
      const egg = await getBool(STORAGE_QUIZ_PERFECT);
      setEggUnlocked(egg);
      if (egg) animateEgg();
    });
    return unsub;
  }, [navigation]);

  const openUpgrade = () => {
    if (level === 4) return;
    setModalOpen(true);
    modalFade.setValue(0);
    Animated.timing(modalFade, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeUpgrade = () => {
    Animated.timing(modalFade, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setModalOpen(false));
  };

  const animateBgSwap = (nextLevel: Level) => {
    const nextBg = LEVEL_BG[nextLevel];
    setBgNext(nextBg);

    bgFadeIn.setValue(1);
    bgFadeNext.setValue(0);
    bgScale.setValue(1);

    Animated.parallel([
      Animated.timing(bgFadeNext, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bgFadeIn, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bgScale, {
        toValue: 1.01,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBgCurrent(nextBg);
      setBgNext(null);

      bgFadeIn.setValue(1);
      bgFadeNext.setValue(0);
      bgScale.setValue(1);
    });
  };

  const doUpgrade = async () => {
    if (level === 4) return;

    const cost = getCostToNext(level);
    const curFeathers = await getInt(STORAGE_FEATHERS, 0);
    if (curFeathers < cost) return;

    const after = await addFeathers(-cost);
    setFeathers(after);

    const nextLevel = clamp(level + 1, 1, 4) as Level;
    await setInt(STORAGE_NEST_LEVEL, nextLevel);
    setLevel(nextLevel);

    animateBgSwap(nextLevel);
    closeUpgrade();
  };

  const canUpgrade = level !== 4 && feathers >= getCostToNext(level);

  const renderModal = () => {
    if (!modalOpen) return null;

    const cost = getCostToNext(level);
    const enough = feathers >= cost;

    return (
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalCard, { width: sizes.modalW, padding: sizes.modalPad, opacity: modalFade }]}>
          <Text style={styles.modalTitle}>Upgrade the nest?</Text>
          <View style={{ height: 10 }} />
          <Text style={styles.modalSub}>
            Cost: <Text style={styles.modalStrong}>{cost}</Text> feathers
          </Text>
          <View style={{ height: 12 }} />

          <View style={styles.modalRow}>
            <Pressable onPress={closeUpgrade} style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.92 }]}>
              <Text style={styles.modalBtnText}>No</Text>
            </Pressable>

            <Pressable
              onPress={enough ? doUpgrade : undefined}
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnRight,
                !enough && { opacity: 0.45 },
                pressed && enough && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={styles.modalBtnText}>{cost}</Text>
              <Text style={[styles.modalBtnText, { marginLeft: 6 }]}>🪶</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  };

  const uiOpacity = uiAppear;
  const uiTranslate = uiAppear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgFadeIn, transform: [{ scale: bgScale }] }]}>
        <ImageBackground source={bgCurrent} style={styles.bg} resizeMode="cover" />
      </Animated.View>

      {!!bgNext && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgFadeNext, transform: [{ scale: bgScale }] }]}>
          <ImageBackground source={bgNext} style={styles.bg} resizeMode="cover" />
        </Animated.View>
      )}

      <View pointerEvents="none" style={styles.dim} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.topBar, { paddingTop: sizes.safeTop, opacity: uiOpacity, transform: [{ translateY: uiTranslate }] }]}>
          <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Image source={ASSETS.back} style={styles.backIcon} resizeMode="contain" />
          </Pressable>

          <Text style={[styles.topTitle, { fontSize: sizes.titleSize }]}>Nest</Text>

          <View style={[styles.pill, { minWidth: sizes.pillMinW }]}>
            <Text style={styles.pillText}>🪶 {feathers}</Text>
          </View>
        </Animated.View>

        {eggUnlocked && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.eggCenter,
              {
                opacity: eggPop,
                transform: [
                  { translateY: eggPop.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                  { scale: eggPop.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }) },
                ],
              },
            ]}
          >
            <Image source={ASSETS.eggGold} style={{ width: sizes.eggSize, height: sizes.eggSize }} resizeMode="contain" />
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.bottom,
            {
              paddingBottom: sizes.bottomPad,
              opacity: uiOpacity,
              transform: [{ translateY: uiTranslate }],
            },
          ]}
        >
          <Pressable
            onPress={level !== 4 ? openUpgrade : undefined}
            style={({ pressed }) => [
              styles.upgradeBtn,
              { width: sizes.btnW, height: sizes.btnH },
              level === 4 && { opacity: 0.45 },
              pressed && level !== 4 && { opacity: 0.92, transform: [{ scale: 0.995 }] },
            ]}
          >
            <Text style={styles.upgradeText}>{level !== 4 ? 'Upgrade' : 'Max level'}</Text>
            {level !== 4 && <Text style={styles.plus}>+</Text>}
          </Pressable>

          {level !== 4 && (
            <Text style={[styles.hint, !canUpgrade && { opacity: 0.7 }]}>
              Need {getCostToNext(level)} 🪶 to upgrade
            </Text>
          )}
        </Animated.View>

        {renderModal()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  safe: { flex: 1 },

  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },

  topBar: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  backBtn: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  backIcon: { width: 22, height: 22 },

  topTitle: {
    color: '#FFD89B',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  pill: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,216,155,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },

  eggCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },

  upgradeBtn: {
    borderRadius: 7,
    backgroundColor: '#F28A1A',
    borderWidth: 2,
    borderColor: '#7E2B08',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  upgradeText: {
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  plus: {
    marginLeft: 8,
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  hint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '800',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(245,236,225,0.96)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(120,85,55,0.65)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalTitle: {
    color: 'rgba(25,16,10,0.95)',
    fontWeight: '900',
    fontSize: 14,
    textAlign: 'center',
  },
  modalSub: {
    color: 'rgba(25,16,10,0.78)',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  modalStrong: { fontWeight: '900', color: 'rgba(25,16,10,0.92)' },

  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  modalBtn: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(242,138,26,0.95)',
    borderWidth: 2,
    borderColor: 'rgba(126,43,8,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    flexDirection: 'row',
  },
  modalBtnRight: {
    backgroundColor: 'rgba(182,75,18,0.92)',
  },
  modalBtnText: {
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
