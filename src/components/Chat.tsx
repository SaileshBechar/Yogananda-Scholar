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

  async function postData(url: string, data: object): Promise<Response> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response;
  }

  createEffect(async () => {
    // eventSource().onmessage = (event) => {
    //   let completion = (event.data as string).slice(1, -1);
    //   // completion = String.raw`${completion}`
    //   if (completion === `[DONE]`) {
    //     setIsCompleting(false);
    //     eventSource().close();
    //   } else if (conversation().slice(-1)[0].role === "human") {
    //     setConversation((prev) => [
    //       ...prev,
    //       { content: "", role: "ai" },
    //     ]);
    //     setIsCompleting(true);
    //     setIsWaitingForCompletion(false);
    //   } else {
    //     completion = decodeUnicode(completion);
    //     completion = completion.replaceAll("\\\\", "\\");
    //     completion = completion.replaceAll("\\n", " ");
    //     setConversation((prev) => [
    //       ...prev.slice(0, -1),
    //       {
    //         content: prev.slice(-1)[0].content + completion,
    //         role: "ai",
    //       },
    //     ]);
    //     console.log(conversation().slice(1));
    //   }
    // };
  });

  createEffect(
    on(conversation, () => {
      if (chatboxRef) chatboxRef.scrollTop = chatboxRef?.scrollHeight;
    })
  );

  async function fetchData(url: string, data: {}): Promise<void> {
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
      setIsWaitingForCompletion(false);

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const data = value ? new TextDecoder().decode(value) : "";
        
        if (data.startsWith("Sources:")) {
          console.log("Parsing sources")
          const contextString = data.substring("Sources:".length);
          setContextHistory((prev) => [...prev, JSON.parse(contextString)]);
        }
        else {
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
      console.error("Error fetching data:", error);
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

      const url = "http://localhost:3000/api/stream_response";
      const data = {
        conversation: conversation(),
      };
      await fetchData(url, data);

      setIsCompleting(false);

      inputRef.value = "";
    }
  };

  const clearChat = async () => {
    setConversation([]);
  };

  return (
    <>
      <div class="overflow-auto sm:px-10 px-5 pb-4" ref={chatboxRef}>
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
              <div class="chat chat-start">
                <div class="chat-bubble mt-10 flex flex-col gap-4 bg-secondary text-secondary-content">
                  {bubble.content}
                  <ChatContextCollapse context={contextHistory()[(index() - 1) / 2]}/>
                </div>
              </div>
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
          class="input input-bordered input-secondary w-full pr-14"
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
