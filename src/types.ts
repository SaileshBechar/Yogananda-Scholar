export type Context = {
  paragraph_id: string;
  paragraph_text: string;
  chapter_name: string;
  similarity: string;
  book_name: string;
  author: string;
};

export type AiMessage = {
  role: "ai";
  content: string;
};

export type HumanMessage = {
  role: "human";
  content: string;
};

export type Conversation = AiMessage | HumanMessage;
