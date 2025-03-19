const express = require("express")
const mysql = require("mysql")

const http = require("http")
const socketIo = require("socket.io")

const app = express()
const port = 9000
const socketPort = 9003

const server = http.createServer(app)

// Настраиваем Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // Обеспечиваем доступ с любых источников, важно для работы с клиентом
  },
})

const pool = mysql.createPool({
  connectionLimit: 100, // Устанавливаем лимит соединений ;
  host: "localhost",
  user: "root",
  password: "",
  database: "TeleportBase",
})

// app.use(express.static(path.join(__dirname, 'public')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.use(express.json())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*") // Разрешить любые источники
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS") // Разрешить методы
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  )
  next()
})

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.stack)
    return
  }
  console.log("Подключено к базе данных как id " + connection.threadId)

  // Освобождаем соединение после успешного подключения
  connection.release()
})


const activeUsers = new Map(); // user -> socketId

io.on("connection", (socket) => {
  console.log("Новый пользователь подключился");

  // Регистрация пользователя
  socket.on("addUserSocket", (user_id) => {
    activeUsers.set(user_id, socket.id);
    console.log(`Пользователь ${user_id} зарегистрирован: ${socket.id}`);
    console.log(activeUsers)
  });

  socket.on("getAllUsers", (userId) => {
    const query = "SELECT id, user FROM users WHERE id != ?"; // Исключаем пользователя, который делает запрос

    pool.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Ошибка получения пользователей:", err);
        return;
      }
      console.log("Запрос..")
      socket.emit("allUsers", results); // Отправляем список пользователей клиенту
    });
  });

  socket.on("sendMessage", (message) => {
    const { chatId, sender_id, sendingMessage } = message;

    // Сначала получаем receiver_id
    const getReceiverQuery = `
      SELECT CASE 
        WHEN sender_id = ? THEN receiver_id 
        ELSE sender_id 
      END AS receiver_id
      FROM messagesList 
      WHERE chat_id = ? 
      LIMIT 1;
    `;

    pool.query(getReceiverQuery, [sender_id, chatId], (err, result) => {
      if (err) {
        console.error("Ошибка при получении receiver_id:", err);
        return;
      }

      if (result.length === 0) {
        console.error("Ошибка: Не найден receiver_id для чата", chatId);
        return;
      }

      const receiver_id = result[0].receiver_id;
      console.log("Определён receiver_id:", receiver_id);

      // Теперь вставляем сообщение
      const insertMessageQuery = `
      INSERT INTO messagesList (chat_id, message_chat_id, sender_id, receiver_id, content, date, status)
        SELECT ?, COALESCE(MAX(message_chat_id), 0) + 1, ?, ?, ?, NOW(), 'sent'
      FROM messagesList WHERE chat_id = ?;
  `;

      pool.query(insertMessageQuery, [chatId, sender_id, receiver_id, sendingMessage, chatId], (err) => {
        if (err) {
          console.error("Ошибка при сохранении сообщения:", err);
          return;
        }

        console.log("Сообщение успешно отправлено!");

        // Отправляем сообщение получателю через WebSocket
        const receiverSocketId = activeUsers.get(receiver_id);
        if (!receiverSocketId) {
          console.log("Получатель не в сети.");
          return;
        }

        io.to(receiverSocketId).emit("getNewMessage", {
          chat_id: chatId,
          sender_id,
          receiver_id,
          content: sendingMessage,
          date: new Date().toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          status: "sent",
        });
      });
    });
  })






  // Слушаем событие "getMessages" от клиента
  socket.on("getMessages", (user_id) => {
    console.log(`Запрос на все сообщения для пользователя с id: ${user_id}`);

    // SQL-запрос для получения всех сообщений, принадлежащих пользователю
    const messagesQuery = `
        SELECT 
            m.chat_id, 
            m.message_chat_id, 
            m.content, 
            DATE_FORMAT(m.date, '%d.%m.%Y, %H:%i:%s') AS date, 
            m.sender_id, 
            m.receiver_id, 
            m.status,
            u1.user AS sender_name, 
            u2.user AS receiver_name
        FROM messagesList m
        LEFT JOIN users u1 ON m.sender_id = u1.id
        LEFT JOIN users u2 ON m.receiver_id = u2.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.chat_id, m.message_chat_id;
    `;

    pool.query(messagesQuery, [user_id, user_id], (err, results) => {
      if (err) {
        console.error("Ошибка при запросе сообщений:", err);
        socket.emit("error", "Ошибка получения сообщений");
        return;
      }

      if (results.length > 0) {
        // Группируем сообщения по chat_id
        const groupedMessages = results.reduce((acc, row) => {
          const { chat_id, message_chat_id, content, date, sender_id, receiver_id, sender_name, receiver_name, status } = row;

          // Определяем имя собеседника
          const companionName = user_id === sender_id ? receiver_name : sender_name;

          // Если чат ещё не добавлен в список, создаём его
          if (!acc[chat_id]) {
            acc[chat_id] = {
              chat_id,
              receiver_name: companionName,
              messages: [],
            };
          }

          // Добавляем сообщение в массив сообщений чата
          acc[chat_id].messages.push({
            message_chat_id,
            content,
            date,
            sender_id,
            receiver_id,
            status,
          });

          return acc;
        }, {});

        // Преобразуем объект в массив
        const formattedMessages = Object.values(groupedMessages);

        console.log("Отформатированные сообщения:", JSON.stringify(formattedMessages, null, 2));

        // Отправляем сообщения клиенту
        socket.emit("allMessages", formattedMessages);
      } else {
        console.log("Нет сообщений для этого пользователя");
        socket.emit("allMessages", []);
      }
    });
  });

  // Закрытие соединения
  socket.on("disconnect", () => {
    console.log("Пользователь отключился");
  });
});







