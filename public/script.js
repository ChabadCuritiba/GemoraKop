const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const statusText = document.getElementById("status");

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

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
      statusText.textContent = "";
      return;
    }

    appendMessage(data.reply, "bot");
    statusText.textContent = "";
  } catch (error) {
    appendMessage("Network error. Please try again.", "bot");
    statusText.textContent = "";
  }
});
