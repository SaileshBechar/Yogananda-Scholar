import { EPubLoader } from "langchain/document_loaders/fs/epub";
import {
  createSupabaseClient,
  insert_book,
  insert_chapter,
  insert_line,
  insert_paragraph,
} from "./supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Context, Conversation } from "~/types";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { AIChatMessage, BaseChatMessage, HumanChatMessage } from "langchain/schema";

export async function store_epub() {
  const supabase = createSupabaseClient();
  const embeddings = new OpenAIEmbeddings();

  const loader = new EPubLoader("src/books/Autobiography-of-a-Yogi-2019.epub");
  const bookName = "Autobiography of a Yogi";
  const docs = await loader.load();

  console.log("Storing", bookName);
  // const bookId = await insert_book(supabase, bookName)

  let paragraphCount = 0;
  let lineCount = 0;
  for (let doc of docs) {
    const paragraphSplits = doc.pageContent.split("\n\n");
    const chapter = paragraphSplits.splice(0, 2);
    let chapterString = "";
    if (chapter[0].toLowerCase().includes("chapter")) {
      chapterString = chapter
        .join(":")
        .replace(/\[[^\]]+\]|\n/g, " ")
        .trim(); // join chapter number and title and remove image tags
    } else if (!chapter[0].toLowerCase().includes("image")) {
      chapterString = chapter[0].replace(/\[[^\]]+\]|\n/g, " ").trim(); // remove image tags
    }
    // const chapterId = await insert_chapter(supabase, chapterString, bookId)
    if (chapterString) {
      for (let paragraph of paragraphSplits) {
        const pattern =
          /(?<=\D)(?<!January |February |March |April |May |June |July |August |September |October |November |December )\d{1,2}\b(?!,|\s\d)|(?<=^)\d{1,2}\s|^\n+|\n+$|\[[^\]]+\]/g;
        const trimmedParagraph = paragraph.trim().replace(pattern, "");
        if (trimmedParagraph) {
          // const paragraphId = await insert_paragraph(supabase, chapterId, trimmedParagraph)
          paragraphCount++;
          const lineSplits = trimmedParagraph.split(/[.!?\n]/);
          const filteredlineSplits = lineSplits.filter(
            (sentence) => sentence.trim().length > 5 // Remove lines less than 5 characters long
          ); 
          for (let line of filteredlineSplits) {
            if (line.includes("now or never")) {
              console.log(`Book name: ${bookName}, Chapter: ${chapterString}, Text: ${line.trim()}`)
            }
            lineCount++;
            // const embedding = await embeddings.embedQuery(`Book name: ${bookName}, Chapter: ${chapterString}, Text: ${line.trim()}`);
            // insert_line(supabase, paragraphId, embedding)
          }
        }
      }
    }
  }

  console.log("Storing complete!");
  return { line_count: lineCount, paragraph_count: paragraphCount };
}

export const trimContext = (context: Context[]) => {
  let total_chars = 0;
  const MAX_CHARS = 3000 * 4; // 4 chars per token
  const trimmed_context = context.filter((obj: Context) => {
    total_chars += obj["paragraph_text"].length;
    return (total_chars < MAX_CHARS)
  });
  console.log("Total chars", total_chars, " tokens:, ", total_chars / 4);
  return trimmed_context;
};

export const generate_base_chat_history = (conversation_history : Conversation[]) : BaseChatMessage[] => {
  return conversation_history.map((conversation : Conversation) => {
    if (conversation.role === "human") {
      return new HumanChatMessage(conversation.content)
    } else{
      return new AIChatMessage(conversation.content)
    }
  })
}

export const generate_retrieval_query = async (
  conversation_history: Conversation[]
) => {
  const chat = new ChatOpenAI({ temperature: 0 });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Reword the last question in the conversation history \
to a contextualized vector database query that emphasizes all keywords. \
The question may contain alternate names for Paramahansa Yogananda, such as Guruji, Master, \
Mukunda, Yoganandaji and Gurudeva. Substitute these names with Paramahansa Yogananda and Mukunda when necessary. \
The query can use the previous conversation history to resolve ambiguities. \
Respond with only the contextual query keywords seperated by spaces. \
Do not try to add extra information, not otherwise provided in the conversation. \
For example: keyword1 keyword2 keyword3 etc.\n\n\
Conversation history:\n{conversation_history}{x}"
),
]);
const chatHistory = generate_base_chat_history([conversation_history[conversation_history.length -1]])
const memory = new BufferMemory({
  chatHistory: new ChatMessageHistory(chatHistory),
  memoryKey: "conversation_history",
  returnMessages: false
});
  const chain = new LLMChain({
    memory:memory,
    prompt: chatPrompt,
    llm: chat,
    // verbose: true
  });

  return chain.run("")
};
