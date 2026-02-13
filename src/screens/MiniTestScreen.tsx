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
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_FEATHERS = 'feathers_total_v1';

const ASSETS = {
  bg: require('../assets/cq_play_bg.png'),
  duck: require('../assets/duck.png'),
  back: require('../assets/back_arrow.png'),
  winBg: require('../assets/cq_win_bg.png'),
  loseBg: require('../assets/cq_lose_bg.png'),
};

type QA = {
  id: string;
  question: string;
  answers: [string, string, string];
  correctIndex: 0 | 1 | 2;
};

type Stage = 'start' | 'quiz' | 'result';

type ShuffledQ = {
  id: string;
  question: string;
  answers: string[];
  correctShuffledIndex: number;
};

const QUESTIONS_20: QA[] = [
  { id: 'q1', question: 'Where does a bird feel safest?', answers: ['In the sky', 'In the nest', 'On the road'], correctIndex: 1 },
  { id: 'q2', question: 'What makes a place feel like home?', answers: ['Warmth', 'Noise', 'Cold walls'], correctIndex: 0 },
  { id: 'q3', question: 'What do you protect when you care about someone?', answers: ['Feelings', 'Distance', 'Time'], correctIndex: 0 },
  { id: 'q4', question: 'What helps you rest after a long day?', answers: ['Silence', 'Comfort', 'Speed'], correctIndex: 1 },

  { id: 'q5', question: 'What do you do when someone needs help?', answers: ['Help them', 'Walk away', 'Wait'], correctIndex: 0 },
  { id: 'q6', question: 'What shows care without words?', answers: ['Leaving', 'Listening', 'Ignoring'], correctIndex: 1 },
  { id: 'q7', question: 'What keeps relationships strong?', answers: ['Distance', 'Fear', 'Trust'], correctIndex: 2 },
  { id: 'q8', question: 'What matters most in difficult moments?', answers: ['Rush', 'Noise', 'Patience'], correctIndex: 2 },

  { id: 'q9', question: 'What moves you forward?', answers: ['A step', 'Looking back', 'Standing still'], correctIndex: 0 },
  { id: 'q10', question: 'What helps you not give up?', answers: ['Doubt', 'Hope', 'Anger'], correctIndex: 1 },
  { id: 'q11', question: 'What makes a long path easier?', answers: ['Waiting', 'Complaining', 'Small steps'], correctIndex: 2 },
  { id: 'q12', question: 'What guides you when the way is unclear?', answers: ['Silence', 'Light', 'Fear'], correctIndex: 1 },

  { id: 'q13', question: 'What do memories keep?', answers: ['Moments', 'Rules', 'Objects'], correctIndex: 0 },
  { id: 'q14', question: 'What makes a memory warm?', answers: ['Distance', 'Time', 'Care'], correctIndex: 2 },
  { id: 'q15', question: 'What stays with you from the past?', answers: ['Speed', 'Noise', 'Feelings'], correctIndex: 2 },
  { id: 'q16', question: 'What helps you remember important things?', answers: ['Forgetting', 'Attention', 'Rushing'], correctIndex: 1 },

  { id: 'q17', question: 'What builds trust?', answers: ['Control', 'Honesty', 'Silence'], correctIndex: 1 },
  { id: 'q18', question: 'What breaks trust?', answers: ['Lies', 'Time', 'Care'], correctIndex: 0 },
  { id: 'q19', question: 'What connects parents and children?', answers: ['Rules', 'Distance', 'Care'], correctIndex: 2 },
  { id: 'q20', question: 'What helps you feel understood?', answers: ['Arguing', 'Leaving', 'Listening'], correctIndex: 2 },
];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession(seed: number): ShuffledQ[] {
  const rnd = mulberry32(seed);
  const qOrder = shuffle(QUESTIONS_20, rnd);

  return qOrder.map(q => {
    const idxs = [0, 1, 2] as const;
    const shuffledIdxs = shuffle([...idxs], rnd);
    const shuffledAnswers = shuffledIdxs.map(i => q.answers[i]);
    const correctShuffledIndex = shuffledIdxs.indexOf(q.correctIndex);

    return {
      id: q.id,
      question: q.question,
      answers: shuffledAnswers,
      correctShuffledIndex,
    };
  });
}