app.get("/api/getrealtime", (req, res) => {
  const currentTime = Date.now()

  // Возвращаем текущее время
  res.status(200).json({ realTime: currentTime })
})

// API РЕГИСТРАЦИИ И АВТОРИЗАЦИИ
app.post("/api/checkusers", (req, res) => {
  const { checkedNewName } = req.body
  const query = "SELECT COUNT(*) AS count FROM users WHERE user =?"
  pool.query(query, [checkedNewName], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ success: false })
      return
    }

    if (results[0].count > 0) {
      res.status(200).json({ success: "already user" }) // Ник уже занят, это его аккаунт?
    } else {
      res.status(200).json({ success: true })
    }
  })
})

app.post("/api/register", (req, res) => {
  const { checkedNewName, secretKey, sessionId } = req.body;

  const getCurrentTimeFormatted = () =>
    new Date().toISOString().replace("T", " ").slice(0, 19);
  const currentTime = getCurrentTimeFormatted();

  const getMaxIdQuery = "SELECT MAX(id) AS maxId FROM users";
  pool.query(getMaxIdQuery, (error, results) => {
    if (error) {
      console.error("Ошибка при получении max(id):", error);
      return res.status(500).json({ success: false, message: "Ошибка при получении ID" });
    }

    const newId = (results[0].maxId || 0) + 1; // Если таблица пуста, id = 1

    const insertQuery = "INSERT INTO users (id, user, password, sessionId, regTime) VALUES (?, ?, ?, ?, ?)";
    pool.query(insertQuery, [newId, checkedNewName, secretKey, sessionId, currentTime], (error) => {
      if (error) {
        console.error("Ошибка при добавлении пользователя:", error);
        return res.status(500).json({ success: false, message: "Ошибка при записи пользователя" });
      }
      res.status(201).json({ success: true, id: newId, message: "Пользователь зарегистрирован" });
    });
  });
});


app.post("/api/confirmsecretkey", (req, res) => {
  const { username, key, sessionId } = req.body
  const query = "SELECT password, sessionId FROM users WHERE BINARY user = ?"

  pool.query(query, [username], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ message: "Произошла ошибка при аутентификации" })
      return
    }

    if (results.length === 1) {

      if (key === results[0].secretKey) {
        if (results[0].sessionId === "0") {
          const updateSessionId =
            "UPDATE users SET sessionId = ? WHERE user = ?"
          pool.query(updateSessionId, [sessionId, username], (error, results, fields) => {
            if (error) {
              console.error("Ошибка при смене статуса sessionId", error)
              res.status(500).json({
                success: false,
                message: "Ошибка при смене статуса sessionId",
              })
              return
            }
          })
          res.status(200).json({ message: "Успешная авторизация", success: true })

        } else if (results[0].sessionId === sessionId) {
          res.status(200).json({ message: "Перегенерировать сессию", success: true })

        } else {
          res.status(200).json({ message: "Аккаунт уже используется", success: true })
        }
      } else {
        res.status(200).json({ message: "Неверный ключ", success: true })
      }
    } else {
      res.status(200).json({ message: "Пользователь не найден" })
    }
  })
})

