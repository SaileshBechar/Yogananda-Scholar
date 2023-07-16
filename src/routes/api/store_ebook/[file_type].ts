import { APIEvent, json } from "solid-start/api";
import { store_epub } from "../vectordb";

export async function POST({ params, request }: APIEvent) {
    const data = await request.json();
    const isDebug = data['isDebug']
    console.log(`File Type: ${params.file_type}`, isDebug);
    if (params.file_type === "epub") {
        const docs = await store_epub(isDebug)
        return json(docs);
    }
    return new Response("ERROR: File type not supported")
}




