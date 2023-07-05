import { Component, For } from "solid-js";
import { Context } from "./Chat";

const ChatContextCollapse: Component<{ context: Context[] }> = (props) => {
  return (
    <div
      tabindex="0"
      class="collapse collapse-arrow border border-secondary bg-neutral text-secondary"
    >
      <div class="collapse-title font-medium h-[45px]">Sources</div>
      <div class="collapse-content">
        <For each={props.context}>
          {(item) => (
            <div class="p-10 rounded-lg my-4 bg-secondary text-secondary-content">
              <div>{item.content}</div>
              <div class="inline-flex justify-between gap-4 mt-4 w-full">
                <div>{item.chapter.toLowerCase()},</div>
                <div>
                  <span>{item.book_name}, </span>
                  <span>{item.author}</span>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default ChatContextCollapse;
