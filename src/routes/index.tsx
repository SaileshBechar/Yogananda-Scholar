import {
  Match,
  Show,
  Suspense,
  Switch,
  createSignal,
  onMount,
  useTransition,
} from "solid-js";
import { Chat } from "~/components/Chat/MainWindow";
import Login, { authenticateUser } from "~/components/Login";
import Search from "~/components/Search";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = createSignal<boolean>(false);
  const [tab, setTab] = createSignal<number>(0);
  const [pending, start] = useTransition();
  const updateTab = (index: number) => () => start(() => setTab(index));

  onMount(async () => {
    // Get an item from local storage
    const password = localStorage.getItem("password");
    console.log(password); // This will print the value associated with the key 'key'

    if (password) {
      setIsAuthenticated(await authenticateUser(password));
    }
  });
  return (
    <Show when={isAuthenticated()} fallback={<Login setIsAuthenticated={setIsAuthenticated}/>}>
      <div class="text-lg">
        <div class="tabs justify-center tabs-boxed">
          <a
            class="tab tab-active"
            classList={{ "tab-active": tab() === 0 }}
            onClick={updateTab(0)}
          >
            Chat
          </a>
          <a
            class="tab"
            classList={{ "tab-active": tab() === 1 }}
            onClick={updateTab(1)}
          >
            Search
          </a>
        </div>
        <Suspense fallback={<div class="loader">Loading...</div>}>
          <Switch>
            <Match when={tab() === 0}>
              <Chat />
            </Match>
            <Match when={tab() === 1}>
              <Search />
            </Match>
          </Switch>
        </Suspense>
      </div>
    </Show>
  );
}
