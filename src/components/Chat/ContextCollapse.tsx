import { Component, For } from "solid-js";
import { Context } from "~/types";

const ChatContextCollapse: Component<{ context: Context[] }> = (props) => {
  const capitalizeTitle = (str: string): string => {
    const minorWords = ["a", "an", "and", "as", "by", "for", "in", "of", "on", "or"];
  
    const words = str.toLowerCase().split(" ");
  
    const capitalizedWords = words.map((word, index) =>
      (index === 0 || index === words.length - 1 || !minorWords.includes(word))
        ? `${word.charAt(0).toUpperCase()}${word.slice(1)}`
        : word
    );
  
    const capitalizedString = capitalizedWords.join(" ");
  
    return capitalizedString;
  };

  return (
    <div
      tabindex="0"
      class="collapse collapse-arrow bg-secondary-content text-secondary-focus"
    >
      <div class="collapse-title font-medium h-[45px]">Sources</div>
      <div class="collapse-content">
        <For each={props.context}>
          {(item) => (
            <div class="p-2 sm:p-10 rounded-lg my-4 bg-secondary text-secondary-content">
              <div>{item.paragraph_text}</div>
              <div class="inline-flex justify-between gap-4 mt-4 w-full">
                <div>{capitalizeTitle(item.chapter_name)}</div>
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
