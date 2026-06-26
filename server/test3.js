const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const history = [ { role: 'user', parts: [{ text: undefined }] } ];
    const chat = model.startChat({ history });
    const stream = await chat.sendMessageStream("hi");
    console.log("Stream obtained", !!stream.stream);
    for await (const chunk of stream.stream) {
      console.log(chunk.text());
    }
  } catch (err) {
    console.log("ERROR MESSAGE:", err.message);
  }
}
test();
