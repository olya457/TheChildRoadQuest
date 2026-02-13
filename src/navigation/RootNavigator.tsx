import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';

import CrosswordQuestScreen from '../screens/CrosswordQuestScreen';
import NestScreen from '../screens/NestScreen';
import MiniTestScreen from '../screens/MiniTestScreen';
import MotherStoriesScreen from '../screens/MotherStoriesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Loader" component={LoaderScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="CrosswordQuest" component={CrosswordQuestScreen} />
      <Stack.Screen name="Nest" component={NestScreen} />
      <Stack.Screen name="MiniTest" component={MiniTestScreen} />
      <Stack.Screen name="MotherStories" component={MotherStoriesScreen} />
    </Stack.Navigator>
  );
}
