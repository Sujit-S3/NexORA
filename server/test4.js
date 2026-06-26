const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat();
    const stream = await chat.sendMessageStream("hi");
    console.log("Stream obtained", !!stream.stream);
    console.log("typeof stream[Symbol.asyncIterator]", typeof stream[Symbol.asyncIterator]);
  } catch (err) {
    console.log("ERROR MESSAGE:", err.message);
  }
}
test();
