import { APIEvent } from "solid-start";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import {
  BufferWindowMemory,
  ChatMessageHistory,
} from "langchain/memory";
import {
  BaseChatMessage,
} from "langchain/schema";
import { Context, Conversation } from "~/types";
import {
  generate_base_chat_history,
} from "./vectordb";

const stream_ai_response = (
  context: string,
  chatHistory: BaseChatMessage[]
) => {
  const chat = new ChatOpenAI({ temperature: 0, streaming: true, modelName: "gpt-4" });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You are a helpful scholar who will answer questions about Paramahansa Yogananda and his books. \
Provide a detailed, thourough and verbose answer ONLY based on the text from books given in triple square brackets. \
Do not provide the book text source in your answer. \
Students can refer to Paramahansa Yogananda as Guruji, Master, Mukunda or Gurudeva. \
Please answer the student according to the name they used. \
If the question is not scholarly, is relating to council or you do not know the answer, \
respond with 'Sorry, I can only answer scholarly questions, \
please reach out to Mother Center for further council (www.yogananda.org).'\n\n\
Text from books: [[[{context}]]]\n\n\n\nConversation History:\n{history}\nscholar:"
    ),
  ]);

  const chain = new LLMChain({
    memory: new BufferWindowMemory({
      chatHistory: new ChatMessageHistory(chatHistory),
      returnMessages: false,
      memoryKey: "history",
      humanPrefix: "student",
      aiPrefix: "scholar",
      k: 3,
    }),
    prompt: chatPrompt,
    llm: chat,
    // verbose: true
  });

  const stream = new TransformStream();
  const encoder = new TextEncoder();
  const writer = stream.writable.getWriter();

  chain.call({ context }, [
    {
      async handleLLMNewToken(token) {
        await writer.ready;
        await writer.write(encoder.encode(`${token}`));
      },
      async handleLLMEnd() {
        await writer.ready;
        await writer.close();
      },
    },
  ]);

  return stream.readable;
};

export async function POST({ request }: APIEvent) {
  const data = await request.json();

  const context: Context[] = data["context"];
  const conversation_history: Conversation[] = data["conversation"];
  console.log(
    "Base Query",
    conversation_history[conversation_history.length - 1].content
  );

  const chatHistory = generate_base_chat_history(conversation_history);
  const stream = stream_ai_response(JSON.stringify(context), chatHistory);

  return new Response(stream);
}
