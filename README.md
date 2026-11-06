# CipherLock

CipherLock is a local, dependency-free educational application that demonstrates how digital logic can power a cybersecurity workflow. It combines a repeating-key XOR message transformation, even-parity integrity checking, a simulated transmission channel, and an event monitor built from an 8:3 encoder and 3:8 decoder.

> **Important:** CipherLock is an academic demonstration, not production-grade encryption or authentication. Do not use it to protect real secrets.

## What it demonstrates

- **XOR gate bank:** each byte is transformed by eight calls to `xorGate(a, b)`. Encryption and decryption use the same operation.
- **2:1 multiplexer:** select signal `S=0` routes plaintext into the XOR bank; `S=1` routes ciphertext for recovery.
- **1:2 demultiplexer:** routes the transformed byte to the ciphertext buffer or recovered-plaintext buffer.
- **Even parity:** the parity bit is calculated by XOR-reducing all eight ciphertext bits. The receiver recalculates and compares it.
- **8:3 encoder / 3:8 decoder:** one active security event is encoded into a three-bit value and decoded back into its event output.
- **Execution trace:** the Live Logic Map consumes the same intermediate calculations used by the Message Lab. It is not a decorative animation.

## Running locally

This is a static webpage. Open `index.html` in a current browser, or serve the folder with any static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

No API keys, build process, external services, or data uploads are required. The Google Fonts import is optional; the application falls back to system fonts when offline.

## Demonstration

1. In **Message Lab**, use plaintext `A` and key `0F`.
2. Click **Run encryption**. The ciphertext is `4E`, binary `01001110`, and parity is `0`.
3. Transfer the payload to the receiver.
4. Click **Verify integrity**, then **Decrypt message** using the separately entered receiver key.
5. Open **Live Logic Map** and use **Run simulation**, **Pause**, or **Next step** to inspect binary conversion, MUX selection, each of the eight XOR gates, DEMUX routing, and parity generation.
6. Use **Flip one bit** and **Flip two bits** to demonstrate parity's detection and limitation behavior. Errors affect only the receiver's transmission copy.

## Validation and input handling

- Text is encoded as UTF-8 and limited to 512 bytes.
- Ciphertext input must be complete hexadecimal bytes.
- Receiver verification requires one parity bit per ciphertext byte.
- A wrong receiver key produces a recovered output, but it does not authenticate the message.
- Error injection never mutates the sender buffer.
- Plaintext and keys exist only in the current page session.

## Project structure

```
index.html   # app layout and reference content
styles.css   # responsive technical interface
script.js    # Boolean logic engine, trace generation, state and UI
```

The logic functions are exposed as `window.CipherLock` for browser-console verification:

```js
CipherLock.xorGate(0, 1)                 // 1
CipherLock.mux2to1("A", "B", 1)          // "B"
CipherLock.demux1to2(1, 0)               // { y0: 1, y1: 0 }
CipherLock.generateEvenParity(0b01001110) // 0
```

## Limitations

Repeating-key XOR is vulnerable to key reuse and provides no authenticity. A one-bit parity check detects odd numbers of flipped bits within a byte but can miss an even number of flips. The communication channel is simulated locally and is not a network protocol.
