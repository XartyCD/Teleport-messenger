import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import io from 'socket.io-client';

// Создаем контекст
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const appVersion = "0.0.1"

  const CONNECTURL = "https://xarty.ru/api" // СЕРВЕР
  // const CONNECTURL = Platform.OS === 'ios' ? 'http://localhost:9000/api' : 'http://10.0.2.2:9000/api';  // ЛОКАЛКА

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Вывод AsyncStorage в консоль (для отладки)
  async function getAllDataFromAsyncStorage() {
    try {
      // Получаем все ключи
      const keys = await AsyncStorage.getAllKeys();

      // Получаем все пары ключ-значение
      const result = await AsyncStorage.multiGet(keys);

      // Преобразуем результат в объект для удобства использования
      const allData = result.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

      console.log("Все данные из AsyncStorage:", allData);
      return allData;
    } catch (error) {
      console.error("Ошибка при получении данных из AsyncStorage:", error);
    }
  }

  // Функция на сохранение данных
  const saveData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      // Обработка ошибок при сохранении данных
      console.error("Failed to save data", e)
    }
  }

  useEffect(() => {
    if (user !== null) { // Проверяем, что `user` не `null`
      saveData("user", user);
    }
    if (userId !== null) { // Проверяем, что `userId` не `null`
      saveData("userId", userId);
    }
    if (sessionId !== null) { // Проверяем, что `sessionId` не `null`
      saveData("sessionId", sessionId);
    }
  }, [userId])


  const loadData = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
    } catch (e) {
      // Обработка ошибок при загрузке данных
      console.error("Failed to load data", e);
    }
    return null;
  };


  // Загрузить имя юзера при старте приложения (чтобы сразу перекидывать в аккаунт если имя в сторэдже)
  useEffect(() => {
    const loadUserData = async () => {
      const savedUser = await loadData('user');
      if (savedUser) {
        setUser(savedUser);
      }
      const savedUserId = await loadData('userId');
      if (savedUserId) {
        setUserId(savedUserId);
      }
      const savedSession = await loadData('sessionId');
      if (savedSession) {
        setSessionId(savedSession);
      }
    };

    loadUserData();
  }, []);

  // Проверка интернета (вынесено через контекст)
  const checkInternetConnection = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      console.log("+ Инет")
      return true
    } else {
      console.log("Инета нет")
      return false // По умолчанию инет false, версия не проверяется
    }
  };

  return (
    <AppContext.Provider value={{ getAllDataFromAsyncStorage, appVersion, user, setUser, userId, setUserId, sessionId, setSessionId, checkInternetConnection, CONNECTURL }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext)
}