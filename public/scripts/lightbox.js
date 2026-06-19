(() => {
  const dialog = document.querySelector("[data-lightbox]");
  const triggers = [...document.querySelectorAll("[data-lightbox-item]")];

  if (!dialog || triggers.length === 0 || typeof dialog.showModal !== "function") {
    return;
  }

  const image = dialog.querySelector("[data-lightbox-image]");
  const caption = dialog.querySelector("[data-lightbox-caption]");
  const counter = dialog.querySelector("[data-lightbox-counter]");
  const previousButton = dialog.querySelector("[data-lightbox-prev]");
  const nextButton = dialog.querySelector("[data-lightbox-next]");
  const closeButton = dialog.querySelector("[data-lightbox-close]");

  let index = 0;
  let returnFocusTo = null;

  const setPhoto = (nextIndex) => {
    index = (nextIndex + triggers.length) % triggers.length;
    const trigger = triggers[index];

    image.src = trigger.dataset.fullSrc || trigger.href;
    image.alt = trigger.dataset.alt || "";
    caption.textContent = trigger.dataset.caption || "";
    caption.hidden = !caption.textContent;
    counter.textContent = `Foto ${index + 1} von ${triggers.length}`;
  };

  const open = (nextIndex, trigger) => {
    returnFocusTo = trigger;
    setPhoto(nextIndex);
    dialog.showModal();
    closeButton.focus();
  };

  const close = () => {
    dialog.close();
  };

  triggers.forEach((trigger, triggerIndex) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(triggerIndex, trigger);
    });
  });

  previousButton.addEventListener("click", () => setPhoto(index - 1));
  nextButton.addEventListener("click", () => setPhoto(index + 1));
  closeButton.addEventListener("click", close);

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPhoto(index - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPhoto(index + 1);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });

  dialog.addEventListener("close", () => {
    image.removeAttribute("src");
    if (returnFocusTo instanceof HTMLElement) {
      returnFocusTo.focus();
    }
  });
})();
