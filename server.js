const express = require('express');
const app = express();

app.use(express.json());

// เช็คว่าเซิร์ฟเวอร์ออนไลน์ไหม
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// จุดรับ Webhook จาก LINE
app.post('/webhook', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

