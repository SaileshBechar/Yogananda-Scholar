import { Component, For, Show } from "solid-js";
import { FaSolidArrowRight } from 'solid-icons/fa'

const ChatWelcomeColumn: Component<{
  header: string;
  icon: any;
  buttonText: string[];
  buttonHandler ?: (question : string) => Promise<void>;
}> = (props) => {
  return (
    <div class="flex flex-col mb-8 md:mb-auto gap-3.5 flex-1">
      <div class="flex flex-col justify-center items-center gap-3.5 text-xl m-5">
        <props.icon />
        {props.header}
      </div>
      <For each={props.buttonText}>
        {(text) => (
          <Show
            when={props.buttonHandler !== undefined}
            fallback={
              <div class="rounded-lg border-1 p-4 bg-base-200">{text}</div>
            }
          >
            <button onClick={() => {if (props.buttonHandler) props.buttonHandler(text)}} class="rounded-lg border-1 p-4 bg-base-200 hover:bg-base-300">

              {'"' + text + '" ' }
              < FaSolidArrowRight class="inline-flex" size={12}/>
            </button>
          </Show>
        )}
      </For>
    </div>
  );
};

export default ChatWelcomeColumn;
