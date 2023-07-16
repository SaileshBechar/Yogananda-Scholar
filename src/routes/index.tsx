import { Chat } from "~/components/Chat/MainWindow";

export default function Home() {
  return (
    <>
      <div class="drawer drawer-mobile sm:drawer-open">
        <input id="doc-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
            <Chat />
        </div>
        <div class="drawer-side">
          <label for="doc-drawer" class="drawer-overlay"></label>
          {/* <AddDocumentSideDrawer /> */}
        </div>
      </div>
    </>
  );
}
