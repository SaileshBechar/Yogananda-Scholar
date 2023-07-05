import { HiSolidQuestionMarkCircle, HiSolidArrowRight } from "solid-icons/hi";
import { createRouteAction, useNavigate } from "solid-start";
import toast from "solid-toast";
import { createSignal } from "solid-js";
import { createServerAction$, redirect } from "solid-start/server";
import { Portal } from "solid-js/web";

export default function AddDocumentModal() {
  const [uploading, { Form }] = createRouteAction(
    async (formData: FormData) => {
      const isFormValid = (formData: FormData) => {
        if (
          !formData.get("link") &&
          (formData.get("file") as File).size === 0
        ) {
          toast.error("Fields must not be empty!");
          console.log("Empty form");
          return false;
        }
        console.log(formData.get("link"));
        console.log(formData.get("file"));
        return true;
      };

      let toastId = "";
      if (isFormValid(formData)) {
        console.log("Form is valid");
        toastId = toast.loading("Uploading Document", {
          duration: 1_000 * 5,
        });
        window.add_doc_modal.close()
      }
    }
  );

  return (
    <Portal>
      <dialog id="add_doc_modal" class="modal modal-bottom sm:modal-middle">
        <form method="dialog" class="modal-box sm:w-10/12">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
          <h3 class="font-bold text-xl mb-8 sm:text-center">
            Upload a document
          </h3>
          <Form class="form-control w-full max-w-lg mb-4 gap-4">
            <input
              type="text"
              name="link"
              placeholder="Link to document"
              class="input input-primary w-full max-w-sm "
            />
            <div>- OR -</div>
            <input
              type="file"
              name="file"
              class="file-input w-full max-w-sm file-input-primary"
            />
            <div class="modal-action">
              <button class="btn btn-secondary" type="submit">
                Save
              </button>
            </div>
          </Form>
        </form>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </Portal>
  );
}
