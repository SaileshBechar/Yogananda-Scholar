import { HiOutlineTrash } from "solid-icons/hi";
import { FiSearch } from "solid-icons/fi";
import {
  Component,
  For,
  Show,
  createEffect,
  createSignal,
  on,
  onMount,
} from "solid-js";
import ChatContextCollapse from "./ChatContextCollapse";
import { Conversation, Context } from "~/types";
import ChatBubbleWindow from "./ChatBubbleWindow";
import ChatWelcomeWindow from "./ChatWelcomeWindow";

export const Chat: Component<{}> = () => {
  const [conversation, setConversation] = createSignal<Conversation[]>([]);
  const [contextHistory, setContextHistory] = createSignal<Context[][]>([]);
  const [isCompleting, setIsCompleting] = createSignal<boolean>(false);
  const [isWaitingForCompletion, setIsWaitingForCompletion] =
    createSignal<boolean>(false);

  let inputRef: HTMLInputElement | undefined;
  let chatboxRef: HTMLDivElement | undefined;

  createEffect(
    on(conversation, () => {
      if (chatboxRef) chatboxRef.scrollTop = chatboxRef?.scrollHeight;
    })
  );

  async function fetchContext(url: string, data: {}): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const json_response = await response.json();
      setContextHistory((prev) => [...prev, json_response["context"]]);
    } catch (error) {
      console.error("Error fetching context:", error);
    }
  }

  async function streamResponse(url: string, data: {}): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Failed to get response reader.");
      }
      setConversation((prev) => [...prev, { content: "", role: "ai" }]);

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        let data = value ? new TextDecoder().decode(value) : "";
        if (data) {
          setIsWaitingForCompletion(false);
          setConversation((prev) => [
            ...prev.slice(0, -1),
            {
              ...prev[prev.length - 1],
              content: prev[prev.length - 1].content + data,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error streaming response:", error);
    }
  }

  const handleUserInput = async (question : string) => {
    setIsWaitingForCompletion(true);
    setIsCompleting(true);
    if (question) {
      setConversation((prev) => [
        ...prev,
        { content: question, role: "human" },
      ]);

      const context_url =
        import.meta.env.VITE_BASE_URL + "/api/vectordb_retrieval";
      const context_data = {
        conversation: conversation(),
      };
      await fetchContext(context_url, context_data);

      const stream_url = import.meta.env.VITE_BASE_URL + "/api/stream_response";
      const stream_data = {
        conversation: conversation(),
        context: contextHistory()[contextHistory().length - 1],
      };
      await streamResponse(stream_url, stream_data);

      setIsCompleting(false);

      (inputRef as HTMLInputElement).value = '';
    }
  };

  const clearChat = async () => {
    setConversation([]);
    setContextHistory([]);
  };

  return (
    <main class="h-screen flex flex-col justify-end text-lg">
      <Show
        when={conversation().length > 0}
        fallback={<ChatWelcomeWindow buttonHandler={handleUserInput} />}
      >
        <ChatBubbleWindow
          chatboxRef={chatboxRef}
          contextHistory={contextHistory}
          conversation={conversation}
          isWaitingForCompletion={isWaitingForCompletion}
        />
      </Show>
      <div class="relative mt-4 sm:mx-[20%] mx-5">
        <input
          type="text"
          placeholder="Ask a question"
          ref={inputRef}
          class="input input-bordered input-secondary w-full pr-[68px]"
          onkeypress={(e: any) => {
            if (e.key == "Enter" && !isCompleting()) handleUserInput(inputRef?.value as string);
          }}
        />
        <button
          class="btn btn-secondary w-16 p-2 absolute right-0"
          onClick={() => handleUserInput(inputRef?.value as string)}
          disabled={isCompleting()}
        >
          <FiSearch size={20} />
        </button>
        <button
          class="btn hidden sm:inline-flex absolute -right-20"
          onClick={clearChat}
        >
          <HiOutlineTrash size={20} />
        </button>
        <div class="text-xs text-center my-2">Not affliated with Self-Realization Fellowship</div>
      </div>
    </main>
  );
};
