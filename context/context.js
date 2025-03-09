import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import io from 'socket.io-client';

// Создаем контекст
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const appVersion = "0.0.1"
  const [socket, setSocket] = useState("")

  // const CONNECTURL = "https://yaprikolist.ru/api"
  const CONNECTURL = Platform.OS === 'ios' ? 'http://localhost:9000/api' : 'http://10.0.2.2:9000/api';
  // const CONNECTURL = 'https://4979-2604-6600-1c6-2000-8331-32a5-fd3f-f347.ngrok-free.app'

  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const [userChats, setUserChats] = useState([ // Получаем этот массив при рендере MainChatScreen, выставить ограничение на отправку запросов
    { id: "1", name: "Алиса", lastMessage: "Привет! Как дела?" },
    { id: "2", name: "Борис", lastMessage: "Завтра встречаемся?" },
    { id: "3", name: "Света", lastMessage: "Отправила тебе фото 📸" },
    { id: "4", name: "Евгений", lastMessage: "Пошли в бар?" },
    { id: "5", name: "Жека", lastMessage: "Поедешь в Сочи?" },
    { id: "6", name: "Диана", lastMessage: "Что ты делал вчера?" },
  ]);
  console.log("Auth")


  const createSocket = () => {
    const newSocket = Platform.OS === 'ios' ? io('http://localhost:9003') : io('http://10.0.2.2:9003')
    setSocket(newSocket)

    return newSocket;
  };


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
    if (sessionId !== null) { // Проверяем, что `sessionId` не `null`
      saveData("sessionId", sessionId);
    }
  }, [user])



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
    <AppContext.Provider value={{ getAllDataFromAsyncStorage, appVersion, user, setUser, sessionId, setSessionId, checkInternetConnection, socket, createSocket, userChats, setUserChats, CONNECTURL }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext)
}