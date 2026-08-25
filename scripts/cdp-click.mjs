const [portRaw, label] = process.argv.slice(2);
const port = Number(portRaw || 9222);

if (!Number.isFinite(port) || !label) {
  throw new Error("Usage: node cdp-click.mjs <port> <button label>");
}

const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
const page = targets.find(target => target.type === "page" && /127\.0\.0\.1:3000/.test(target.url))
  ?? targets.find(target => target.type === "page");
if (!page?.webSocketDebuggerUrl) {
  throw new Error("No inspectable Chromium page was available.");
}

const normalizedLabel = label.replace(/\s+/g, " ").trim().toUpperCase();
const expression = `
(() => {
  const expected = ${JSON.stringify(normalizedLabel)};
  const normalize = value => (value || "").replace(/\\s+/g, " ").trim().toUpperCase();
  const buttons = [...document.querySelectorAll("button")];
  const element = buttons.find(button => normalize(button.textContent) === expected)
    || buttons.find(button => normalize(button.textContent).includes(expected));
  if (!element) throw new Error("No matching button: " + expected);
  element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  element.click();
  return { label: normalize(element.textContent), disabled: Boolean(element.disabled) };
})()
`;

const result = await new Promise((resolve, reject) => {
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const timeout = setTimeout(() => reject(new Error("CDP command timed out.")), 5000);
  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
  });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id !== 1) return;
    clearTimeout(timeout);
    socket.close();
    if (message.error || message.result?.exceptionDetails) {
      const detail = message.result?.exceptionDetails;
      reject(new Error(message.error?.message || detail?.exception?.description || detail?.text || "CDP evaluation failed."));
      return;
    }
    resolve(message.result?.result?.value);
  });
  socket.addEventListener("error", () => {
    clearTimeout(timeout);
    reject(new Error("CDP socket error."));
  });
});

console.log(JSON.stringify(result));
