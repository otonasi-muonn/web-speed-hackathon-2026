import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";

import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images
      ? await Promise.all(images.map((image) => sendFile("/api/v1/images", image)))
      : [],
    movie: movie ? await sendFile("/api/v1/movies", movie) : undefined,
    sound: sound ? await sendFile("/api/v1/sounds", sound) : undefined,
    text,
  };

  return sendJSON("/api/v1/posts", payload);
}

interface Props {
  id: string;
}

function getCheckbox(id: string): HTMLInputElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLInputElement ? el : null;
}

export const NewPostModalContainer = ({ id }: Props) => {
  const dialogId = useId();
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const checkbox = getCheckbox(id);
    if (!checkbox) return;

    const handleChange = () => {
      // Reset form state when modal closes
      if (!checkbox.checked) {
        setResetKey((key) => key + 1);
      }
    };
    checkbox.addEventListener("change", handleChange);
    return () => {
      checkbox.removeEventListener("change", handleChange);
    };
  }, [id]);

  const navigate = useNavigate();

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetError = useCallback(() => {
    setHasError(false);
  }, []);

  const handleRequestCloseModal = useCallback(() => {
    const checkbox = getCheckbox(id);
    if (checkbox) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [id]);

  const handleSubmit = useCallback(
    async (params: SubmitParams) => {
      try {
        setIsLoading(true);
        const post = await sendNewPost(params);
        handleRequestCloseModal();
        navigate(`/posts/${post.id}`);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [handleRequestCloseModal, navigate],
  );

  return (
    <div className="ccss-modal-overlay new-post-modal-overlay">
      {/* Backdrop - click to close */}
      <div className="bg-cax-overlay/50 fixed inset-0 z-40" onClick={handleRequestCloseModal} />
      <dialog
        open
        aria-labelledby={dialogId}
        className="bg-cax-surface relative z-50 m-0 w-full max-w-[calc(min(var(--container-md),100%)-var(--spacing)*4)] rounded-lg border-none p-4"
      >
        <NewPostModalPage
          key={resetKey}
          id={dialogId}
          hasError={hasError}
          isLoading={isLoading}
          onResetError={handleResetError}
          onSubmit={handleSubmit}
        />
      </dialog>
    </div>
  );
};
