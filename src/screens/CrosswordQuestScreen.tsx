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
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const ASSETS = {
  levelsBg: require('../assets/cq_levels_bg.png'),
  playBg: require('../assets/cq_play_bg.png'),
  winBg: require('../assets/cq_win_bg.png'),
  loseBg: require('../assets/cq_lose_bg.png'),
  duck: require('../assets/duck.png'),
  back: require('../assets/back_arrow.png'),
};

const STORAGE_PROGRESS = 'cq_progress_v3';
const STORAGE_RUN_PERFECT = 'cq_run_perfect_v1';
const STORAGE_QUIZ_PERFECT = 'quiz_perfect_unlock_v1';

type Props = NativeStackScreenProps<RootStackParamList, 'CrosswordQuest'>;

type Mode = 'levels' | 'play' | 'result';

type WordPlacement = {
  id: 1 | 2 | 3;
  answer: string;
  clue: string;
  dir: 'H' | 'V';
  r: number;
  c: number;
};

type LevelConfig = {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  startLabel: string;
  playTitle: string;
  grid: { rows: number; cols: number };
  words: WordPlacement[];
};

const LEVELS: LevelConfig[] = [
  {
    level: 1,
    startLabel: 'Start Level 1',
    playTitle: 'Level 1',
    grid: { rows: 7, cols: 7 },
    words: [
      { id: 1, answer: 'PATH', clue: 'What do you walk on to move forward?', dir: 'H', r: 4, c: 1 },
      { id: 2, answer: 'NEST', clue: 'Where does a bird keep its eggs safe?', dir: 'V', r: 1, c: 3 },
      { id: 3, answer: 'CARE', clue: 'What do you show when you protect someone you love?', dir: 'V', r: 3, c: 2 },
    ],
  },
  {
    level: 2,
    startLabel: 'Start Level 2',
    playTitle: 'Level 2',
    grid: { rows: 7, cols: 7 },
    words: [
      { id: 1, answer: 'ROAD', clue: 'What connects places and helps you travel?', dir: 'H', r: 4, c: 1 },
      { id: 2, answer: 'HOME', clue: 'Where do you feel safe and warm?', dir: 'V', r: 3, c: 2 },
      { id: 3, answer: 'DOOR', clue: 'What do you open to enter a room?', dir: 'V', r: 1, c: 5 },
    ],
  },
  {
    level: 3,
    startLabel: 'Start Level 3',
    playTitle: 'Level 3',
    grid: { rows: 8, cols: 8 },
    words: [
      { id: 1, answer: 'STEP', clue: 'What helps you move forward in small actions?', dir: 'V', r: 1, c: 4 },
      { id: 2, answer: 'NEST', clue: 'Where does a bird rest and protect its eggs?', dir: 'H', r: 3, c: 3 },
      { id: 3, answer: 'MEMORY', clue: 'What do you keep from the past in your mind?', dir: 'H', r: 5, c: 1 },
    ],
  },
  {
    level: 4,
    startLabel: 'Start Level 4',
    playTitle: 'Level 4',
    grid: { rows: 8, cols: 8 },
    words: [
      { id: 1, answer: 'ROAD', clue: 'What leads you from one place to another?', dir: 'H', r: 4, c: 1 },
      { id: 2, answer: 'BIRD', clue: 'What animal has feathers and wings?', dir: 'V', r: 2, c: 1 },
      { id: 3, answer: 'IDEA', clue: 'What do you call a thought in your mind?', dir: 'H', r: 3, c: 1 },
    ],
  },
  {
    level: 5,
    startLabel: 'Start Level 5',
    playTitle: 'Level 5',
    grid: { rows: 9, cols: 9 },
    words: [
      { id: 1, answer: 'LIGHT', clue: 'What helps you see in the dark?', dir: 'V', r: 1, c: 6 },
      { id: 2, answer: 'STEP', clue: 'What small action moves you closer to a goal?', dir: 'H', r: 5, c: 1 },
      { id: 3, answer: 'PATH', clue: 'What guides you toward your destination?', dir: 'V', r: 3, c: 2 },
    ],
  },
  {
    level: 6,
    startLabel: 'Start Level 6',
    playTitle: 'Level 6',
    grid: { rows: 8, cols: 8 },
    words: [
      { id: 1, answer: 'TRAIL', clue: 'What do you follow in nature to keep moving?', dir: 'H', r: 4, c: 1 },
      { id: 2, answer: 'RING', clue: 'What circular thing can you wear on a finger?', dir: 'V', r: 4, c: 2 },
      { id: 3, answer: 'LAMP', clue: 'What gives a small warm light indoors?', dir: 'V', r: 4, c: 5 },
    ],
  },
  {
    level: 7,
    startLabel: 'Start Level 7',
    playTitle: 'Level 7',
    grid: { rows: 9, cols: 9 },
    words: [
      { id: 1, answer: 'STONE', clue: 'What is a small piece of rock?', dir: 'H', r: 4, c: 1 },
      { id: 2, answer: 'NOTE', clue: 'What do you write down to remember something?', dir: 'V', r: 3, c: 3 },
      { id: 3, answer: 'TORCH', clue: 'What do you carry to light a dark way?', dir: 'V', r: 4, c: 2 },
    ],
  },
  {
    level: 8,
    startLabel: 'Start Level 8',
    playTitle: 'Level 8',
    grid: { rows: 8, cols: 8 },
    words: [
      { id: 1, answer: 'GATE', clue: 'What do you pass through to enter a place?', dir: 'H', r: 4, c: 2 },
      { id: 2, answer: 'TALE', clue: 'What do you call a short story?', dir: 'V', r: 3, c: 3 },
      { id: 3, answer: 'ECHO', clue: 'What repeats your voice in a cave?', dir: 'V', r: 4, c: 5 },
    ],
  },
  {
    level: 9,
    startLabel: 'Start Level 9',
    playTitle: 'Level 9',
    grid: { rows: 8, cols: 8 },
    words: [
      { id: 1, answer: 'CAMP', clue: 'What do you call a place to sleep outdoors?', dir: 'H', r: 4, c: 2 },
      { id: 2, answer: 'MAP', clue: 'What helps you find directions?', dir: 'V', r: 4, c: 4 },
      { id: 3, answer: 'PACE', clue: 'What word means your walking speed or rhythm?', dir: 'V', r: 4, c: 5 },
    ],
  },
  {
    level: 10,
    startLabel: 'Start Level 10',
    playTitle: 'Level 10',
    grid: { rows: 8, cols: 8 },
    words: [
      { id: 1, answer: 'HAPPY', clue: 'How do you feel when everything is good?', dir: 'H', r: 4, c: 1 },
      { id: 2, answer: 'PATH', clue: 'What do you follow to reach a goal?', dir: 'V', r: 4, c: 3 },
      { id: 3, answer: 'ALLY', clue: 'Who supports you and stays on your side?', dir: 'V', r: 4, c: 2 },
    ],
  },
];

