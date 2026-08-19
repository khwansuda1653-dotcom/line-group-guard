const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// ตรวจสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
  res.send('Bot is running smoothly!');
});

// จุดรับ Webhook จาก LINE
app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    // 1. กรณีบอทถูกดึงเข้ากลุ่ม
    if (event.type === 'join') {
      const replyToken = event.replyToken;
      if (replyToken) {
        await sendReply(replyToken, 'สวัสดีค่ะ! บอทการ์ดพร้อมดูแลความเรียบร้อยในกลุ่มแล้วนะคะ 🛡️');
      }
    }

    // 2. กรณีมีคนส่งข้อความหรือรูปภาพเข้ามาในแชท
    if (event.type === 'message') {
      const replyToken = event.replyToken;
      const messageType = event.message.type;
      const userId = event.source.userId;
      
      // ดึงชื่อหรือข้อมูลโปรไฟล์ผู้ใช้มาแสดง (ถ้าต้องการ) หรือใช้การ Mention
      if (messageType === 'image') {
        // แจ้งเตือนเมื่อมีการส่งรูปภาพ
        await sendReplyWithMention(
          replyToken, 
          '⚠️ กรุณา @User งดส่งรูปภาพที่ไม่เหมาะสมหรือข้อมูลส่วนตัวเข้ามาในกลุ่มนะคะ!', 
          userId
        );
      } else if (messageType === 'text') {
        const text = event.message.text.toLowerCase();
        
        // รายการคำหยาบที่ต้องการตรวจจับ (สามารถเพิ่มคำอื่น ๆ ได้ตามต้องการ)
        const badWords = ['คำหยาบ1', 'คำหยาบ2', 'มึง', 'กู', 'ควย']; 
        const hasBadWord = badWords.some(word => text.includes(word));
        
        if (hasBadWord) {
          // แจ้งเตือนเมื่อพบคำหยาบ
          await sendReplyWithMention(
            replyToken, 
            '⚠️ กรุณารักษามารยาทและงดใช้คำหยาบนะคะ @User!', 
            userId
          );
        }
     }

});

// ฟังก์ชันส่งข้อความปกติ
async function sendReply(replyToken, text) {
  try {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `iEvv15Bdq74/VqfuRkykWqhrugr9fgxOeIZ+9naCBYVSs3hDz34i0iyiuDxhfV+ls8SPWtmD4Mqso3bwtwW0B5IImKC4H/OYMB4gBP/j/plHJ7lHahfgtiooruIdq2Pi3RLI4n9r2VaFsuSnMOZs6gdB04t89/1O/w1cDnyilFU=`
      }
    });
  } catch (error) {
    console.error('Error sending reply:', error.response?.data || error.message);
  }
}

// ฟังก์ชันส่งข้อความพร้อมแท็กชื่อ (Mention) สมาชิก
async function sendReplyWithMention(replyToken, text, userId) {
  try {
    // ปรับข้อความให้มีคำว่า @User ไว้แทนตำแหน่งที่จะแท็ก
    const formattedText = text.replace('@User', '@member');
    const mentionIndex = formattedText.indexOf('@member');

    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: replyToken,
      messages: [{
        type: 'text',
        text: formattedText,
        mention: {
          mentionees: [{
            index: mentionIndex,
            length: 7, // ความยาวของคำว่า "@member" คือ 7 ตัวอักษร
            userId: userId
          }]
        }
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `iEvv15Bdq74/VqfuRkykWqhrugr9fgxOeIZ+9naCBYVSs3hDz34i0iyiuDxhfV+ls8SPWtmD4Mqso3bwtwW0B5IImKC4H/OYMB4gBP/j/plHJ7lHahfgtiooruIdq2Pi3RLI4n9r2VaFsuSnMOZs6gdB04t89/1O/w1cDnyilFU=`
      }
    });
  } catch (error) {
    console.error('Error sending mention reply:', error.response?.data || error.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
