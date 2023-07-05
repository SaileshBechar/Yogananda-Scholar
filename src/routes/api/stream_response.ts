import { APIEvent, json } from "solid-start";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  AIMessagePromptTemplate,
} from "langchain/prompts";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { HumanChatMessage, AIChatMessage } from "langchain/schema";
import { Context, Conversation } from "~/types";
import { generate_retrieval_query, retrieve_texts, trimContext } from "./vectordb";


const stream_ai_response = (context: string, conversation_history: Conversation[]) => {
  const chat = new ChatOpenAI({ temperature: 0, streaming: true });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You are a scholar that will answer questions about Paramahansa Yogananda. \
You will provide an answer ONLY based on the text from books given in triple square brackets. \
Do not provide the book text source in the answer. \
Students can refer to Paramahansa Yogananda as Guruji, Master, Mukunda or Gurudeva. \
Please answer the student using the name for him they used. \
You can answer all scholarly questions, but if the student asks for advice, \
respond with 'Sorry, I can only answer scholarly questions, \
please reach out to Mother Center for further council (www.yogananda.org).'\n\n\
text from books: [[[{context}]]]\n\n\n\nConversation History:\n{history}\nscholar:"
    )
  ]);

  const chatHistory = conversation_history.map((conversation) => {
    if (conversation.role === "human") {
      return new HumanChatMessage(conversation.content)
    } else{
      return new AIChatMessage(conversation.content)
    }
  })

  const chain = new LLMChain({
    memory: new BufferMemory({chatHistory: new ChatMessageHistory(chatHistory), returnMessages: false, memoryKey: "history", humanPrefix: "student", aiPrefix: "scholar" }),
    prompt: chatPrompt,
    llm: chat,
    verbose: true
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
        await writer.write(encoder.encode(`Sources:${context}`));
        await writer.close();
      },
    },
  ]);

  return stream.readable;
};

export async function POST({ request }: APIEvent) {
  const data = await request.json();

  const conversation_history = data["conversation"];
  const question = conversation_history.slice(-1)[0].content
  console.log("Base Query",  conversation_history[conversation_history.length -1]);
  const retrieval_query = await generate_retrieval_query(question)
  console.log("Retrieval Query", retrieval_query);
  const context = await retrieve_texts(retrieval_query);
  
  const trimmed_context = trimContext(context);

  const stream = stream_ai_response(JSON.stringify(trimmed_context), conversation_history);

  return new Response(await stream);
}
