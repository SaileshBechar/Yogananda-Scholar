import { APIEvent, json } from "solid-start/api";
import { store_epub } from "./vectordb";

export async function GET() {
    store_epub()
    
    return new Response("Success");
}