async function getFeathersTotal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_FEATHERS);
    const v = raw ? Number(raw) : 0;
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  } catch {
    return 0;
  }
}

async function addFeathers(delta: number): Promise<number> {
  const cur = await getFeathersTotal();
  const next = Math.max(0, cur + Math.floor(delta));
  try {
    await AsyncStorage.setItem(STORAGE_FEATHERS, String(next));
  } catch {}
  return next;
}

export default function MiniTestScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTiny = height <= 670;
  const isMini = height <= 610;

  const TOP_LIFT = 10;

  const [stage, setStage] = useState<Stage>('start');
  const [feathersTotal, setFeathersTotal] = useState<number>(0);

  const [sessionQs, setSessionQs] = useState<ShuffledQ[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);

  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean>(false);

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [earnedThisRun, setEarnedThisRun] = useState<number>(0);

  const [duckError, setDuckError] = useState<boolean>(false);

  const startFade = useRef(new Animated.Value(1)).current;
  const startPop = useRef(new Animated.Value(1)).current;

  const quizFade = useRef(new Animated.Value(1)).current;
  const quizPop = useRef(new Animated.Value(1)).current;

  const plus = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    try {
      navigation?.setOptions?.({ headerShown: false, gestureEnabled: false });
    } catch {}
  }, [navigation]);

  useEffect(() => {
    (async () => setFeathersTotal(await getFeathersTotal()))();
  }, []);

  const sizes = useMemo(() => {
    const safeTop = Math.max(10, insets.top + 8 - TOP_LIFT);
    const safeBottom = Math.max(8, insets.bottom);

    const titleSize = isMini ? 18 : isTiny ? 19 : 20;

    const duckSize = clamp(Math.round(width * (isMini ? 0.52 : isTiny ? 0.58 : 0.64)), 170, 320);
    const minDuckZoneH = clamp(Math.round(duckSize * 1.05), 190, 380);

    const cardW = Math.min(460, Math.round(width * (isMini ? 0.92 : 0.9)));
    const qBoxPadV = isMini ? 10 : 12;
    const qFont = isMini ? 14 : isTiny ? 15 : 16;

    const aFont = isMini ? 16 : isTiny ? 18 : 19;
    const btnH = isMini ? 48 : isTiny ? 54 : 58;
    const btnGap = isMini ? 10 : 12;

    const startBtnW = Math.min(360, Math.round(width * 0.84));
    const startBtnH = isMini ? 54 : 60;

    return {
      safeTop,
      safeBottom,
      titleSize,
      duckSize,
      minDuckZoneH,
      cardW,
      qBoxPadV,
      qFont,
      aFont,
      btnH,
      btnGap,
      startBtnW,
      startBtnH,
    };
  }, [width, insets.top, insets.bottom, isTiny, isMini]);

  const current = sessionQs[qIndex];

  const runStartAnim = () => {
    startFade.setValue(0);
    startPop.setValue(0.985);
    Animated.parallel([
      Animated.timing(startFade, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(startPop, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const runQuizAnim = () => {
    quizFade.setValue(0);
    quizPop.setValue(0.985);
    Animated.parallel([
      Animated.timing(quizFade, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(quizPop, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (stage === 'start') runStartAnim();
    if (stage === 'quiz') runQuizAnim();
  }, [stage]);

  useEffect(() => {
    if (stage === 'quiz') runQuizAnim();
  }, [qIndex]);

  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
  };

  const startRun = () => {
    const seed = Date.now();
    const s = buildSession(seed);

    setSessionQs(s);
    setQIndex(0);

    setPicked(null);
    setLocked(false);

    setCorrectCount(0);
    setEarnedThisRun(0);

    setStage('quiz');
  };

  const finishRun = () => setStage('result');

  const answerPress = async (answerIndex: number) => {
    if (!current || locked) return;

    setLocked(true);
    setPicked(answerIndex);

    const isCorrect = answerIndex === current.correctShuffledIndex;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setEarnedThisRun(prev => prev + 1);

      const nextTotal = await addFeathers(1);
      setFeathersTotal(nextTotal);

      plus.setValue(0);
      Animated.timing(plus, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    setTimeout(() => {
      const nextQ = qIndex + 1;
      if (nextQ < sessionQs.length) {
        setQIndex(nextQ);
        setPicked(null);
        setLocked(false);
      } else {
        setPicked(null);
        setLocked(false);
        finishRun();
      }
    }, 520);
  };

  const doShare = async () => {
    const total = sessionQs.length || 20;
    const msg = `Mini Test complete. Correct: ${correctCount}/${total}. Feathers earned: ${earnedThisRun}.`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  const TopBar = () => (
    <View style={[styles.topBar, { paddingTop: sizes.safeTop }]}>
      <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
        <Image source={ASSETS.back} style={styles.backIcon} resizeMode="contain" />
      </Pressable>

      <View style={styles.topCenter}>
        <Text style={[styles.topTitle, { fontSize: sizes.titleSize }]}>Test</Text>
        {stage === 'quiz' && (
          <Text style={styles.progressText}>
            {qIndex + 1}/{sessionQs.length || 20}
          </Text>
        )}
      </View>

      <View style={styles.topRight}>
        <Text style={styles.featherText}>🪶 {feathersTotal}</Text>
      </View>
    </View>
  );

  const DuckFallback = () => (
    <View style={[styles.duckFallback, { width: sizes.duckSize, height: sizes.duckSize }]}>
      <Text style={styles.duckFallbackText}>?</Text>
    </View>
  );

  const StartView = () => (
    <ImageBackground source={ASSETS.bg} style={styles.bg} resizeMode="cover">
      <View pointerEvents="none" style={styles.dimStart} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TopBar />

        <View style={[styles.center, { minHeight: sizes.minDuckZoneH }]}>
          <Animated.View style={{ opacity: startFade, transform: [{ scale: startPop }], flexShrink: 0 }}>
            {duckError ? (
              <DuckFallback />
            ) : (
              <Image
                source={ASSETS.duck}
                style={{ width: sizes.duckSize, height: sizes.duckSize }}
                resizeMode="contain"
                fadeDuration={0}
                onError={() => setDuckError(true)}
              />
            )}
          </Animated.View>
        </View>

        <View style={[styles.bottomStart, { paddingBottom: Math.max(14, sizes.safeBottom + 14) }]}>
          <Pressable
            onPress={startRun}
            style={({ pressed }) => [
              styles.primaryBtnOuter,
              { width: sizes.startBtnW, height: sizes.startBtnH, borderRadius: 14 },
              pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={[styles.primaryBtnInner, { borderRadius: 12 }]}>
              <Text style={styles.primaryBtnText}>Start</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );

  const QuizView = () => {
    if (!current) return null;

    return (
      <ImageBackground source={ASSETS.bg} style={styles.bg} resizeMode="cover">
        <View pointerEvents="none" style={styles.dimQuiz} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <TopBar />

          <Animated.View style={[styles.quizWrap, { opacity: quizFade, transform: [{ scale: quizPop }] }]}>
            <View style={[styles.questionBox, { width: sizes.cardW, paddingVertical: sizes.qBoxPadV }]}>
              <Text style={[styles.questionText, { fontSize: sizes.qFont }]} numberOfLines={6}>
                {current.question}
              </Text>
            </View>

            <View style={{ height: sizes.btnGap }} />

            {current.answers.map((a, i) => {
              const wasPicked = picked === i;
              const correct = i === current.correctShuffledIndex;

              const afterPick =
                picked === null
                  ? null
                  : wasPicked
                  ? correct
                    ? styles.ansCorrect
                    : styles.ansWrong
                  : correct
                  ? styles.ansCorrectGhost
                  : styles.ansDim;

              return (
                <Pressable
                  key={`${current.id}_${i}`}
                  onPress={() => answerPress(i)}
                  disabled={locked}
                  style={({ pressed }) => [
                    styles.answerBtn,
                    { width: sizes.cardW, height: sizes.btnH },
                    afterPick,
                    pressed && !locked && { opacity: 0.92, transform: [{ scale: 0.995 }] },
                  ]}
                >
                  <Text style={[styles.answerText, { fontSize: sizes.aFont }]} numberOfLines={1}>
                    {a}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.plusOne,
              {
                opacity: plus,
                transform: [
                  { translateY: plus.interpolate({ inputRange: [0, 1], outputRange: [10, -18] }) },
                  { scale: plus.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.05] }) },
                ],
                bottom: Math.max(14, sizes.safeBottom + 14),
              },
            ]}
          >
            <Text style={styles.plusOneText}>+1 🪶</Text>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>
    );
  };

  const ResultView = () => {
    const total = sessionQs.length || 20;
    const won = correctCount > total / 2;

    const bgImg = won ? ASSETS.winBg : ASSETS.loseBg;
    const title = won ? 'LEVEL DONE' : 'Game Over';
    const sub = won
      ? `Correct: ${correctCount}/${total}\nFeathers earned: ${earnedThisRun} 🪶`
      : `Correct: ${correctCount}/${total}\nFeathers earned: ${earnedThisRun} 🪶\n\nNot every path is easy.\nSometimes we stop to gather strength.`;

    const primary = won ? 'Next Step' : 'Try Again';

    const onPrimary = () => {
      if (won) setStage('start');
      else startRun();
    };

    return (
      <ImageBackground source={bgImg} style={styles.bg} resizeMode="cover">
        <View pointerEvents="none" style={styles.dimResult} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={[styles.resultCenter, { paddingTop: Math.max(20, insets.top + 20 - TOP_LIFT) }]}>
            <Text style={styles.resultTitle}>{title}</Text>
            <Text style={styles.resultSub}>{sub}</Text>
          </View>

          <View style={[styles.resultBottom, { paddingBottom: Math.max(14, sizes.safeBottom + 14) }]}>
            <Pressable
              onPress={onPrimary}
              style={({ pressed }) => [
                styles.primaryBtnOuter,
                { width: Math.min(360, Math.round(width * 0.84)), height: isMini ? 56 : 60, borderRadius: 14 },
                pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={[styles.primaryBtnInner, { borderRadius: 12 }]}>
                <Text style={styles.primaryBtnText}>{primary}</Text>
              </View>
            </Pressable>

            <View style={{ height: 12 }} />

            <View style={styles.resultRow}>
              <Pressable onPress={doShare} style={({ pressed }) => [styles.secondaryPill, pressed && { opacity: 0.9 }]}>
                <Text style={styles.secondaryPillText}>Share</Text>
              </Pressable>
              <Pressable onPress={goBack} style={({ pressed }) => [styles.secondaryPill, pressed && { opacity: 0.9 }]}>
                <Text style={styles.secondaryPillText}>Exit</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  };

  if (stage === 'start') return <StartView />;
  if (stage === 'quiz') return <QuizView />;
  return <ResultView />;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },

  dimStart: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },
  dimQuiz: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  dimResult: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.14)' },

  topBar: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  backBtn: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  backIcon: { width: 22, height: 22 },

  topCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRight: { width: 84, alignItems: 'flex-end', justifyContent: 'center' },

  topTitle: {
    color: '#FFD89B',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  progressText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '900',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  featherText: {
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bottomStart: { alignItems: 'center', justifyContent: 'flex-end' },

  duckFallback: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,214,130,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duckFallbackText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
    fontSize: 42,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  quizWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 14 },

  questionBox: {
    borderRadius: 10,
    backgroundColor: 'rgba(245,236,225,0.96)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(120,85,55,0.65)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: 'rgba(25,16,10,0.95)',
    fontWeight: '900',
    textAlign: 'center',
  },

  answerBtn: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  answerText: { color: 'rgba(0,0,0,0.90)', fontWeight: '900' },

  ansCorrect: { backgroundColor: 'rgba(75,170,85,0.95)' },
  ansWrong: { backgroundColor: 'rgba(220,90,90,0.95)' },
  ansCorrectGhost: { backgroundColor: 'rgba(75,170,85,0.55)' },
  ansDim: { opacity: 0.55 },

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
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    letterSpacing: 0.2,
  },

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

  plusOne: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  plusOneText: {
    color: '#FFE5B6',
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
});
