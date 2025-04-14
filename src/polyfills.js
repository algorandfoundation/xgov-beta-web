import { Buffer } from "buffer";

// Set window.Buffer to the Buffer polyfill
window.Buffer = window.Buffer || Buffer;
