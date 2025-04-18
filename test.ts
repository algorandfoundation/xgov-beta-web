import { create } from "kubo-rpc-client";

// connect to the default API address http://localhost:5001
const client = create();

// call Core API methods
const { cid } = await client.add("Hello world!");
console.log(cid);
