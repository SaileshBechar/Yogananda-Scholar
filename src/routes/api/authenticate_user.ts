import { APIEvent } from "solid-start";

export async function POST({ request }: APIEvent) {
    const data = await request.json();
    const password = data['password']
    console.log(`password: ${password}`);
    if (password === "omgurujaiguru") {
        return new Response("Authenticated Successfully",{status : 200, statusText : "Success"})
    }
    return new Response("Password not recongized",{status : 403, statusText : "Error"})
}