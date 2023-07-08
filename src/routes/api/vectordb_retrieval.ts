import { APIEvent, json } from "solid-start";
import { Conversation } from "~/types";
import { generate_retrieval_query, trimContext } from "./vectordb";
import { concatonate_adjacent_paragraphs, createSupabaseClient, retrieve_texts } from "./supabase";


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
  
    return json({"context":trimmed_context});
  }