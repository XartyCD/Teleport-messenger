import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import io from 'socket.io-client';

import { useAppContext } from "../context/context.js"

// Создаем контекст
export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { getAllDataFromAsyncStorage, checkInternetConnection, CONNECTURL, userId, user, sessionId } = useAppContext()

  const [messages, setMessages] = useState([]);
  const [newMessages, setNewMessages] = useState([]);

  const [users, setUsers] = useState("");


  // Используем useRef для хранения WebSocket-соединения
  const socketRef = useRef(null);

  const [userChats, setUserChats] = useState([   // для рендера чатов в MainChatsScreen
    { "id": 1, "lastMessage": "Локалка", "lastMessageDate": "10.03.2020, 12:18:01", "lastMessageStatus": "sent", "receiver_name": "Павел" }
  ]);
  console.log("Auth", userId)


  useEffect(() => {
    if (userId && !socketRef.current) {
      console.log("Создание WebSocket-соединения...");

      // ЛОКАЛКА
      // socketRef.current = Platform.OS === 'ios' ? io('ws://localhost:9003') : io('ws://10.0.2.2:9003');
      // ЛОКАЛКА

      // ДЛЯ СЕРВЕРА
      socketRef.current = io("wss://xarty.ru", {
        transports: ["websocket"],
      });
      // ДЛЯ СЕРВЕРА



      socketRef.current.on("connect", () => {
        socketRef.current.emit("addUserSocket", userId);
      });
      socketRef.current.on("connect_error", (error) => {
        console.error("Ошибка подключения WebSocket:", error);
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

      socketRef.current.on("allUsers", (data) => {
        console.log("Юзеры:", data);
        setUsers(data); // Когда получаем пользователей, сохраняем их в состоянии

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
  const fetchUsers = () => {
    if (userId && socketRef.current) {
      console.log("Запрашиваем юзеров...");
      socketRef.current.emit("getAllUsers", userId);
    }
  };

  // запрос сообщений
  useEffect(() => {
    if (userId) {
      fetchUsers()
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



  return (
    <WebSocketContext.Provider value={{ users, userChats, setUserChats, messages, socket: socketRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export function useWebSocketContext() {
  return useContext(WebSocketContext)
}