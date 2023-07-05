import { EPubLoader } from "langchain/document_loaders/fs/epub";
import { createSupabaseClient } from "./supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Context } from "~/types";
import { LLMChain } from "langchain";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
const embeddings = new OpenAIEmbeddings();

const insert_book = async (supabase : SupabaseClient<any, "public", any>, bookName : string) => {
  const { data, error } = await supabase
    .from("books")
    .insert({
      name: bookName,
      language: "English",
      author: "Paramahansa Yogananda",
    })
    .select();
    if (data) {
      return data[0].book_id
    }
    return error
}

export async function store_epub() {
  const supabase = createSupabaseClient();
  
  const loader = new EPubLoader("src/books/Autobiography-of-a-Yogi-2019.epub");
  const bookName = "Autobiography of a Yogi";
  const docs = await loader.load();
  

  console.log("Storing", bookName)
  const book_id = await insert_book(supabase, bookName)
  for (let doc of docs) {
    const text_splits = doc.pageContent.split("\n\n");
    const chapter = text_splits.splice(0, 1)
    console.log("Embedding", doc.metadata["chapter"], chapter)
    for (let split of text_splits) {
      const trimmedText = split.trim().replace(/^\n+|\n+$/g, "");
      if (trimmedText) {
        const embedding = await embeddings.embedQuery(trimmedText);
        const { error } = await supabase.from("quotes").insert({
          book_id,
          content: trimmedText,
          chapter: chapter[0],
          embedding
        });
      }
    }
  }

  console.log("Storing complete!")
  return
}

const remove_numbers_from_context = (data : [{}]) => {
  return data.map((obj : any) => {
    // const month_pattern = /(?<=\D)(?<!January |February |March |April |May |June |July |August |September |October |November |December )\d{1,2}\b/
    // const start_string_pattern = /(?<=^)\d{1,2}\s\b/g
    const pattern = /(?<=\D)(?<!January |February |March |April |May |June |July |August |September |October |November |December )\d{1,2}\b|(?<=^)\d{1,2}\s/g
    return {
      ...obj,
      content: obj['content'].replace(pattern, "")
    };
  });
}
export async function retrieve_texts(query : string) {
  const queryEmbedding = await embeddings.embedQuery(query);

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('match_documents', {query_embedding : queryEmbedding, match_count : 10})
  const sanitizedContext = remove_numbers_from_context(data)

  return sanitizedContext
}

export const trimContext = (context : Context[]) => {
  let total_chars = 0
  const MAX_CHARS = 3500 * 4
  const trimmed_context = context.map((obj : Context) => {
    total_chars += obj['content'].length
    if (total_chars < MAX_CHARS) {
      return {
        ...obj,
        content: obj['content']
      };
    } else {
      return
    }
  })
  console.log("Total chars", total_chars)
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