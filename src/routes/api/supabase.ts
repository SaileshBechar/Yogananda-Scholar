import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Context } from "~/types";

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL as string;
  const supabaseKey = process.env.SUPABASE_PRIVATE_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
};

export async function retrieve_texts(
  supabase: SupabaseClient<any, "public", any>,
  query: string
) {
  const embeddings = new OpenAIEmbeddings();
  const queryEmbedding = await embeddings.embedQuery(query);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 15,
  });
  if (error) console.log(error);
  return data;
}

export async function concatonate_adjacent_paragraphs(
  supabase: SupabaseClient<any, "public", any>,
  context: Context[],
  num_paragraphs: number = 3
) {
  const TOTAL_AVAILABLE_CHARS = 3500 * 4
  const AVAILABLE_CHARS_PER_PARAGRAPH = TOTAL_AVAILABLE_CHARS / context.length
  const num_to_concat = Math.max(
    num_paragraphs,
    Math.round(context.length / 3)
  );
  const concatContext = await Promise.all(
    context
      .filter((obj, index) => index >= num_to_concat || obj.paragraph_text.length <= 240)
      .map(async (obj) => {
        let above_paragraph_text = "";
        let below_paragraph_text = "";
        let adj_i = 1
        let paragraph_length = obj.paragraph_text.length
        while (paragraph_length <= AVAILABLE_CHARS_PER_PARAGRAPH && adj_i < 20) {
          const above_paragraph = await fetch_paragraph(
            supabase,
            (Number(obj.paragraph_id) + adj_i).toString()
          );
          if (above_paragraph.data) {
            above_paragraph_text =
              above_paragraph_text + " " + above_paragraph.data[0].paragraph_text;
            paragraph_length += above_paragraph_text.length
          }
          const below_paragraph = await fetch_paragraph(
            supabase,
            (Number(obj.paragraph_id) - adj_i).toString()
          );
          if (below_paragraph.data) {
            below_paragraph_text =
              below_paragraph.data[0].paragraph_text + " " + below_paragraph_text;
              paragraph_length += below_paragraph_text.length
          }
          adj_i++
        }
        return {
          ...obj,
          paragraph_text:
            above_paragraph_text +
            " " +
            obj.paragraph_text +
            " " +
            below_paragraph_text,
        };
      })
  );

  return concatContext;
}

export const insert_book = async (
  supabase: SupabaseClient<any, "public", any>,
  book_name: string
) => {
  const { data, error } = await supabase
    .from("books")
    .insert({
      book_name,
      language: "English",
      author: "Paramahansa Yogananda",
    })
    .select();
  if (data) {
    return data[0].book_id;
  }
  return error;
};

export const insert_chapter = async (
  supabase: SupabaseClient<any, "public", any>,
  chapter_name: string,
  book_id: string
) => {
  const { data, error } = await supabase
    .from("chapters")
    .insert({
      chapter_name,
      book_id,
    })
    .select();
  if (data) {
    return data[0].chapter_id;
  }
  return error;
};

export const fetch_paragraph = async (
  supabase: SupabaseClient<any, "public", any>,
  paragraph_id: string
) => {
  return await supabase
    .from("paragraphs")
    .select("paragraph_text, chapter_id, chapters(chapter_id)") // join on chapters table
    .eq("paragraph_id", paragraph_id)
    .eq("chapters.chapter_name", "paragraphs.chapter_name")
    .limit(1);
};

export const insert_paragraph = async (
  supabase: SupabaseClient<any, "public", any>,
  chapter_id: string,
  paragraph_text: string
) => {
  const { data, error } = await supabase
    .from("paragraphs")
    .insert({
      chapter_id,
      paragraph_text,
    })
    .select();
  if (data) {
    return data[0].paragraph_id;
  }
  return error;
};

export const insert_line = async (
  supabase: SupabaseClient<any, "public", any>,
  paragraph_id: string,
  embedding: number[]
) => {
  const { data, error } = await supabase
    .from("lines")
    .insert({
      paragraph_id,
      embedding,
    })
    .select();
  if (data) {
    return data[0].line_id;
  }
  return error;
};
