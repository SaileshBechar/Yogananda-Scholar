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
import { HumanChatMessage, AIChatMessage, BaseChatMessage } from "langchain/schema";
import { Context, Conversation } from "~/types";
import { generate_base_chat_history, generate_retrieval_query, trimContext } from "./vectordb";
import { concatonate_adjacent_paragraphs, createSupabaseClient, retrieve_texts } from "./supabase";


const stream_ai_response = (context: string, chatHistory: BaseChatMessage[]) => {
  const chat = new ChatOpenAI({ temperature: 0, streaming: true });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You are a helpful scholar who will answer questions about Paramahansa Yogananda and his books. \
You will provide an answer ONLY based on the text from books given in triple square brackets. \
Do not provide the book text source in your answer. \
Students can refer to Paramahansa Yogananda as Guruji, Master, Mukunda or Gurudeva. \
Please answer the student using the name for him they used. \
You can answer all scholarly questions, but if the student asks for advice, \
respond with 'Sorry, I can only answer scholarly questions, \
please reach out to Mother Center for further council (www.yogananda.org).'\n\n\
Text from books: [[[{context}]]]\n\n\n\nConversation History:\n{history}\nscholar:"
    )
  ]);

  const chain = new LLMChain({
    memory: new BufferMemory({chatHistory: new ChatMessageHistory(chatHistory), returnMessages: false, memoryKey: "history", humanPrefix: "student", aiPrefix: "scholar" }),
    prompt: chatPrompt,
    llm: chat,
    // verbose: true
  });

  const stream = new TransformStream();
  const encoder = new TextEncoder();
  const writer = stream.writable.getWriter();

  chain.call({ context }, [
    {
      async handleLLMStart() {
        await writer.ready;
        await writer.write(encoder.encode(`${context}`));
      },
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

  const conversation_history : Conversation[] = data["conversation"];
  console.log("Base Query", conversation_history[conversation_history.length - 1].content);
  
  const retrieval_query = await generate_retrieval_query(conversation_history)
  console.log("Retrieval Query", retrieval_query);
  
  const supabaseClient = createSupabaseClient();
  const context = await retrieve_texts(supabaseClient, retrieval_query);
  const concat_context = await concatonate_adjacent_paragraphs(supabaseClient, context)
  const trimmed_context = trimContext(concat_context);
  
  const chatHistory = generate_base_chat_history(conversation_history)
  const stream = stream_ai_response(JSON.stringify(trimmed_context), chatHistory);

  return new Response(await stream);
}
