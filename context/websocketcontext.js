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

  const [users, setUsers] = useState([]);

  // Используем useRef для хранения WebSocket-соединения
  const socketRef = useRef(null);

  const [userChats, setUserChats] = useState([   // для рендера чатов в MainChatsScreen
    { "id": 1, "lastMessage": "Локалка", "lastMessageDate": "10.03.2020, 12:18:01", "lastMessageStatus": "sent", "receiver_name": "Павел" }
  ]);
  console.log("Auth", userId)

  useEffect(() => {
    console.log("Обновление обзоров чата")
    updateUserChats(messages)
  }, [messages])


  useEffect(() => {
    if (userId && !socketRef.current) {
      console.log("Создание WebSocket-соединения...");

      // ЛОКАЛКА
      socketRef.current = Platform.OS === 'ios' ? io('ws://localhost:9003') : io('ws://10.0.2.2:9003');
      // ЛОКАЛКА

      // // ДЛЯ СЕРВЕРА
      // socketRef.current = io("wss://xarty.ru", {
      //   transports: ["websocket"],
      // });
      // // ДЛЯ СЕРВЕРА



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
        setUsers(data);// Когда получаем пользователей, сохраняем их в состоянии

      });

      // Инфа об редактировании сообщений
      socketRef.current.on("messageEdited", (message) => {
        const { message_chat_id, receiver_id, content } = message;

        setMessages(prevMessages => {
          return prevMessages.map(chat => {
            if (chat.receiver_id === receiver_id) {
              return {
                ...chat,
                messages: chat.messages.map(msg => {
                  if (msg.message_chat_id === message_chat_id) {
                    // Если нашли нужное сообщение, обновляем его содержимое
                    return {
                      ...msg,
                      content: content, // новое содержимое сообщения
                    };
                  }
                  return msg; // если не нашли, оставляем сообщение без изменений
                })
              };
            }
            return chat; // если чат не совпадает, оставляем его без изменений
          });
        });
      });


      // Инфа об удалении сообщений
      socketRef.current.on("messageDeleted", (message) => {
        const { message_chat_id, receiver_id } = message;

        setMessages(prevMessages => {
          return prevMessages.map(chat => {
            if (chat.receiver_id === receiver_id) {
              return {
                ...chat,
                messages: chat.messages.filter(msg => msg.message_chat_id !== message_chat_id)
              };
            }
            return chat;
          });
        });
      });



      // Получение новых сообщений
      socketRef.current.on("getNewMessage", (message) => {
        console.log("Получено новое сообщение:", message);

        setMessages((prevMessages) => {
          // Ищем чат по receiver_id
          const chatIndex = prevMessages.findIndex(chat => chat.receiver_id === message.sender_id);

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
            return updatedChats;
          } else {

            // Чат не найден → создаем новый
            return [
              ...prevMessages,
              {
                receiver_id: message.sender_id,
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



  const updateUserChats = (messages) => {
    const chats = {};

    // Группируем сообщения по receiver_id
    messages.forEach((chat) => {
      const receiverId = chat.receiver_id;

      if (!chats[receiverId]) {
        chats[receiverId] = {
          receiver_name: chat.receiver_name, // Имя собеседника
          messages: [], // Массив сообщений
        };
      }

      // Добавляем сообщения
      chats[receiverId].messages.push(...chat.messages);
    });

    // Преобразуем объект в массив и сортируем по последнему сообщению
    const sortedChats = Object.keys(chats)
      .map((receiverId) => {
        const chatMessages = chats[receiverId].messages;
        if (chatMessages.length === 0) return null; // Пропускаем пустые чаты


        const lastMessage = chatMessages[chatMessages.length - 1]; // Последнее сообщение
        return {
          id: Number(receiverId),
          receiver_name: chats[receiverId].receiver_name,
          lastMessage: lastMessage.content,
          lastMessageStatus: lastMessage.status,
          lastMessageDate: lastMessage.date,
        };
      })
      .filter(Boolean) // Убираем пустые значения
      .sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));
    console.log("Осторт", sortedChats)


    // Устанавливаем обновленные чаты в состоянии
    setUserChats(sortedChats);
  };



  return (
    <WebSocketContext.Provider value={{ users, userChats, setUserChats, messages, setMessages, socket: socketRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export function useWebSocketContext() {
  return useContext(WebSocketContext)
}