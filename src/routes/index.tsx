import { A } from "solid-start";
import { AddDocumentSideDrawer } from "~/components/AddDocumentSideDrawer";
import { Chat } from "~/components/Chat";
import Counter from "~/components/Counter";
import toast, { Toaster } from "solid-toast";
import { Portal } from "solid-js/web";

export default function Home() {
  return (
    <>
      <div class="drawer drawer-mobile sm:drawer-open">
        <input id="doc-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
          <main class="h-screen w-full flex flex-col justify-end text-lg pb-10">
            <Chat />
          </main>
        </div>
        <div class="drawer-side">
          <label for="doc-drawer" class="drawer-overlay"></label>
          {/* <AddDocumentSideDrawer /> */}
        </div>
      </div>
    </>
  );
}
