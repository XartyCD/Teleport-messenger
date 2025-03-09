import { useState, useEffect } from "react"
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext, AppProvider } from './context/context.js';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

import * as Font from "expo-font";

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
        <AppContent />
      </NavigationContainer>
    </AppProvider >
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
      await checkInternetConnection(); // проверяет инет
      await Font.loadAsync({
        "ConcertOne-Regular": require("./assets/fonts/ConcertOne-Regular.ttf"),
        "LondrinaSketch-Regular": require("./assets/fonts/LondrinaSketch-Regular.ttf"),
        "Merienda-VariableFont_wght": require("./assets/fonts/Merienda-VariableFont_wght.ttf"),
        "Pacifico-Regular": require("./assets/fonts/Pacifico-Regular.ttf"),

        "Comfortaa-VariableFont_wght": require("./assets/fonts/Comfortaa-VariableFont_wght.ttf"),
        "GreatVibes-Regular": require("./assets/fonts/GreatVibes-Regular.ttf"),
        "Lobster-Regular": require("./assets/fonts/Lobster-Regular.ttf"),
        "UbuntuCondensed-Regular": require("./assets/fonts/UbuntuCondensed-Regular.ttf"),
      });

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


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="InitLoadingScreen" component={InitLoadingScreen} />
        ) : !user ? (
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
      </Stack.Navigator >
    </SafeAreaView >
  );
}  