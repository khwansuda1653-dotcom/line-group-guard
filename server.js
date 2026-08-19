const app = require('express')();
const axios = require('axios');

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    // 1. กรณีบอทถูกเชิญเข้ากลุ่ม
    if (event.type === 'join') {
      const replyToken = event.replyToken;
      if (replyToken) {
        await sendReply(replyToken, 'สวัสดีจ้า! บอทการ์ดพร้อมดูแลความเรียบร้อยในกลุ่มแล้วนะตะ 🛡️');
      }
    }

    // 2. กรณีมีคนส่งข้อความหรือรูปภาพเข้ามาในแชท
    if (event.type === 'message') {
      const replyToken = event.replyToken;
      const messageType = event.message.type;
      const userId = event.source.userId;

      if (messageType === 'image') {
        await sendReplyWithMention(
          replyToken,
          '⚠️ กรุณา @User งดส่งรูปภาพที่ไม่เหมาะสมหรือข้อมูลส่วนตัวเข้ามาในกลุ่มนะคะ!',
          userId
        );
      } else if (messageType === 'text') {
        const text = event.message.text.toLowerCase();

        // รายการคำหยาบที่ต้องการตรวจจับ
        const badWords = ['คำหยาบ1', 'คำหยาบ2', 'มึง', 'กู', 'ควย'];
        const hasBadWord = badWords.some(word => text.includes(word));

        if (hasBadWord) {
          await sendReply(replyToken, '⚠️ กรุณารักษามารยาทและงดใช้คำหยาบในกลุ่มด้วยนะคะ!');
        }
      }
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
        'Authorization': 'Bearer YOUR_CHANNEL_ACCESS_TOKEN'
      }
    });
  } catch (error) {
    console.error('Error sending reply:', error.response?.data || error.message);
  }
}

// ฟังก์ชันส่งข้อความพร้อมแท็กชื่อ (Mention) สมาชิก
async function sendReplyWithMention(replyToken, text, userId) {
  try {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: text,
          mention: {
            mentionees: [
              {
                index: text.indexOf('@User'),
                length: 5,
                userId: userId
              }
            ]
          }
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_CHANNEL_ACCESS_TOKEN'
      }
    });
  } catch (error) {
    console.error('Error sending mention reply:', error.response?.data || error.message);
  }
}

module.exports = app;
