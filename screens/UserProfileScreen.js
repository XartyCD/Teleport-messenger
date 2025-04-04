import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from "../context/context.js";

const hobbiesList = ["История", "Литература", "Технологии", "Рисование", "Кулинария", "Путешествия",
  "Природа", "Рыбалка", "Животные", "Телешоу", "Кино", "Музыка", "Мода", "Видеоигры",
  "Настольные игры", "Автомобили"];

const UserProfileScreen = ({ navigation }) => {
  const { user, userId, CONNECTURL } = useAppContext();
  const [hobbies, setHobbies] = useState([]); // Начальные увлечения
  const [isEditing, setIsEditing] = useState(false);
  const [selectedHobbies, setSelectedHobbies] = useState(hobbies);

  const [animation] = useState(new Animated.Value(1)); // Для анимации кнопок

  const toggleHobby = (hobby) => {
    if (selectedHobbies.includes(hobby)) {
      // Убираем хобби из списка
      setSelectedHobbies(selectedHobbies.filter((h) => h !== hobby));
    } else if (selectedHobbies.length < 4) {
      // Добавляем хобби в список
      setSelectedHobbies([...selectedHobbies, hobby]);
    }

    // Запускаем анимацию при изменении хобби
    Animated.spring(animation, {
      toValue: 0.8,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(animation, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    });
  };

  const saveHobbies = () => {
    // Сохраняем изменения в увлечениях
    setHobbies(selectedHobbies);
    setIsEditing(false); // Закрываем режим редактирования
    // Добавьте здесь API вызов или другие действия, чтобы сохранить хобби на сервере
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user}</Text>

      {!isEditing &&
        <>
          <Text style={styles.label}>Ваши увлечения:</Text>
          <View style={styles.hobbiesContainer}>
            {hobbies.length === 0 ? (<Text style={styles.hobby}>Вы не указали свои увлечения</Text>) : hobbies.map((hobby, index) => (
              <Text key={index} style={styles.hobby}>{hobby}</Text>
            ))}
          </View>
          <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>Редактировать</Text>
          </Pressable>
        </>}

      {isEditing && (
        <View style={styles.modal}>
          <View style={styles.hobbiesContainer}>
            {selectedHobbies.length === 0 ? (<Text style={styles.label}>Не указано</Text>) : selectedHobbies.map((hobby, index) => (
              <Text key={index} style={styles.hobby}>{hobby}</Text>
            ))}
          </View>
          <Text style={styles.label}>Выберите не более 4 увлечений:</Text>

          {/* Создаем кнопки для каждого хобби с градиентом */}
          <View style={styles.hobbiesList}>
            {hobbiesList.map((hobby, index) => (
              <LinearGradient
                key={index}
                colors={selectedHobbies.includes(hobby) ? ["#182b52d1", "#12364fd1"] : ["#333", "#444"]}
                style={[styles.hobbyButton, selectedHobbies.includes(hobby) && styles.selectedHobby]}
              >
                <Animated.View style={{ transform: [{ scale: animation }] }}>
                  <Pressable
                    onPress={() => toggleHobby(hobby)}
                    style={styles.hobbyButtonInner}
                  >
                    <Text style={styles.buttonText}>{hobby}</Text>
                  </Pressable>
                </Animated.View>
              </LinearGradient>
            ))}
          </View>

          {/* Кнопка сохранения изменений */}
          <LinearGradient
            colors={["#4c269ed1", "#113e99d1"]} // Фиолетово-розовый градиент
            style={styles.saveButton}
          >
            <Pressable onPress={() => saveHobbies()} style={styles.saveButtonPressable}>
              <Text style={styles.buttonText}>Сохранить изменения</Text>
            </Pressable>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212", padding: 20 },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#fff" },
  label: { fontSize: 18, marginBottom: 10, color: "#d6c3db" },
  hobbiesContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 20 },
  hobby: { fontSize: 16, backgroundColor: "#444", padding: 8, margin: 5, borderRadius: 5, color: "#fff" },
  editButton: { backgroundColor: "#1e90ff", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontSize: 16, },
  modal: { marginTop: 20, alignItems: "center" },
  hobbiesList: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  hobbyButton: { padding: 10, margin: 5, borderRadius: 7, width: 120, alignItems: "center", justifyContent: "center", borderColor: "#000", borderWidth: 1 },
  hobbyButtonInner: { alignItems: "center", justifyContent: "center" },
  selectedHobby: { borderColor: "#7f7f7f", borderWidth: 1 },
  saveButton: { padding: 12, borderRadius: 5, marginTop: 20, width: 200, alignItems: "center", justifyContent: "center" },
  saveButtonPressable: { justifyContent: "center", alignItems: "center" },
});

export default UserProfileScreen;
