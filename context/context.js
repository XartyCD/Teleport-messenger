import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import io from 'socket.io-client';

// Создаем контекст
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const appVersion = "0.0.1"

  // const CONNECTURL = "https://yaprikolist.ru/api"
  const CONNECTURL = Platform.OS === 'ios' ? 'http://localhost:9000/api' : 'http://10.0.2.2:9000/api';
  // const CONNECTURL = 'https://4979-2604-6600-1c6-2000-8331-32a5-fd3f-f347.ngrok-free.app'

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessages, setNewMessages] = useState([]);

  // Используем useRef для хранения WebSocket-соединения
  const socketRef = useRef(null);

  const [userChats, setUserChats] = useState([   // для рендера чатов в MainChatsScreen
    { "id": 1, "lastMessage": "Локалка", "lastMessageDate": "10.03.2020, 12:18:01", "lastMessageStatus": "sent", "receiver_name": "Павел" }
  ]);
  console.log("Auth", userId)


  useEffect(() => {
    if (userId && !socketRef.current) {
      console.log("Создание WebSocket-соединения...");
      socketRef.current = Platform.OS === 'ios' ? io('http://localhost:9003') : io('http://10.0.2.2:9003');

      socketRef.current.on("connect", () => {
        socketRef.current.emit("addUserSocket", userId);
      });

      socketRef.current.on("disconnect", () => {
        console.log("WebSocket отключен.");
      });

      // Получение сообщений от сервера
      socketRef.current.on("allMessages", (data) => {
        console.log("Получены сообщения:", data);
        setMessages(data);

        // После получения сообщений, обновим состояние чатов
        updateUserChats(data);
      });

      // Получение новых сообщений
      socketRef.current.on("getNewMessage", (message) => {
        console.log("Получено новое сообщение:", message);

        setMessages((prevMessages) => {
          // Ищем чат по receiver_name
          const chatIndex = prevMessages.findIndex(chat => chat.chat_id === message.chat_id);

          if (chatIndex !== -1) {
            // Чат найден → добавляем новое сообщение в него
            const updatedChats = [...prevMessages];
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              messages: [
                ...updatedChats[chatIndex].messages,
                {
                  message_chat_id: message.message_chat_id,
                  content: message.content,
                  date: message.date,
                  sender_id: message.sender_id,
                  receiver_id: message.receiver_id,
                  status: message.status
                }  // Сохраняем сообщение без receiver_name
              ]
            };
            console.log("Обновленный чат:", updatedChats);
            return updatedChats;
          } else {
            // Чат не найден → создаем новый
            return [
              ...prevMessages,
              {
                chat_id: message.chat_id,
                receiver_name: message.receiver_name,  // Используем receiver_name
                messages: [
                  {
                    message_chat_id: message.message_chat_id,
                    content: message.content,
                    date: message.date,
                    sender_id: message.sender_id,
                    receiver_id: message.receiver_id,
                    status: message.status
                  }
                ]
              }
            ];
          }
        });

        // Обновляем список чатов с новым сообщением
        updateUserChats([message]);

        // Локальное уведомление
        sendLocalNotification(message);
      });


    } else {
      if (socketRef.current) {
        console.log("Пользователь разлогинился, закрываем WebSocket...");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    return () => {
      if (socketRef.current) {
        console.log("Закрытие сокета при размонтировании...");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);


  // Функция для запроса сообщений у сервера
  const fetchMessages = () => {
    if (userId && socketRef.current) {
      console.log("Запрашиваем сообщения...");
      socketRef.current.emit("getMessages", userId);
    }
  };

  // запрос сообщений
  useEffect(() => {
    if (userId) {
      fetchMessages(); // Запрос при монтировании
    }
  }, [userId]);



  // Функция для обновления чатов в userChats для рендера чатов в MainChatsScreen
  const updateUserChats = (messages) => {
    // Группируем сообщения по chat_id
    console.log(messages)
    const chats = {};

    // Группируем сообщения по chat_id
    messages.forEach((chat) => {
      if (!chats[chat.chat_id]) {
        chats[chat.chat_id] = {
          receiver_name: chat.receiver_name, // Имя собеседника из данных чата
          messages: [], // Массив для сообщений чата
          unreadCount: 0, // Счетчик непрочитанных сообщений
        };
      }

      // Добавляем все сообщения чата в соответствующий массив
      chat.messages.forEach((message) => {
        chats[chat.chat_id].messages.push(message);
      });
    });

    // Преобразуем chats в массив и сортируем по дате последнего сообщения
    const sortedChats = Object.keys(chats)
      .map((chatId) => {
        const chatMessages = chats[chatId].messages;
        const lastMessage = chatMessages[chatMessages.length - 1]; // Последнее сообщение
        return {
          id: Number(chatId),
          receiver_name: chats[chatId].receiver_name, // Имя собеседника
          lastMessage: lastMessage.content, // Содержание последнего сообщения
          lastMessageStatus: lastMessage.status, // Дата последнего сообщения
          lastMessageDate: lastMessage.date, // Дата последнего сообщения
        };
      })
      .sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate)); // Сортировка по времени

    console.log("Отсортированные чаты:", sortedChats);

    // Устанавливаем обновленные чаты в состоянии
    setUserChats(sortedChats);
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
    <AppContext.Provider value={{ getAllDataFromAsyncStorage, appVersion, user, setUser, userId, setUserId, sessionId, setSessionId, checkInternetConnection, userChats, setUserChats, messages, CONNECTURL, socket: socketRef.current }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  return useContext(AppContext)
}