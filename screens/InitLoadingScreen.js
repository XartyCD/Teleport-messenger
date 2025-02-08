import { Platform, StyleSheet, TextInput, Text, View, Pressable, Image, Animated } from 'react-native';
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useAppContext } from '../context/context.js';

export default function InitLoadingScreen() {
  const [loadingText, setLoadingText] = useState("Загрузка приложения")
  const [loadingTextDots, setLoadingTextDots] = useState('.'); // состояние для точек

  const backgroundImagesArray = [require("../assets/images/appLoading_var1.png"), require("../assets/images/appLoading_var2.png")]

  const [backgroundImageLoad, setBackgroundImageLoad] = useState(null);

  const phrasesArray = ["Рассаживаем ботов в чат",
    "Ищем всех ваших контактов на просторах интернета", "Обновляем вашу коллекцию мемов",
    "Баним кого попало", "Проверяем, кто вам написал",
    "Подключаем ваши любимые эмодзи", "Шифруем данные, чтобы ваши секреты остались секретами",
    "Симулируем важную загрузку", "Делаем вид что что-то грузим",
    "Ищем потерянные сообщения в параллельной вселенной", "Распаковываем данные, как чемодан после отпуска",
    "Проверяем, кто из друзей снова в сети", "Учим чат-ботов ругаться нецензурной бранью",
    "Ловим баги на удочку и отпускаем обратно", "Синхронизируем все чаты в реальном времени",
    "Запускаем марафон по программированию на loCI++", "Убеждаем ваши чаты не зависать",
    "Соединяем вас с миром", "Ищем смысл в ваших сообщениях",
    "Воруем ваши личные данные", "Отправляем ваши фотки в ФСБ",
    "Мыслим о великом", "Забиваем на важное и добавляем ненужное",
    "Проверяем как там наши конкуренты", "Удаляем вам интернет"]


  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Выбираем рандомный задний фон и записываем в стейт путь
    setBackgroundImageLoad(backgroundImagesArray[Math.floor(Math.random() * backgroundImagesArray.length)])


    // Интервал для изменения фразы
    setLoadingText(phrasesArray[Math.floor(Math.random() * phrasesArray.length)])
    const textInterval = setInterval(() => {
      fadeOut(() => {
        changeLoadText();
        fadeIn();
      });
    }, 2500);

    // Интервал для обновления точек
    const dotsInterval = setInterval(updateDots, 900);

    return () => {
      clearInterval(textInterval); // очищаем таймер при размонтировании
      clearInterval(dotsInterval); // очищаем таймер при размонтировании
    };
  }, []);


  const changeLoadText = () => {
    const phrase = phrasesArray[Math.floor(Math.random() * phrasesArray.length)]
    setLoadingText(phrase)
  }
  const updateDots = () => {
    // Увеличиваем кол-во точек, но ограничиваем до 3
    setLoadingTextDots(prevDots => (prevDots.length < 3 ? prevDots + '.' : '.'));
  };

  // Анимка убывания
  const fadeOut = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(callback);
  };

  // Аника появления
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };


  return (
    <View style={styles.container}>
      <Image
        source={backgroundImageLoad}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.textsContainer}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.outlineText}>{loadingText}{loadingTextDots}</Text>
          <Text style={styles.text}>{loadingText}{loadingTextDots}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },

  textsContainer: {
    zIndex: 1,
    maxHeight: 400,
    width: 360,
    justifyContent: "center",
    alignItems: 'center', // Выравнивание по центру
    backgroundColor: "#4f4f4f7a",
    marginTop: 400,

    paddingVertical: 6,
    paddingHorizontal: 10,
    borderColor: "white", // Цвет рамки
    borderStyle: "solid", // Тип рамки
    borderWidth: 1.1,
    borderRadius: 8,
  },
  text: {
    textAlign: "center",
    color: '#ffd230e4',
    fontSize: 28,
    fontWeight: 'bold',
  },
  outlineText: {
    textAlign: "center",
    color: 'black', // Цвет обводки
    fontSize: 28,
    fontWeight: 'bold',
    position: 'absolute', // Позволяет наложить текст
    textShadowColor: 'black', // Цвет тени
    textShadowOffset: { width: 1, height: 0 }, // Смещение тени
    textShadowRadius: 1, // Радиус размытия тени
  },
});
