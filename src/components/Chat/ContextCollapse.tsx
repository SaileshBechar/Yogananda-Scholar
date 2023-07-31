import { Component, For } from "solid-js";
import { Context } from "~/types";

export const capitalizeTitle = (inputString: string): string => {
  // Split the input string into an array of words
  const words = inputString.toLowerCase().split(" ");

  // Capitalize the first letter of each word and concatenate them back into a string
  const capitalizedWords = words.map((word) => {
    const firstChar = word.match(/[A-Za-z]/);
    if (firstChar) {
      const firstCharIndex = word.indexOf(firstChar[0]);
      const firstPart = word.slice(0, firstCharIndex);
      const restOfWord = word.slice(firstCharIndex);
      return (
        firstPart + restOfWord.charAt(0).toUpperCase() + restOfWord.slice(1)
      );
    } else {
      return word;
    }
  });

  // Join the capitalized words with spaces to form the final capitalized string
  const capitalizedString = capitalizedWords.join(" ");

  return capitalizedString;
};

const ChatContextCollapse: Component<{ context: Context[] }> = (props) => {
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
              <div class="whitespace-pre-line">{item.paragraph_text}</div>
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
