import { Accessor, Component, Setter, Show, createSignal, splitProps } from "solid-js";

export const authenticateUser = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch(
      import.meta.env.VITE_BASE_URL + "/api/authenticate_user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );

    if ((await response.status) === 200) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error authenticating user:", error);
    return false;
  }
};

const Login: Component<{
  setIsAuthenticated: Setter<boolean>;
}> = (props) => {
  const [local, others] = splitProps(props, [
    "setIsAuthenticated",
  ]);

  let passwordRef: HTMLInputElement | undefined;
  const [isPasswordError, setIsPasswordError] = createSignal<boolean>(false);
  const handleSubmitPassword = async (password: string) => {
    const isAuthenticated = await authenticateUser(password)
    if (isAuthenticated) {
      local.setIsAuthenticated(true);
      localStorage.setItem('password', password);
    } else {
      setIsPasswordError(true)
    }
  };

  return (
    <div class="flex justify-center items-center h-screen">
      <div class="flex flex-col items-center justify-center gap-10 bg-base-200 rounded-lg p-20 border-2 border-base-300">
        <div class="text-2xl font-semibold">
          Yogananda Scholar is password protected.
        </div>
        <input
          type="password"
          ref={passwordRef}
          placeholder="Enter your password"
          class="input input-bordered w-full max-w-xs"
        />
        <Show when={isPasswordError()}>
          <div class="text-error font-semibold">Incorrect Password</div>
        </Show>
        <button
          class="btn btn-secondary"
          onkeypress={(e: any) => {
            if (e.key == "Enter")handleSubmitPassword(passwordRef?.value as string);
          }}
          onClick={() => handleSubmitPassword(passwordRef?.value as string)}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Login;
