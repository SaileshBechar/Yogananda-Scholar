import { HiOutlinePlusCircle } from "solid-icons/hi";
import { Component, createSignal } from "solid-js";
import AddDocumentModal from "./AddDocumentModal";

export const AddDocumentSideDrawer: Component<{}> = () => {
  return (
    <div class="menu p-4 w-80 bg-secondary text-base-content min-h-screen flex-nowrap">
      <button
        onClick={() => window.add_doc_modal.showModal()}
        class="btn btn-base-100 flex items-center mb-4"
      >
        <HiOutlinePlusCircle size={22} class="mr-2" />
        Add Document
      </button>
    
    <AddDocumentModal/>
      {/* <Suspense fallback={<div class="btn loading">Loading Papers</div>}>
        <ul class="font-semibold">
          <For each={props.pdfs?.results}>
            {(result) => (
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={result.pdf_link}
                  class="flex justify-between"
                >
                  {result.title}
                </a>
              </li>
            )}
          </For>
        </ul>
      </Suspense> */}
    </div>
  );
};
