export type Context = {
  quote_id: string;
  content: string;
  chapter: string;
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
