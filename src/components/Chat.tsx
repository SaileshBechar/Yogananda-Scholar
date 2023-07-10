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

  const handleUserInput = async () => {
    setIsWaitingForCompletion(true);
    setIsCompleting(true);
    if (inputRef?.value) {
      setConversation((prev) => [
        ...prev,
        { content: inputRef?.value as string, role: "human" },
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

      inputRef.value = "";
    }
  };

  const clearChat = async () => {
    setConversation([]);
    setContextHistory([]);
  };

  return (
    <>
      <div class="overflow-auto sm:px-10 pb-4" ref={chatboxRef}>
        <For each={conversation()}>
          {(bubble, index) => (
            <Show
              when={bubble.role === "ai"}
              fallback={
                <div class="chat chat-end">
                  <div class="chat-bubble mt-10 flex bg-primary text-primary-content">
                    {bubble.content}
                  </div>
                </div>
              }
            >
              <Show when={bubble.content.length > 0}>
                <div class="chat chat-start">
                  <div class="chat-bubble mt-10 flex flex-col gap-4 bg-secondary text-secondary-content">
                    {bubble.content}
                    <Show when={contextHistory()[(index() - 1) / 2].length > 0}>
                      <ChatContextCollapse
                        context={contextHistory()[(index() - 1) / 2]}
                      />
                    </Show>
                  </div>
                </div>
              </Show>
            </Show>
          )}
        </For>
        <Show when={isWaitingForCompletion()} fallback={<></>}>
          <div class="chat chat-start">
            <div class="chat-bubble mt-10 flex bg-secondary text-secondary-content">
              Studying{" "}
              <span class="ml-2 loading loading-ring loading-sm"></span>
            </div>
          </div>
        </Show>
      </div>
      <div class="relative mt-4 sm:mx-[20%] mx-5">
        <input
          type="text"
          placeholder="Search your library."
          ref={inputRef}
          class="input input-bordered input-secondary w-full pr-[68px]"
          onkeypress={(e: any) => {
            if (e.key == "Enter" && !isCompleting()) handleUserInput();
          }}
        />
        <button
          class="btn btn-secondary w-16 p-2 absolute right-0"
          onClick={handleUserInput}
          disabled={isCompleting()}
        >
          <FiSearch size={20} />
        </button>
        <button
          class="btn btn-primary hidden sm:inline-flex absolute -right-20"
          onClick={clearChat}
        >
          <HiOutlineTrash size={20} />
        </button>
      </div>
    </>
  );
};
