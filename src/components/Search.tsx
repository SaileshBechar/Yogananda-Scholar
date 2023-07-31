import { Component, For, Show, createSignal } from "solid-js";
import { FiSearch } from "solid-icons/fi";
import { Context } from "~/types";
import { capitalizeTitle } from "./Chat/ContextCollapse";

const Search: Component<{}> = (props) => {
  const [isCompleting, setIsCompleting] = createSignal<boolean>(false);
  const [results, setResults] = createSignal<Context[]>([]);

  let inputRef: HTMLInputElement | undefined;

  async function fetchResults(url: string, data: {}): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json_response = await response.json();
      setIsCompleting(false);
      setResults(json_response["context"]);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  }

  const handleUserInput = async (query: string) => {
    setIsCompleting(true);

    if (query) {
      const url = import.meta.env.VITE_BASE_URL + "/api/vectordb_retrieval";
      const data = {
        conversation: [{ content: query, role: "human" }],
      };
      await fetchResults(url, data);
      (inputRef as HTMLInputElement).value = "";
    }
  };
  return (
    <div class="flex flex-col justify-start items-center h-full">
      <div class="join w-full max-w-lg sm:max-w-3xl mt-40">
        <input
          type="text"
          placeholder="Search the works of Paramahansa Yoganada with keywords"
          ref={inputRef}
          class="input input-bordered input-secondary w-full join-item"
          onkeypress={(e: any) => {
            if (e.key == "Enter" && !isCompleting())
              handleUserInput(inputRef?.value as string);
          }}
        />
        <button
          class="btn btn-secondary w-16 p-2 join-item rounded-r-lg"
          onClick={() => handleUserInput(inputRef?.value as string)}
          disabled={isCompleting()}
          data-testid="send-button"
        >
          <FiSearch size={22} />
        </button>
      </div>
      <Show when={isCompleting()}>
        <div class="mt-24 w-[80%] p-10 rounded-lg bg-base-200">
          <div class="p-2 sm:p-10 rounded-lg w-full text-center text-xl font-semibold bg-secondary text-secondary-content">
            Searching <span class="ml-2 loading loading-ring loading-sm"></span>
          </div>
        </div>
      </Show>
      <Show when={!isCompleting() && results().length > 0}>
        <div class="mt-24 w-[80%] p-10 rounded-lg bg-base-200">
          <For each={results()}>
            {(result) => (
              <div class="p-2 sm:p-10 rounded-lg my-4 bg-secondary text-secondary-content">
                <div class="whitespace-pre-line">{result.paragraph_text}</div>
                <div class="inline-flex justify-between gap-4 mt-4 w-full">
                  <div>{capitalizeTitle(result.chapter_name)}</div>
                  <div>
                    <span>{result.book_name}, </span>
                    <span>{result.author}</span>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Search;
