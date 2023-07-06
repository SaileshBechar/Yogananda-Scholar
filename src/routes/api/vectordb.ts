import { EPubLoader } from "langchain/document_loaders/fs/epub";
import { createSupabaseClient } from "./supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Context } from "~/types";
import { LLMChain } from "langchain";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
const embeddings = new OpenAIEmbeddings();

const insert_book = async (supabase : SupabaseClient<any, "public", any>, book_name : string) => {
  const { data, error } = await supabase
    .from("books")
    .insert({
      book_name,
      language: "English",
      author: "Paramahansa Yogananda",
    })
    .select();
    if (data) {
      return data[0].book_id
    }
    return error
}

const insert_chapter = async (supabase : SupabaseClient<any, "public", any>, chapter_name : string, book_id : string) => {
  const { data, error } = await supabase
    .from("chapters")
    .insert({
      chapter_name,
      book_id
    })
    .select();
    if (data) {
      return data[0].chapter_id
    }
    return error
}

const insert_paragraph = async (supabase : SupabaseClient<any, "public", any>, chapter_id : string, paragraph_text : string) => {
  const { data, error } = await supabase
    .from("paragraphs")
    .insert({
      chapter_id,
      paragraph_text
    })
    .select();
    if (data) {
      return data[0].paragraph_id
    }
    return error
}

const insert_line = async (supabase : SupabaseClient<any, "public", any>, paragraph_id : string, embedding : number[]) => {
  const { data, error } = await supabase
    .from("lines")
    .insert({
      paragraph_id,
      embedding
    })
    .select();
    if (data) {
      return data[0].line_id
    }
    return error
}

export async function store_epub() {
  const supabase = createSupabaseClient();
  
  const loader = new EPubLoader("src/books/Autobiography-of-a-Yogi-2019.epub");
  const bookName = "Autobiography of a Yogi";
  const docs = await loader.load();
  
  console.log("Storing", bookName)
  const bookId = await insert_book(supabase, bookName)
  
  let paragraphCount = 0
  let lineCount = 0
  for (let doc of docs) {
    const paragraphSplits = doc.pageContent.split("\n\n");
    const chapter = paragraphSplits.splice(0, 2).join(" ").replace(/\[[^\]]+\]/g, "")
    const chapterId = await insert_chapter(supabase, chapter, bookId)
    console.log("Embedding", doc.metadata["chapter"], chapter)
    for (let paragraph of paragraphSplits) {
      const pattern = /(?<=\D)(?<!January |February |March |April |May |June |July |August |September |October |November |December )\d{1,2}\b|(?<=^)\d{1,2}\s|^\n+|\n+$|\[[^\]]+\]/g
      const trimmedParagraph = paragraph.trim().replace(pattern, "");
      const paragraphId = await insert_paragraph(supabase, chapterId, trimmedParagraph)
      const lineSplits = trimmedParagraph.split(/[.!?\n]/);
      paragraphCount++
      if (trimmedParagraph) {
        const filteredlineSplits = lineSplits.filter(sentence => sentence.trim() !== "");
        for (let line in filteredlineSplits) {
          lineCount++  
          const embedding = await embeddings.embedQuery(line);
          insert_line(supabase, paragraphId, embedding)
        }
      }
    }
  }
  
  console.log("Storing complete!")
  return {line_count: lineCount, paragraph_count: paragraphCount}
}

export async function retrieve_texts(query : string) {
  const queryEmbedding = await embeddings.embedQuery(query);

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('match_documents', {query_embedding : queryEmbedding, match_count : 5})
  if (error) console.log(error)

  return data
}

export const trimContext = (context : Context[]) => {
  let total_chars = 0
  const MAX_CHARS = 3000 * 4
  const trimmed_context = context.map((obj : Context) => {
    total_chars += obj['paragraph_text'].length
    if (total_chars < MAX_CHARS) {
      return {
        ...obj,
        content: obj['paragraph_text']
      };
    } else {
      return
    }
  })
  console.log("Total chars", total_chars, " tokens:, ", total_chars / 4)
  return trimmed_context
}

export const generate_retrieval_query = async (query: string) => {
  const chat = new ChatOpenAI({ temperature: 0 });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You are able to exceptionally rewrite queries into keywords\
that may appear in the books and writings of Paramahansa Yogananda. \
Rewrite the following query given in triple square brackets into keywords. \
The query may contain alternate names for Paramahansa Yogananda, such as Guruji, Master, \
Mukunda and Gurudeva. Substitute these names with his original name when necessary.\n\n\
query: [[[{query}]]]\n\n"
),
]);
// Do not try to add additional information that does not appear in the original query. \
  const chain = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
  });

  return chain.run(
    query,
  );
};