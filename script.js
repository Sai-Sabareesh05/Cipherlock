/* CipherLock logic engine and browser UI. All circuit outputs are derived here. */
(function () {
  "use strict";

  const EVENT_NAMES = [
    "Message received", "Encryption started", "Encryption completed",
    "Decryption started", "Decryption completed", "Integrity verification passed",
    "Integrity verification failed", "Invalid input"
  ];
  const state = {
    stats: { bytes: 0, encryptions: 0, decryptions: 0, passed: 0, failed: 0 },
    events: [], trace: [], traceIndex: -1, traceTimer: null, selectedByte: 0,
    sender: null, receiver: { bytes: [], parity: [], integrity: null, errorBits: [] },
    lastEvent: null, currentOperation: "Idle"
  };

  function bit(value) { return value ? 1 : 0; }
  function xorGate(a, b) { return bit((a && !b) || (!a && b)); }
  function mux2to1(a, b, select) { return select ? b : a; }
  function demux1to2(data, select) { return { y0: data && !select ? 1 : 0, y1: data && select ? 1 : 0 }; }
  function byteToBits(value) { return Array.from({ length: 8 }, function (_, i) { return (value >> (7 - i)) & 1; }); }
  function bitsToByte(bits) { return bits.reduce(function (n, current) { return (n << 1) | bit(current); }, 0); }
  function bitsToString(bits) { return bits.join(""); }
  function bytesToHex(bytes) { return bytes.map(function (v) { return v.toString(16).padStart(2, "0").toUpperCase(); }).join(" "); }
  function bytesToBinary(bytes) { return bytes.map(function (v) { return bitsToString(byteToBits(v)); }).join(" "); }
  function textBytes(text) { return Array.from(new TextEncoder().encode(text)); }
  function keyBytes(key) {
    const trimmed = key.trim();
    if (/^(?:[0-9a-f]{2})(?:\s+[0-9a-f]{2})*$/i.test(trimmed)) {
      return trimmed.split(/\s+/).map(function (value) { return parseInt(value, 16); });
    }
    return textBytes(key);
  }
  function decodeBytes(bytes) { return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes)); }
  function generateEvenParity(value) { return byteToBits(value).reduce(xorGate, 0); }
  function checkEvenParity(value, receivedParity) { return generateEvenParity(value) === Number(receivedParity); }
  function encoder8to3(inputs) {
    const active = inputs.findIndex(Boolean);
    return active < 0 ? { valid: false, code: null, bits: [0, 0, 0], index: -1 } : { valid: true, code: active, bits: byteToBits(active).slice(5), index: active };
  }
  function decoder3to8(bits) {
    const code = bitsToByte([0, 0, 0, 0, 0].concat(bits));
    return Array.from({ length: 8 }, function (_, i) { return i === code ? 1 : 0; });
  }
  function demuxByte(value, select) {
    const bits = byteToBits(value);
    return { y0: bits.map(function (v) { return demux1to2(v, select).y0; }), y1: bits.map(function (v) { return demux1to2(v, select).y1; }) };
  }
  function transformByte(input, key, select, byteIndex) {
    const inputBits = byteToBits(input), muxA = select ? byteToBits(0) : inputBits, muxB = select ? inputBits : byteToBits(0), keyBits = byteToBits(key), gates = [];
    for (let i = 0; i < 8; i++) {
      const selected = mux2to1(muxA[i], muxB[i], select);
      gates.push({ index: i, a: selected, b: keyBits[i], y: xorGate(selected, keyBits[i]) });
    }
    const outputBits = gates.map(function (g) { return g.y; });
    return { input, key, inputBits, muxA, muxB, keyBits, outputBits, output: bitsToByte(outputBits), gates, demux: demuxByte(bitsToByte(outputBits), select), byteIndex };
  }
  function createTrace(bytes, keys, operation, selected) {
    const select = operation === "decrypt" ? 1 : 0, trace = [];
    bytes.forEach(function (value, index) {
      const calculation = transformByte(value, keys[index % keys.length], select, index);
      trace.push({ type: "stage", stage: "Binary conversion", byteIndex: index, bitIndex: -1, data: calculation });
      trace.push({ type: "stage", stage: "MUX selection", byteIndex: index, bitIndex: -1, data: calculation });
      calculation.gates.forEach(function (_, bitIndex) { trace.push({ type: "stage", stage: "XOR gate " + bitIndex, byteIndex: index, bitIndex: bitIndex, data: calculation }); });
      trace.push({ type: "stage", stage: "DEMUX routing", byteIndex: index, bitIndex: -1, data: calculation });
      trace.push({ type: "stage", stage: "Parity generation", byteIndex: index, bitIndex: -1, data: calculation });
    });
    trace.selectedByte = selected || 0;
    return trace;
  }
  function encryptMessage(message, key) {
    const bytes = textBytes(message), keys = keyBytes(key);
    if (!bytes.length) throw new Error("Enter a plaintext message.");
    if (!keys.length) throw new Error("Enter a demonstration key.");
    if (bytes.length > 512) throw new Error("Messages are limited to 512 UTF-8 bytes.");
    const calculations = bytes.map(function (v, i) { return transformByte(v, keys[i % keys.length], 0, i); });
    const output = calculations.map(function (c) { return c.output; });
    return { bytes: output, parity: output.map(generateEvenParity), calculations: calculations, trace: createTrace(bytes, keys, "encrypt", 0) };
  }
  function decryptMessage(ciphertext, key) {
    const keys = keyBytes(key);
    if (!ciphertext.length) throw new Error("Enter ciphertext bytes.");
    if (!keys.length) throw new Error("Enter a receiver key.");
    const calculations = ciphertext.map(function (v, i) { return transformByte(v, keys[i % keys.length], 1, i); });
    const bytes = calculations.map(function (c) { return c.output; });
    return { bytes: bytes, text: decodeBytes(bytes), calculations: calculations, trace: createTrace(ciphertext, keys, "decrypt", 0) };
  }
  function generateExecutionTrace(operationData) { return operationData.trace; }

  function $(id) { return document.getElementById(id); }
  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
  function flash(message, type) {
    const toast = $("toast"); toast.textContent = message; toast.className = "toast show " + (type || "");
    window.clearTimeout(flash.timer); flash.timer = window.setTimeout(function () { toast.className = "toast"; }, 3200);
  }
  function showSection(name) {
    document.querySelectorAll(".page-section").forEach(function (el) { el.classList.toggle("active", el.id === "section-" + name); });
    document.querySelectorAll(".nav-item").forEach(function (el) { el.classList.toggle("active", el.dataset.section === name); });
    const titles = { overview: "System overview", lab: "Message protection workspace", logic: "Live logic map", events: "Security event monitor", reference: "Digital logic reference", about: "About CipherLock" };
    setText("page-title", titles[name] || "CipherLock");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateStats() {
    Object.keys(state.stats).forEach(function (key) { setText("metric-" + key, state.stats[key]); });
    setText("event-count", state.events.length);
    setText("event-success-count", state.events.filter(function (e) { return e.status === "success"; }).length);
    setText("event-failure-count", state.events.filter(function (e) { return e.status === "failure"; }).length);
  }
  function renderRecentEvents() {
    const target = $("recent-events");
    target.innerHTML = state.events.slice(0, 5).map(eventRow).join("") || '<div class="empty-state">No events yet. Run an operation in Message Lab.</div>';
  }
  function eventRow(event) {
    return '<div class="event-row"><span class="event-indicator ' + event.status + '"></span><div><b>' + event.name + '</b><small>' + event.time + ' / code ' + event.code + '</small></div><strong class="' + event.status + '">' + (event.status === "failure" ? "WARN" : "OK") + "</strong></div>";
  }
  function renderEvents() {
    const target = $("event-table");
    target.innerHTML = state.events.map(function (event) {
      return '<div class="event-table-row"><span><i class="event-indicator ' + event.status + '"></i><b>' + event.name + '</b></span><span>' + event.time + '</span><code>' + event.code + '</code><span>' + event.decoded + '</span><strong class="' + event.status + '">' + (event.status === "failure" ? "WARNING" : "SUCCESS") + "</strong></div>";
    }).join("") || '<div class="empty-state">The event queue is empty.</div>';
  }
  function recordEvent(index, status) {
    const inputs = Array.from({ length: 8 }, function (_, i) { return i === index; }), encoded = encoder8to3(inputs), decoded = decoder3to8(encoded.bits), now = new Date();
    const event = { name: EVENT_NAMES[index], code: encoded.bits.join(""), decoded: EVENT_NAMES[decoded.findIndex(Boolean)], time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), status: status || (index === 6 || index === 7 ? "failure" : "success") };
    state.events.unshift(event); state.lastEvent = event; renderEvents(); renderRecentEvents(); updateStats(); renderEventCircuit(index, encoded);
    setText("overview-last-event", event.name); setText("overview-state", event.status === "failure" ? "Attention required" : "System operating normally");
  }
  function renderEventCircuit(index, encoded) {
    $("encoder-inputs").innerHTML = EVENT_NAMES.map(function (name, i) { return '<div class="' + (i === index ? "active" : "") + '"><i>' + (i === index ? "1" : "0") + "</i><span>I" + i + "</span><small>" + name + "</small></div>"; }).join("");
    $("decoder-outputs").innerHTML = EVENT_NAMES.map(function (name, i) { return '<div class="' + (i === index ? "active" : "") + '"><i>' + (i === index ? "1" : "0") + "</i><span>O" + i + "</span></div>"; }).join("");
    setText("encoder-output", encoded.valid ? encoded.bits.join("") : "---"); setText("decoder-input", encoded.valid ? encoded.bits.join("") : "---"); setText("event-code-badge", encoded.valid ? encoded.bits.join("") : "---"); setText("decoded-event", encoded.valid ? EVENT_NAMES[index] : "Idle");
  }
  function renderSender(result) {
    setText("ciphertextHex", bytesToHex(result.bytes)); setText("ciphertextBinary", bytesToBinary(result.bytes)); setText("senderParity", result.parity.join(" "));
    $("transfer-btn").disabled = false; state.sender = result; state.receiver = { bytes: result.bytes.slice(), parity: result.parity.slice(), integrity: null, errorBits: [] };
    $("incomingCiphertext").value = bytesToHex(result.bytes); $("receivedParity").value = result.parity.join(" ");
    state.trace = generateExecutionTrace(result); state.traceIndex = -1; state.selectedByte = 0; renderTrace(-1); setText("transfer-state", "Payload ready for transfer"); setText("top-status", "ENCRYPTION COMPLETE");
  }
  function parseHex(value) {
    const compact = value.replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "");
    if (!compact || compact.length % 2) throw new Error("Ciphertext must contain complete hexadecimal bytes.");
    return compact.match(/.{2}/g).map(function (v) { return parseInt(v, 16); });
  }
  function parseParity(value, length) {
    const compact = value.replace(/[^01]/g, "").split("").map(Number);
    if (compact.length !== length) throw new Error("Parity metadata must contain one bit for every ciphertext byte.");
    return compact;
  }
  function transfer() {
    if (!state.sender) return;
    $("incomingCiphertext").value = bytesToHex(state.sender.bytes); $("receivedParity").value = state.sender.parity.join(" ");
    state.receiver = { bytes: state.sender.bytes.slice(), parity: state.sender.parity.slice(), integrity: null, errorBits: [] };
    $("channel-note").textContent = "Clean payload copied. You can now inject a test error into the transmission copy.";
    setText("transfer-state", "Payload transferred to receiver"); setText("top-status", "PAYLOAD IN RECEIVER");
    recordEvent(0, "success"); flash("Ciphertext and parity metadata transferred.", "success");
  }
  function injectErrors(count) {
    if (!state.receiver.bytes.length) { flash("Transfer a payload before injecting errors.", "warning"); return; }
    const bytes = state.receiver.bytes.slice(), errorBits = [], index = Math.min(state.selectedByte, bytes.length - 1), original = bytes[index], changedBits = byteToBits(bytes[index]);
    const positions = count === 1 ? [0] : [0, 1]; positions.forEach(function (position) { const bitIndex = 7 - position; changedBits[bitIndex] = xorGate(changedBits[bitIndex], 1); errorBits.push(index + ":" + position); }); bytes[index] = bitsToByte(changedBits);
    state.receiver.bytes = bytes; state.receiver.errorBits = errorBits; $("incomingCiphertext").value = bytesToHex(bytes); $("channel-note").textContent = count === 1 ? "One bit flipped in the transmission copy." : "Two bits flipped in the same byte; simple parity may miss this.";
    setText("map-channel", count === 1 ? "1-BIT ERROR" : "2-BIT ERROR"); setText("top-status", "CHANNEL ERROR TEST"); flash("Transmission copy changed; original ciphertext is preserved.", "warning");
    void original;
  }
  function clearErrors() {
    if (!state.sender) return; state.receiver.bytes = state.sender.bytes.slice(); state.receiver.errorBits = []; $("incomingCiphertext").value = bytesToHex(state.receiver.bytes); $("channel-note").textContent = "Clean payload restored from sender buffer."; setText("map-channel", "CLEAN");
  }
  function verifyIntegrity() {
    try {
      const bytes = parseHex($("incomingCiphertext").value), parity = parseParity($("receivedParity").value, bytes.length);
      state.receiver.bytes = bytes; state.receiver.parity = parity; const results = bytes.map(function (value, i) { return checkEvenParity(value, parity[i]); }), passed = results.every(Boolean);
      state.receiver.integrity = passed; state.stats[passed ? "passed" : "failed"]++;
      const card = $("integrity-status"); card.className = "integrity-card " + (passed ? "pass" : "fail"); card.innerHTML = '<span class="signal-symbol">' + (passed ? "✓" : "!") + '</span><div><b>' + (passed ? "Integrity check passed" : "Integrity check failed") + "</b><small>" + (passed ? "Received parity matches recalculated parity." : "At least one byte has a parity mismatch.") + "</small></div>";
      setText("map-parity-check", passed ? "MATCH" : "MISMATCH"); setText("map-integrity", passed ? "PASS" : "FAIL"); $("map-integrity-node").classList.toggle("failed", !passed);
      recordEvent(passed ? 5 : 6, passed ? "success" : "failure"); setText("top-status", passed ? "INTEGRITY VERIFIED" : "INTEGRITY WARNING"); updateStats(); flash(passed ? "Parity verification passed." : "Parity mismatch detected.", passed ? "success" : "warning");
    } catch (error) { recordEvent(7, "failure"); flash(error.message, "error"); }
  }
  function decryptReceived() {
    try {
      const bytes = parseHex($("incomingCiphertext").value), key = $("receiver-key").value, result = decryptMessage(bytes, key);
      setText("recoveredText", result.text || "(empty decoded text)"); setText("recovery-warning", state.receiver.integrity === false ? "POTENTIALLY CORRUPTED" : "");
      state.currentOperation = "decrypt"; state.stats.decryptions++; state.stats.bytes += bytes.length; state.trace = generateExecutionTrace(result); state.traceIndex = -1; state.selectedByte = 0; renderTrace(-1); recordEvent(3, "success"); recordEvent(4, "success"); setText("top-status", "DECRYPTION COMPLETE"); updateStats(); flash(state.receiver.integrity === false ? "Decrypted for demonstration; output may be corrupted." : "Message recovered with the receiver key.", state.receiver.integrity === false ? "warning" : "success");
    } catch (error) { recordEvent(7, "failure"); flash(error.message, "error"); }
  }
  function renderTrace(index) {
    const trace = state.trace, item = index >= 0 ? trace[index] : trace[0], data = item && item.data;
    if (!data) return;
    const selected = state.selectedByte, byteItem = trace.find(function (entry) { return entry.byteIndex === selected; }) || item;
    setText("trace-stage", index >= 0 ? trace[index].stage : "Ready"); setText("trace-byte", (selected + 1) + " / " + Math.max(1, Math.max.apply(null, trace.map(function (t) { return t.byteIndex; })) + 1)); setText("trace-bit", index >= 0 && trace[index].bitIndex >= 0 ? trace[index].bitIndex : "--");
    const percent = index < 0 ? 0 : ((index + 1) / trace.length) * 100; $("trace-progress-bar").style.width = percent + "%";
    setText("map-input", bitsToString(byteItem.data.inputBits)); setText("map-binary", bitsToString(byteItem.data.inputBits)); setText("map-mux", (state.currentOperation === "decrypt" ? "B " : "A ") + bitsToString(state.currentOperation === "decrypt" ? byteItem.data.muxB : byteItem.data.muxA)); setText("map-mux-s", state.currentOperation === "decrypt" ? "1" : "0");
    setText("map-xor", bitsToString(byteItem.data.outputBits)); setText("map-demux", state.currentOperation === "decrypt" ? "Y1 active" : "Y0 active"); setText("map-demux-s", state.currentOperation === "decrypt" ? "1" : "0"); setText("map-output", byteItem.data.output.toString(16).padStart(2, "0").toUpperCase());
    setText("gate-a", bitsToString(byteItem.data.inputBits)); setText("gate-b", bitsToString(byteItem.data.keyBits)); setText("gate-y", bitsToString(byteItem.data.outputBits)); setText("map-parity-gen", generateEvenParity(byteItem.data.output));
    $("gate-bank").innerHTML = byteItem.data.gates.map(function (gate) { return '<button class="gate-cell ' + (index >= 0 && trace[index].bitIndex === gate.index ? "processing" : "") + '"><span>G' + gate.index + '</span><b>' + gate.a + " XOR " + gate.b + '</b><strong>' + gate.y + "</strong></button>"; }).join("");
    document.querySelectorAll(".circuit-node").forEach(function (node) { node.classList.toggle("processing", index >= 0); });
    setText("selected-byte-label", "Byte " + selected + " / " + Math.max(1, Math.max.apply(null, trace.map(function (t) { return t.byteIndex; })) + 1));
  }
  function runStep() {
    if (!state.trace.length) { flash("Run encryption or decryption first.", "warning"); return; }
    if (state.traceIndex >= state.trace.length - 1) { window.clearInterval(state.traceTimer); setText("top-status", "TRACE COMPLETE"); return; }
    state.traceIndex++; state.selectedByte = state.trace[state.traceIndex].byteIndex; renderTrace(state.traceIndex);
  }
  function resetTrace() { window.clearInterval(state.traceTimer); state.traceIndex = -1; setText("top-status", "READY"); renderTrace(-1); }
  function inspector(kind) {
    const info = {
      input: ["User input", "UTF-8 message bytes enter the local processing path.", "Source signal", "Input is converted to an 8-bit byte array before the MUX."],
      binary: ["Binary conversion", "TextEncoder bytes are represented as eight individual logic bits.", "Byte bits", "b7 b6 b5 b4 b3 b2 b1 b0"],
      mux: ["2:1 multiplexer", "Selects the data source that enters the shared XOR engine.", "Y = (NOT S AND A) OR (S AND B)", "S=0 selects plaintext; S=1 selects ciphertext."],
      xor: ["XOR gate bank", "Eight independent Boolean gates transform one byte.", "Y = (A AND NOT B) OR (NOT A AND B)", "Each gate receives one data bit and one repeating-key bit."],
      demux: ["1:2 demultiplexer", "Routes the XOR result to the operation's destination buffer.", "Y0 = D AND NOT S / Y1 = D AND S", "S=0 routes ciphertext; S=1 routes recovered plaintext."],
      output: ["Output buffer", "Stores the byte emitted by the selected DEMUX path.", "Byte = [Y7..Y0]", "The output is assembled from the eight gate results."]
    }[kind] || null;
    if (!info) return; setText("inspector-title", info[0]); setText("inspector-purpose", info[1]); $("inspector-content").innerHTML = '<div class="inspect-block"><span>CHSE CONCEPT</span><b>' + info[0] + '</b></div><div class="inspect-block"><span>BOOLEAN / SIGNAL MODEL</span><code>' + info[2] + '</code></div><div class="inspect-block"><span>CURRENT CONTRIBUTION</span><p>' + info[3] + "</p></div>";
  }
  function init() {
    document.querySelectorAll("[data-section]").forEach(function (el) { el.addEventListener("click", function () { showSection(el.dataset.section); }); });
    $("encrypt-btn").addEventListener("click", function () { try { const result = encryptMessage($("plaintext").value, $("sender-key").value); state.currentOperation = "encrypt"; state.stats.encryptions++; state.stats.bytes += result.bytes.length; renderSender(result); recordEvent(1, "success"); recordEvent(2, "success"); updateStats(); flash("Message transformed through eight XOR gates per byte.", "success"); } catch (error) { recordEvent(7, "failure"); flash(error.message, "error"); } });
    $("transfer-btn").addEventListener("click", transfer); $("flip-one-btn").addEventListener("click", function () { injectErrors(1); }); $("flip-two-btn").addEventListener("click", function () { injectErrors(2); }); $("clear-error-btn").addEventListener("click", clearErrors); $("verify-btn").addEventListener("click", verifyIntegrity); $("decrypt-btn").addEventListener("click", decryptReceived);
    $("run-btn").addEventListener("click", function () { if (!state.trace.length) { flash("Run encryption or decryption in Message Lab first.", "warning"); return; } window.clearInterval(state.traceTimer); state.traceTimer = window.setInterval(runStep, Number($("trace-speed").value)); setText("top-status", "TRACE RUNNING"); runStep(); });
    $("pause-btn").addEventListener("click", function () { window.clearInterval(state.traceTimer); setText("top-status", "TRACE PAUSED"); }); $("step-btn").addEventListener("click", runStep); $("reset-btn").addEventListener("click", resetTrace);
    $("prev-byte").addEventListener("click", function () { if (state.trace.length) { state.selectedByte = Math.max(0, state.selectedByte - 1); renderTrace(state.traceIndex); } }); $("next-byte").addEventListener("click", function () { if (state.trace.length) { state.selectedByte = Math.min(Math.max.apply(null, state.trace.map(function (t) { return t.byteIndex; })), state.selectedByte + 1); renderTrace(state.traceIndex); } });
    document.querySelectorAll("[data-inspect]").forEach(function (el) { el.addEventListener("click", function () { inspector(el.dataset.inspect); }); }); document.querySelectorAll("[data-copy]").forEach(function (el) { el.addEventListener("click", function () { navigator.clipboard.writeText($(el.dataset.copy).textContent).then(function () { flash("Copied to clipboard.", "success"); }); }); });
    $("clear-events").addEventListener("click", function () { state.events = []; renderEvents(); renderRecentEvents(); updateStats(); flash("Event history cleared.", "success"); });
    renderEventCircuit(-1, encoder8to3([])); renderRecentEvents(); renderEvents(); updateStats(); inspector("xor"); setText("map-input", "01000001"); setText("map-binary", "01000001"); setText("map-xor", "01001110"); setText("map-output", "4E"); setText("gate-a", "01000001"); setText("gate-b", "00001111"); setText("gate-y", "01001110");
  }
  window.CipherLock = { xorGate, mux2to1, demux1to2, encoder8to3, decoder3to8, generateEvenParity, checkEvenParity, encryptMessage, decryptMessage, generateExecutionTrace };
  document.addEventListener("DOMContentLoaded", init);
})();
