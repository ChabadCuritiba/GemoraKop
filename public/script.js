const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const statusText = document.getElementById("status");
const submitButton = chatForm.querySelector("button[type='submit']");

let isSubmitting = false;

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSubmitting) return;

  const message = messageInput.value.trim();
  if (!message) return;

  isSubmitting = true;
  submitButton.disabled = true;
  appendMessage(message, "user");
  messageInput.value = "";
  statusText.textContent = "Thinking...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    if (!response.ok) {
      appendMessage(data.error || "Request failed.", "bot");
      return;
    }

    appendMessage(data.reply, "bot");
  } catch (error) {
    appendMessage(
      "Network error: could not reach the chat server. If deployed, make sure your backend (with /api/chat) is running on the same domain.",
      "bot"
    );
  } finally {
    statusText.textContent = "";
    submitButton.disabled = false;
    isSubmitting = false;
    messageInput.focus();
  }
});
