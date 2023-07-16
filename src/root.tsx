// @refresh reload
import { Suspense } from "solid-js";
import {
  useLocation,
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";
import { Toaster } from "solid-toast";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Yogananda Scholar</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <Routes>
              <FileRoutes />
            </Routes>
            {/* <Portal> */}
              <Toaster
                position="top-center"
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  // Define default options that each toast will inherit. Will be overwritten by individual toast options
                  className: "font-semibold",
                  duration: 5000,
                }}
              />
            {/* </Portal> */}
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
