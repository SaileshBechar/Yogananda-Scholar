import { APIEvent, json } from "solid-start/api";
import { store_epub } from "../vectordb";

export async function POST({ params }: APIEvent) {
    console.log(`File Type: ${params.file_type}`);

    if (params.file_type === "epub") {
        const docs = await store_epub()
        return json(docs);
    }
    return new Response("ERROR: File type not supported")
}




