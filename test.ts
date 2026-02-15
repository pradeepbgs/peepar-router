import { TrieRouter } from "./dist/router.js";

const r = new TrieRouter();
r.add("GET", "/hello/:id", () => "ok");

const matchedHandler = r.find("GET", "/hello/123");
const params = r.parseParams("/hello/123", matchedHandler.params);
console.log(params); // { id: '123' }
