import { Accessor, Component, For, Show } from "solid-js";
import ChatContextCollapse from "./ContextCollapse";

const ChatBubbleWindow: Component<{
  conversation: Accessor<any>;
  contextHistory: Accessor<any>;
  isWaitingForCompletion: Accessor<any>;
  chatboxRef: HTMLDivElement | undefined;
}> = (props) => {
  return (
    <div
      class="overflow-auto pb-[95px] max-w-3xl md:max-w-6xl m-auto"
      ref={props.chatboxRef}
    >
      <For each={props.conversation()}>
        {(bubble, index) => (
          <Show
            when={bubble.role === "ai"}
            fallback={
              <div class="chat chat-end">
                <div class="chat-bubble mt-10 flex bg-base-300">
                  {bubble.content}
                </div>
              </div>
            }
          >
            <Show when={bubble.content.length > 0}>
              <div class="chat chat-start">
                <div class="chat-bubble mt-10 flex flex-col gap-4 bg-secondary text-secondary-content whitespace-pre-line">
                  <div class="p-4">{bubble.content}</div>
                  <Show
                    when={props.contextHistory()[(index() - 1) / 2].length > 0}
                  >
                    <ChatContextCollapse
                      context={props.contextHistory()[(index() - 1) / 2]}
                    />
                  </Show>
                </div>
              </div>
            </Show>
          </Show>
        )}
      </For>

      <Show when={props.isWaitingForCompletion()} fallback={<></>}>
        <div class="chat chat-start">
          <div class="chat-bubble mt-10 flex bg-secondary text-secondary-content">
            Studying <span class="ml-2 loading loading-ring loading-sm"></span>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ChatBubbleWindow;