type Cell = {
  key: string;
  r: number;
  c: number;
  blocked: boolean;
  correct?: string;
  number?: 1 | 2 | 3;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

async function getBool(key: string) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

async function setBool(key: string, v: boolean) {
  try {
    await AsyncStorage.setItem(key, v ? '1' : '0');
  } catch {}
}

async function setProgressUnlocked(n: number) {
  try {
    await AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify({ unlocked: n }));
  } catch {}
}

async function getProgressUnlocked(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PROGRESS);
    if (!raw) return 1;
    const p = JSON.parse(raw);
    return clamp(Number(p?.unlocked ?? 1), 1, 10);
  } catch {
    return 1;
  }
}

function buildGrid(level: LevelConfig) {
  const { rows, cols } = level.grid;
  const map: Record<string, Cell> = {};

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}:${c}`;
      map[key] = { key, r, c, blocked: true };
    }
  }

  for (const w of level.words) {
    for (let i = 0; i < w.answer.length; i++) {
      const rr = w.dir === 'H' ? w.r : w.r + i;
      const cc = w.dir === 'H' ? w.c + i : w.c;
      const key = `${rr}:${cc}`;
      const cell = map[key];
      if (!cell) continue;

      cell.blocked = false;

      const letter = w.answer[i].toUpperCase();
      if (cell.correct && cell.correct !== letter) {
        cell.blocked = true;
        continue;
      }

      cell.correct = letter;
      if (i === 0) cell.number = w.id;
    }
  }

  return Object.values(map);
}

function cellsForWord(level: LevelConfig, wordId: 1 | 2 | 3) {
  const w = level.words.find(x => x.id === wordId);
  if (!w) return [];
  const out: { key: string; correct: string }[] = [];
  for (let i = 0; i < w.answer.length; i++) {
    const rr = w.dir === 'H' ? w.r : w.r + i;
    const cc = w.dir === 'H' ? w.c + i : w.c;
    out.push({ key: `${rr}:${cc}`, correct: w.answer[i].toUpperCase() });
  }
  return out;
}

export default function CrosswordQuestScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmall = height <= 740;
  const isTiny = height <= 670;
  const isMini = height <= 610;

  const ANDROID_LIFT = Platform.OS === 'android' ? 30 : 0;
  const ANDROID_EXTRA_SCROLL = Platform.OS === 'android' ? 60 : 0;

  const TOP_SHIFT = 40;
  const GRID_SHIFT = 20;
  const GRID_TO_PANEL_GAP = 10;

  const [mode, setMode] = useState<Mode>('levels');
  const [unlocked, setUnlocked] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig['level']>(1);

  const [perfectRun, setPerfectRun] = useState<boolean>(false);
  const [resultWin, setResultWin] = useState<boolean>(true);

  const isFinalPerfectWin = useMemo(
    () => resultWin && currentLevel === 10 && perfectRun,
    [resultWin, currentLevel, perfectRun]
  );

  const level = useMemo(() => LEVELS.find(l => l.level === currentLevel)!, [currentLevel]);

  const [activeWord, setActiveWord] = useState<1 | 2 | 3>(1);
  const [fill, setFill] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false, headerShown: false });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const u = await getProgressUnlocked();
      setUnlocked(u);
      setCurrentLevel(u as any);
      const pr = await getBool(STORAGE_RUN_PERFECT);
      setPerfectRun(pr);
    })();
  }, []);

  const sizes = useMemo(() => {
    const topPadBase = Math.max(10, insets.top + 8);
    const topPad = Math.max(0, topPadBase - TOP_SHIFT);

    const panelW = Math.min(460, Math.round(width * (isMini ? 0.94 : isTiny ? 0.92 : 0.9)));

    const panelPadV = isMini ? 6 : isTiny ? 7 : 10;
    const panelPadH = isMini ? 9 : isTiny ? 10 : 12;

    const clueFont = isMini ? 11 : isTiny ? 12 : isSmall ? 14 : 15;
    const clueLine = Math.round(clueFont * 1.28);

    const bottomSafe = Math.max(6, insets.bottom);
    const titleSize = isMini ? 17 : isTiny ? 18 : isSmall ? 19 : 20;

    const btnW = Math.min(360, Math.round(width * 0.9));
    const btnH = isMini ? 52 : isTiny ? 54 : 60;
    const btnR = 12;

    const kbSidePad = isMini ? 8 : 10;
    const kbW = width - kbSidePad * 2;
    const keyGap = isMini ? 2 : isTiny ? 2 : 3;

    const keyW0 = Math.floor((kbW - keyGap * 9) / 10);
    const keyH = isMini ? 32 : isTiny ? 36 : 42;
    const keyRadius = isMini ? 10 : 12;

    const backspaceW0 = Math.floor(keyW0 * 1.35);
    const row2Side = Math.floor(keyW0 * 0.55);

    const row3W0 = backspaceW0 + keyGap + keyW0 * 7 + keyGap * 6;

    let keyW = keyW0;
    let backspaceW = backspaceW0;
    if (row3W0 > kbW) {
      keyW = Math.max(21, keyW0 - 2);
      backspaceW = Math.floor(keyW * 1.35);
    }

    const kbPad = isMini ? 4 : isTiny ? 6 : 8;
    const duckSize = clamp(Math.round(width * (isTiny ? 0.54 : 0.6)), 170, 280);

    const clueRowPadV = isMini ? 7 : 9;
    const clueRowMargin = isMini ? 6 : 8;
    const estimatedClueRowH = clueLine + clueRowPadV * 2 + clueRowMargin;
    const estimatedPanelH = panelPadV * 2 + estimatedClueRowH * level.words.length + 8;

    const keyRowH = keyH + 6;
    const actionsH = 40 + 10;
    const estimatedKeyboardH = kbPad + keyRowH * 3 + actionsH + bottomSafe + 6;

    const reservedBottom = estimatedPanelH + GRID_TO_PANEL_GAP + estimatedKeyboardH + 14;

    const gridMaxW = Math.min(Math.round(width * 0.86), 480);
    const gridMaxH = Math.round((height - topPad - reservedBottom) * 0.98);
    const gridMax = Math.max(180, Math.min(gridMaxW, gridMaxH));

    const cellRaw = Math.floor(gridMax / Math.max(level.grid.rows, level.grid.cols));
    const cellMin = isMini ? 24 : isTiny ? 26 : 32;
    const cellMax = isMini ? 38 : isTiny ? 42 : 50;
    const cellSize = clamp(cellRaw, cellMin, cellMax);

    return {
      topPad,
      panelW,
      panelPadV,
      panelPadH,
      clueFont,
      clueLine,
      cellSize,
      bottomSafe,
      titleSize,
      btnW,
      btnH,
      btnR,
      kbPad,
      duckSize,
      kbSidePad,
      keyGap,
      keyW,
      keyH,
      keyRadius,
      backspaceW,
      row2Side,
    };
  }, [
    width,
    height,
    insets.top,
    insets.bottom,
    isSmall,
    isTiny,
    isMini,
    level.grid.rows,
    level.grid.cols,
    level.words.length,
  ]);

  const gridCells = useMemo(() => buildGrid(level), [level]);
  const activeCells = useMemo(() => cellsForWord(level, activeWord), [level, activeWord]);

  const runTransition = (next: () => void) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 10, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      requestAnimationFrame(() => {
        next();
        fade.setValue(1);
        slide.setValue(0);
      });
    });
  };

  const exitToLevels = () => runTransition(() => setMode('levels'));

  const safeGoBack = () => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
    } catch {}
    try {
      navigation.navigate('Home' as any);
    } catch {}
  };

  const startLevel = async () => {
    const lvl = clamp(unlocked, 1, 10) as LevelConfig['level'];
    setCurrentLevel(lvl);
    setFill({});
    setActiveWord(1);
    setCursor(0);

    if (lvl === 1) {
      setPerfectRun(true);
      await setBool(STORAGE_RUN_PERFECT, true);
    } else {
      const pr = await getBool(STORAGE_RUN_PERFECT);
      setPerfectRun(pr);
    }

    runTransition(() => setMode('play'));
  };

  const restartFromBeginning = async () => {
    setUnlocked(1);
    setCurrentLevel(1);
    await setProgressUnlocked(1);

    setPerfectRun(true);
    await setBool(STORAGE_RUN_PERFECT, true);

    setFill({});
    setActiveWord(1);
    setCursor(0);

    runTransition(() => setMode('levels'));
  };

  const doShare = async () => {
    const msg = resultWin
      ? `Crossword Quest — Level ${currentLevel} done.`
      : `Crossword Quest — I will try Level ${currentLevel} again.`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  const checkWin = () => {
    for (const c of gridCells) {
      if (c.blocked) continue;
      const v = (fill[c.key] ?? '').toUpperCase();
      if (!v || v !== (c.correct ?? '').toUpperCase()) return false;
    }
    return true;
  };

  const finish = async () => {
    const win = checkWin();
    setResultWin(win);

    if (!win) {
      setPerfectRun(false);
      await setBool(STORAGE_RUN_PERFECT, false);
    }

    runTransition(() => setMode('result'));
  };

  const tryAgain = () => {
    setFill({});
    setActiveWord(1);
    setCursor(0);
    runTransition(() => setMode('play'));
  };

  const onPrimaryResultPress = async () => {
    if (!resultWin) {
      tryAgain();
      return;
    }

    if (currentLevel < 10) {
      const nextUnlocked = clamp(Math.max(unlocked, currentLevel + 1), 1, 10);
      setUnlocked(nextUnlocked);
      await setProgressUnlocked(nextUnlocked);
      runTransition(() => setMode('levels'));
      return;
    }

    await setBool(STORAGE_QUIZ_PERFECT, true);
    navigation.navigate('Nest' as any);
  };

  const applyLetter = (ch: string) => {
    const cells = activeCells;
    if (!cells.length) return;

    let idx = clamp(cursor, 0, cells.length - 1);
    while (idx < cells.length && (fill[cells[idx].key] ?? '').length > 0) idx++;
    if (idx >= cells.length) idx = clamp(cursor, 0, cells.length - 1);

    const target = cells[idx];
    setFill(prev => ({ ...prev, [target.key]: ch.toUpperCase() }));
    setCursor(clamp(idx + 1, 0, cells.length));
  };

  const backspace = () => {
    const cells = activeCells;
    if (!cells.length) return;

    let idx = clamp(cursor - 1, 0, cells.length - 1);
    while (idx > 0 && !(fill[cells[idx].key] ?? '').length) idx--;

    const k = cells[idx].key;
    if ((fill[k] ?? '').length) {
      setFill(prev => ({ ...prev, [k]: '' }));
      setCursor(idx);
      return;
    }

    if (idx > 0) {
      const k2 = cells[idx - 1].key;
      setFill(prev => ({ ...prev, [k2]: '' }));
      setCursor(idx - 1);
    }
  };

  const openWord = (id: 1 | 2 | 3) => {
    setActiveWord(id);
    setCursor(0);
  };

  const Keyboard = () => {
    const row1 = 'QWERTYUIOP'.split('');
    const row2 = 'ASDFGHJKL'.split('');
    const row3 = 'ZXCVBNM'.split('');

    const keyFont = isMini ? 12 : isTiny ? 14 : 15;

    const Key = ({ label, onPress, w }: { label: string; onPress: () => void; w?: number }) => (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.key,
          { width: w, height: sizes.keyH, borderRadius: sizes.keyRadius, marginHorizontal: sizes.keyGap / 2 },
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
      >
        <Text style={[styles.keyText, { fontSize: keyFont }]}>{label}</Text>
      </Pressable>
    );

    return (
      <View style={[styles.keyboard, { paddingHorizontal: sizes.kbSidePad, paddingBottom: sizes.bottomSafe }]}>
        <View style={styles.kRow}>
          {row1.map(ch => (
            <Key key={ch} label={ch} w={sizes.keyW} onPress={() => applyLetter(ch)} />
          ))}
        </View>

        <View style={styles.kRow}>
          <View style={{ width: sizes.row2Side }} />
          {row2.map(ch => (
            <Key key={ch} label={ch} w={sizes.keyW} onPress={() => applyLetter(ch)} />
          ))}
          <View style={{ width: sizes.row2Side }} />
        </View>

        <View style={styles.kRow}>
          <Key label="⌫" w={sizes.backspaceW} onPress={backspace} />
          {row3.map(ch => (
            <Key key={ch} label={ch} w={sizes.keyW} onPress={() => applyLetter(ch)} />
          ))}
        </View>

        <View style={styles.kRowActions}>
          <Pressable onPress={finish} style={({ pressed }) => [styles.kAction, pressed && { opacity: 0.92 }]}>
            <Text style={styles.kActionText}>Done</Text>
          </Pressable>

          <Pressable onPress={exitToLevels} style={({ pressed }) => [styles.kAction, pressed && { opacity: 0.92 }]}>
            <Text style={styles.kActionText}>Exit</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const LevelsView = () => {
    const duckIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      duckIn.setValue(0);
      Animated.timing(duckIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, [duckIn]);

    const duckStyle = {
      opacity: duckIn,
      transform: [
        { translateY: duckIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
        { scale: duckIn.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      ],
    } as const;

    const startLabel = LEVELS[clamp(unlocked, 1, 10) - 1]?.startLabel ?? 'Start';
    const isCompleted = unlocked >= 10;

    return (
      <ImageBackground source={ASSETS.levelsBg} style={styles.bg} resizeMode="cover">
        <View pointerEvents="none" style={styles.bgDimLevels} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.full}>
            <View style={[styles.topBarFixed, { paddingTop: Math.max(0, insets.top + 8 - TOP_SHIFT) }]}>
              <Pressable
                onPress={safeGoBack}
                style={({ pressed }) => [styles.topBackAbs, pressed && { opacity: 0.85 }]}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Image source={ASSETS.back} style={styles.backIcon} resizeMode="contain" />
              </Pressable>
              <Text style={[styles.topTitle, { fontSize: sizes.titleSize + 1 }]}>Crossword Quest</Text>
              <View style={styles.topBackPlaceholder} />
            </View>

            <View style={[styles.levelCenter, Platform.OS === 'android' && { transform: [{ translateY: -ANDROID_LIFT }] }]}>
              <Animated.View style={duckStyle}>
                <Image source={ASSETS.duck} style={{ width: sizes.duckSize, height: sizes.duckSize }} resizeMode="contain" />
              </Animated.View>
            </View>

            <View
              style={[
                styles.bottomArea,
                { paddingBottom: Math.max(12, insets.bottom + 12) },
                Platform.OS === 'android' && { paddingBottom: Math.max(12, insets.bottom + 12) + ANDROID_LIFT },
              ]}
            >
              <Pressable
                onPress={startLevel}
                style={({ pressed }) => [
                  styles.primaryBtnOuter,
                  { width: sizes.btnW, height: sizes.btnH, borderRadius: sizes.btnR },
                  pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[styles.primaryBtnInner, { borderRadius: sizes.btnR - 2 }]}>
                  <Text style={[styles.primaryBtnText, { fontSize: 17 }]}>{startLabel}</Text>
                </View>
              </Pressable>

              {isCompleted && (
                <>
                  <View style={{ height: 10 }} />
                  <Pressable
                    onPress={restartFromBeginning}
                    style={({ pressed }) => [styles.secondaryPillWide, pressed && { opacity: 0.92 }]}
                  >
                    <Text style={styles.secondaryPillWideText}>Start from Level 1</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  };

  const PlayView = () => {
    const gridW = level.grid.cols * sizes.cellSize;
    const gridH = level.grid.rows * sizes.cellSize;

    const content = (
      <>
        <View style={[styles.topBarFixed, { paddingTop: sizes.topPad }]}>
          <View style={styles.topBackPlaceholder} />
          <Text style={[styles.topTitle, { fontSize: sizes.titleSize }]}>{level.playTitle}</Text>
          <View style={styles.topBackPlaceholder} />
        </View>

        <View style={[styles.playCenter, { transform: [{ translateY: -GRID_SHIFT - ANDROID_LIFT }] }]}>
          <View style={[styles.gridWrap, { width: gridW, height: gridH }]}>
            {gridCells.map(cell => {
              if (cell.blocked) return null;

              const size = sizes.cellSize;
              const left = cell.c * size;
              const top = cell.r * size;

              const isActive = activeCells.some(x => x.key === cell.key);
              const filled = (fill[cell.key] ?? '').toUpperCase();
              const correct = (cell.correct ?? '').toUpperCase();
              const ok = filled && filled === correct;

              return (
                <Pressable
                  key={cell.key}
                  onPress={() => {
                    const w = level.words.find(wd => cellsForWord(level, wd.id as any).some(x => x.key === cell.key));
                    if (w) openWord(w.id as any);
                  }}
                  style={[
                    styles.cell,
                    {
                      width: size - 2,
                      height: size - 2,
                      left,
                      top,
                      backgroundColor: isActive ? 'rgba(242,138,26,0.72)' : 'rgba(255,255,255,0.94)',
                      borderColor: isActive ? 'rgba(255,214,130,0.98)' : 'rgba(0,0,0,0.85)',
                    },
                  ]}
                >
                  {!!cell.number && (
                    <View style={styles.cellNumBadge}>
                      <Text style={styles.cellNum}>{cell.number}</Text>
                    </View>
                  )}
                  <Text style={[styles.cellText, { fontSize: isMini ? 15 : 17 }, ok && { color: '#2B1A08' }]}>
                    {filled || '?'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: GRID_TO_PANEL_GAP }} />

        <View
          style={[
            styles.panel,
            {
              width: sizes.panelW,
              paddingVertical: sizes.panelPadV,
              paddingHorizontal: sizes.panelPadH,
            },
            Platform.OS === 'android' && { transform: [{ translateY: -ANDROID_LIFT }] },
          ]}
        >
          {level.words.map(w => {
            const selected = w.id === activeWord;
            return (
              <Pressable
                key={w.id}
                onPress={() => openWord(w.id)}
                style={({ pressed }) => [
                  styles.clueRow,
                  isMini && styles.clueRowMini,
                  selected && styles.clueRowSelected,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Text
                  style={[
                    styles.clueText,
                    { fontSize: sizes.clueFont, lineHeight: sizes.clueLine },
                    selected && styles.clueTextSelected,
                  ]}
                >
                  {w.clue}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: sizes.kbPad }} />
        <Keyboard />
        {Platform.OS === 'android' && <View style={{ height: ANDROID_EXTRA_SCROLL }} />}
      </>
    );

    return (
      <ImageBackground source={ASSETS.playBg} style={styles.bg} resizeMode="cover">
        <View pointerEvents="none" style={styles.bgDimPlay} />
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.full}>
            {Platform.OS === 'android' ? (
              <ScrollView
                style={styles.full}
                contentContainerStyle={[styles.playScrollContainer, { paddingBottom: Math.max(12, insets.bottom + 12) }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {content}
              </ScrollView>
            ) : (
              content
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  };

  const ResultView = () => {
    const bgImg = resultWin ? ASSETS.winBg : ASSETS.loseBg;
    const title = resultWin ? 'LEVEL DONE' : 'Game Over';
    const sub = resultWin ? 'A Step Closer' : 'Not every path is easy.\nSometimes we stop to gather strength.';
    const primaryText = !resultWin ? 'Try Again' : currentLevel < 10 ? 'Next Step' : 'Go to Nest';

    return (
      <ImageBackground source={bgImg} style={styles.bg} resizeMode="cover">
        <View pointerEvents="none" style={styles.bgDimResult} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.full}>
            <View style={[styles.topBarFixed, { paddingTop: Math.max(0, insets.top + 8 - TOP_SHIFT) }]}>
              <Pressable
                onPress={exitToLevels}
                style={({ pressed }) => [styles.topBackAbs, pressed && { opacity: 0.85 }]}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Image source={ASSETS.back} style={styles.backIcon} resizeMode="contain" />
              </Pressable>
              <Text style={[styles.topTitle, { fontSize: sizes.titleSize + 1 }]}>Crossword Quest</Text>
              <View style={styles.topBackPlaceholder} />
            </View>

            <View style={[styles.resultCenter, { paddingTop: Math.max(20, insets.top + 20) }]}>
              <Text style={styles.resultTitle}>{title}</Text>
              <Text style={styles.resultSub}>{sub}</Text>
            </View>

            <View style={[styles.resultBottom, { paddingBottom: Math.max(14, insets.bottom + 14) }]}>
              <Pressable
                onPress={onPrimaryResultPress}
                style={({ pressed }) => [
                  styles.primaryBtnOuter,
                  {
                    width: Math.min(360, Math.round(width * 0.9)),
                    height: isMini ? 52 : isTiny ? 54 : 60,
                    borderRadius: 12,
                  },
                  pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={[styles.primaryBtnInner, { borderRadius: 10 }]}>
                  <Text style={[styles.primaryBtnText, { fontSize: 17 }]}>{primaryText}</Text>
                </View>
              </Pressable>

              <View style={{ height: 12 }} />

              <View style={styles.resultRow}>
                <Pressable onPress={doShare} style={({ pressed }) => [styles.secondaryPill, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.secondaryPillText}>Share</Text>
                </Pressable>
                <Pressable
                  onPress={exitToLevels}
                  style={({ pressed }) => [styles.secondaryPill, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.secondaryPillText}>Exit</Text>
                </Pressable>
              </View>

              {resultWin && currentLevel === 10 && (
                <Text style={styles.finalHint}>{isFinalPerfectWin ? 'Perfect run!' : 'Completed!'}</Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  };

  if (mode === 'levels') return <LevelsView />;
  if (mode === 'play') return <PlayView />;
  return <ResultView />;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  full: { flex: 1 },

  playScrollContainer: { flexGrow: 1, justifyContent: 'flex-start' },

  bgDimLevels: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },
  bgDimPlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.04)' },
  bgDimResult: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.14)' },

  topBarFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    minHeight: 52,
    position: 'relative',
    zIndex: 20,
  },
  topBackAbs: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 50,
  },
  topBackPlaceholder: { width: 44, height: 44 },

  topTitle: {
    color: '#FFD89B',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  backIcon: { width: 22, height: 22 },

  levelCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomArea: { alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20 },

  primaryBtnOuter: {
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
  primaryBtnInner: {
    flex: 1,
    margin: 3,
    backgroundColor: '#F28A1A',
    borderWidth: 2,
    borderColor: 'rgba(255,220,160,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFE5B6',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    letterSpacing: 0.2,
  },

  secondaryPillWide: {
    width: 220,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(182,75,18,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,130,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPillWideText: { color: '#FFE5B6', fontWeight: '900' },

  playCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridWrap: { position: 'relative' },

  cell: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    color: 'rgba(20,12,8,0.95)',
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.20)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cellNumBadge: {
    position: 'absolute',
    left: -6,
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,130,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNum: { color: '#FFD89B', fontWeight: '900', fontSize: 10 },

  panel: {
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,245,232,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  clueRow: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  clueRowMini: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  clueRowSelected: {
    backgroundColor: 'rgba(242,138,26,0.30)',
    borderColor: 'rgba(242,138,26,0.40)',
  },
  clueText: { color: 'rgba(20,12,8,0.96)', fontWeight: '900' },
  clueTextSelected: { color: 'rgba(35,18,10,1)' },

  keyboard: { width: '100%', backgroundColor: 'transparent', paddingTop: 4 },
  kRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6, width: '100%' },
  key: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  keyText: { color: 'rgba(0,0,0,0.92)', fontWeight: '900' },

  kRowActions: { flexDirection: 'row', justifyContent: 'center', marginTop: 2, marginBottom: 2 },
  kAction: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(182,75,18,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,130,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  kActionText: { color: '#FFE5B6', fontWeight: '900' },

  resultCenter: { alignItems: 'center', justifyContent: 'flex-start' },
  resultTitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 28,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  resultSub: {
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 22,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  resultBottom: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  secondaryPill: {
    width: 120,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(182,75,18,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,130,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  secondaryPillText: { color: '#FFE5B6', fontWeight: '900' },

  finalHint: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 22,
    lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
});
