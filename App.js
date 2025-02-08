import { useState, useEffect } from "react"
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { useAppContext, AppProvider } from './context/context.js';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

import InitLoadingScreen from "./screens/InitLoadingScreen.js";

import RegisterScreen from "./screens/RegisterScreen.js";
import LoginScreen from "./screens/LoginScreen.js";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen.js";

import MainChatsScreen from "./screens/MainChatsScreen.js";
import UserProfileScreen from "./screens/UserProfileScreen.js";
import ChatScreen from "./screens/ChatScreen.js";


const Stack = createStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppContent />
      </NavigationContainer>
    </AppProvider>
  );
}

function AppContent() {
  const { user, checkInternetConnection } = useAppContext(); // используем контекст внутри компонента AppContent
  const [isLoading, setIsLoading] = useState(true);
  console.log("App")


  // Запуск всего важного при старте приложения
  const initializeApp = async () => {
    try {
      // Выполнение  асинхронной операции
      await checkInternetConnection(true); // проверяет версию и инет
    } catch (error) {
      console.error("Ошибка инициализации:", error);
    } finally {
      setTimeout(showLoadingScreen, 2500) // Снятие флага загрузки после завершения
    }
  };

  const showLoadingScreen = () => {
    setIsLoading(false)
  }

  // Запуск функции инициализации при монтировании
  useEffect(() => {
    initializeApp()
  }, []);

  if (isLoading) {
    return (
      <InitLoadingScreen /> // Отдельный экран загрузки
    );
  }

  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'white' }  // Устанавливаем фон для навигируемых страниц
    }}>
      {!user ? (
        <>
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainChatsScreen" component={MainChatsScreen} />
          <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </>
      )}

    </Stack.Navigator>
  );
}