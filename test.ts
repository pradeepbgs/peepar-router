import { TrieRouter } from "./router";

const r = new TrieRouter();
r.add("GET", "/hello/:id/:name/:cors/:dim", () => "ok");

const inComingpath="/hello/124ljsadls/loud/corss/dimmm"
const matchedHandler = r.find("GET", inComingpath);
console.log(matchedHandler); // { id: '123' }