// FIX
app.post("/api/firstdataload", (req, res) => {
  const { user } = req.body

  // Запрос для получения всех сообщений, сортированных по времени
  const query = "SELECT * FROM userRating WHERE user = ?"

  pool.query(query, [user], (error, results) => {
    if (error) {
      console.error(
        "Ошибка при выполнении загрузки данных из дб:",
        error
      )
      res
        .status(500)
        .json({ success: false, message: "Ошибка при получении первичных данных из дб" })
      return
    }

    // Возвращаем список рейтинга
    res.status(200).json({ success: true, date: results })
  })
})

// API РЕГИСТРАЦИИ И АВТОРИЗАЦИИ

// ВЫЙТИ ИЗ АККАУНТА +
app.post("/api/leave-account", (req, res) => {
  const { user } = req.body
  // Заменить sessionId на 0
  const leaveQuery = `UPDATE users SET sessionId = 0 WHERE user = ?`

  pool.query(leaveQuery, [user], (error, results) => {
    if (error) {
      console.error("Ошибка при замене sessionId при выходе:", error)
      res.status(500).json({ success: false, message: "Ошибка выхода" })
      return
    }

    res.status(200).json({ success: true, message: "Успешный выход" })
  })
})

// API УДАЛЕНИЕ АККАУНТА
app.delete("/api/delete-account", (req, res) => {
  const { user } = req.body

  // Удалить пользователя
  const deleteUserReg = "DELETE FROM users WHERE user = ?"
  pool.query(deleteUserReg, [user], (error, results) => {
    if (error) {
      console.error("Ошибка при удалении userReg:", error)
      res.status(500).json({ success: false, message: "Ошибка при userReg" })
      return
    }
    res.status(200).json({ success: true, message: "Пользователь удален." })
  })
})

// API УДАЛЕНИЕ АККАУНТА



//API ПРОВЕРКИ ЧТО УНИКАЛЬНЫЙ ID ВСЕ ЕЩЕ В БАЗЕ (ДЛЯ АВТОРИЗОВАННЫХ)

app.post("/api/checksessionid", (req, res) => {
  const { username, sessionId } = req.body
  const query = "SELECT sessionId FROM regUsers WHERE user = ?"
  pool.query(query, [username], (error, results, fields) => {
    if (error) {
      console.error("Ошибка при выполнении запроса:", error)
      res.status(500).json({ success: false })
      return
    }

    if (results[0].sessionId != sessionId) {
      res.status(400).json({ message: "Сессия недействительна" })
    } else {
      res.status(200).json({ success: true })
    }
  })
})

//API ПРОВЕРКИ ЧТО УНИКАЛЬНЫЙ ID ВСЕ ЕЩЕ В БАЗЕ (ДЛЯ АВТОРИЗОВАННЫХ)



// Маршрут для получения списка игр
app.get("/api/getlistgames", (req, res) => {
  const query = "SELECT * FROM poolPongGame ORDER BY time ASC;"

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Ошибка при получении игр:", error)
      res
        .status(500)
        .json({ success: false, message: "Ошибка при получении игр" })
      return
    }

    res.status(200).json({ success: true, ponggames: results })
  })
})

app.get("/api/checkappinfo", (req, res) => {
  // Запрос для получения всех сообщений, сортированных по времени
  const query = "SELECT version FROM actualInfoApp"

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Ошибка при полчении инфо о приложении:", error)
      res.status(500).json({
        success: false,
        message: "Ошибка при получении данных о приложении",
      })
      return
    }

    // Возвращаем список сообщений
    res.status(200).json({ success: true, info: results })
  })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер успешно запущен на порту ${port}`)
})

server.listen(socketPort, "0.0.0.0", () => {
  console.log(`Сокеты запущены на порту ${socketPort}`)
})