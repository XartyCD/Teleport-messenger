import { Platform, StyleSheet, TextInput, ScrollView, Text, View, Pressable, Image, Alert } from 'react-native';
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useAppContext } from '../context/context.js';



export default ChatScreen = ({ navigation }) => {
  const { checkInfoApp, CONNECTURL } = useAppContext();


  const { user, setUser } = useAppContext();
  const [sendWarn, setsendWarn] = useState("");
  const [sendingMessage, setSendingMessage] = useState(null);
  const [messages, setMessages] = useState([]); // Состояние для хранения сообщений
  const scrollViewRef = useRef()
  const [isAtBottom, setIsAtBottom] = useState(true);


  const globalChatUpdate = async () => {
    try {
      const response = await fetch(`${CONNECTURL}/getmessagesglobalchat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.messages !== messages) {
        // Если массив сообщений изменился, обновляем state
        setMessages(data.messages);

      }

    } catch (error) {
      console.error('Ошибка при получения сообщений:', error);
    }
  }

  const sendMessage = async () => {
    if (sendingMessage === "" || sendingMessage === "." || sendingMessage.length >= 120) {
      setnameWarn("Такое здесь не одобряют")

    } else {
      try {
        const response = await fetch(`${CONNECTURL}/sendmessageglobalchat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user, sendingMessage }),
        });


        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        else {
          globalChatUpdate()
          setSendingMessage("")
          console.log('Сообщение успешно добавлено');
          console.log('Ответ сервера:', data);
        }

      } catch (error) {
        console.error('Ошибка при отправке данных:', error);
      }
    }
  }


  useEffect(() => {
    globalChatUpdate(); // Запрос на обновление сообщений при первом входе
    const intervalId = setInterval(globalChatUpdate, 2300); // Обновление сообщений каждые 2.3 секунды

    return () => clearInterval(intervalId); // Очищаем интервал при размонтировании компонента
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isAtBottom]);

  // Функция для проверки, находится ли ScrollView внизу
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40; // 40 - допустимое отклонение для учета некоторых погрешностей
    setIsAtBottom(isAtBottom);
  }, []);

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.topPanel}>
        <Text style={styles.chatName}>Чат сообщества</Text>
      </View>
      <View style={styles.chatWrapper}>
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16} // Устанавливаем частоту обновления скроллинга
          onContentSizeChange={() => {
            // Обновляем состояние, чтобы прокрутка происходила, если находимся внизу
            if (isAtBottom && scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }
          }}
        >
          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((message, index) => (
              <View key={index} style={styles.messageBlock}>
                {message.user === user ? (
                  <Text style={styles.messageYouUser}>{message.user}</Text>
                ) : (
                  <Text style={styles.messageUser}>{message.user}</Text>
                )}
                <Text style={styles.messageText}>{message.message}</Text>
                <Text style={styles.messageTime}>{new Date(message.time).toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text>No messages available</Text> // Сообщение, если сообщений нет
          )}
        </ScrollView>
      </View>
      <View style={styles.inputChatWrapper}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputChat}
            placeholder="Сообщение"
            onChangeText={e => setSendingMessage(e)}
            value={sendingMessage}
            onSubmitEditing={sendMessage}
          />
        </View>
        <View>
          <Pressable
            style={
              styles.sendButton
            }
            onPress={sendMessage}
          ><Image
              source={require('../assets/images/sendIcon.png')}
              style={{
                width: 33,
                height: 33,
              }}
              resizeMode="cover"
            />
          </Pressable>
        </View>
      </View>
    </View>
  )
};


const styles = StyleSheet.create({
  mainWrapper: {
    marginTop: 48.9,
    marginBottom: 20,
    flexDirection: "column"
  },
  topPanel: {
    backgroundColor: "#6d95b3cd",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20
  },
  chatName: {
    fontSize: 21,
    color: "white"
  },

  chatWrapper: {
    backgroundColor: "#ecebffcd",
    height: "85%",
    width: "100%",
  },

  messageBlock: {
    backgroundColor: '#e0e0e0',
    paddingTop: 8,
    paddingBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 11,
    marginTop: 11,
    marginBottom: 7,
    marginHorizontal: 12,
    width: "auto",
    maxWidth: 450,
    height: "auto",

  },

  messageYouUser: {
    fontWeight: 'bold',
    color: "#948b38cd",
    fontSize: 20
  },

  messageUser: {
    fontWeight: 'bold',
    color: "#4f4f4fcd",
    fontSize: 17
  },
  messageText: {
    marginTop: 5,
  },
  messageTime: {
    marginTop: 8.8,
    fontSize: 12,
    color: '#555',
    textAlign: 'right',
  },

  inputChatWrapper: {
    justifyContent: "space-between",
    maxWidth: "100%",
    flexDirection: 'row',
    alignItems: "center",
    textAlign: "center",
    marginTop: 5,
    marginHorizontal: 2
  },

  inputWrapper: {
    width: "91%",
    borderWidth: 2,       // Толщина рамки
    borderColor: '#545454db',   // Цвет рамки
    borderStyle: 'solid', // Тип рамки
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },


  inputChat: {
    fontSize: 20,
    maxWidth: "100vw"
  },

  sendButton: {
    width: "100%"
  }

})