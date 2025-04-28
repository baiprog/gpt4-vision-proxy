const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 📸 Анализ изображения
app.post('/analyze', async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Что изображено на фото? Назови блюдо, калории и БЖУ, если это еда.'
              },
              {
                type: 'image_url',
                image_url: { url: image }
              }
            ]
          }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ Ошибка запроса к OpenAI:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🧠 Генерация плана питания
app.post('/plan', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // ДИНАМИЧЕСКИ добавим инструкцию для ChatGPT
  const planPrompt = `
${prompt}

ВАЖНО! Ответь строго валидным JSON-массивом без лишнего текста, комментариев, пояснений, до и после массива. Пример:
[
  { "time": "Завтрак", "name": "Овсянка с ягодами", "calories": 350, "protein": 15, "fats": 6, "carbs": 60 },
  { "time": "Обед", "name": "Куриная грудка с рисом и овощами", "calories": 450, "protein": 40, "fats": 10, "carbs": 50 }
]
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: planPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ Ошибка генерации плана питания:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// 💬 Обычный текстовый чат с ИИ (ChatGPT)
app.post('/chat', async (req, res) => {
  const { messages, model = 'gpt-3.5-turbo', max_tokens = 1000, temperature = 0.7 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'No messages array provided' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        max_tokens,
        temperature
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('❌ Ошибка запроса к OpenAI (чат):', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
