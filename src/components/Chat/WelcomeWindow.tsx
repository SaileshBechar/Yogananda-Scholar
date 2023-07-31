import { Component } from "solid-js";
import ChatWelcomeColumn from "./WelcomeColumn";
import { BsSun, BsBook } from "solid-icons/bs";
import { IoWarningOutline } from "solid-icons/io";

const ChatWelcomeWindow: Component<{
  buttonHandler: (question: string) => Promise<void>;
}> = (props) => {
  return (
    <div class="overflow-hidden pb-[80px]">
      <div class="flex flex-col justify-start h-full">
        <div class="w-full mx-auto md:max-w-2xl lg:max-w-3xl md:h-full md:flex md:flex-col px-6">
          <div class="text-4xl font-semibold text-center mt-6 sm:mt-[20vh] ml-auto mr-auto mb-10 sm:mb-16 flex gap-2 items-center justify-center">
            Yogananda Scholar
          </div>
          <div class="md:flex items-start text-center gap-3.5 text-sm">
            <ChatWelcomeColumn
              header="Examples"
              icon={BsSun}
              buttonHandler={props.buttonHandler}
              buttonText={[
                "Provide quotes on strength and overcoming obstacles",
                "Where did Guruji first have a vision of the Mount Washington headquaters?",
                "Which metals are in an astrological bangle?",
              ]}
            />
            <ChatWelcomeColumn
              header="Capabilities"
              icon={BsBook}
              buttonText={[
                "Retrieves factual information from the works of Paramahansa Yogananda",
                "Only answers questions based on the text provided in 'Sources'",
                "Allows the user to ask follow-up questions",
              ]}
            />
            <ChatWelcomeColumn
              header="Limitations"
              icon={IoWarningOutline}
              buttonText={[
                "May occasionally generate incorrect information",
                "Only has access to Autobiography of a Yogi",
                "Cannot provide advice",
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWelcomeWindow;
