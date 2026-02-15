# Peepar

A fast and minimal Trie based HTTP router.

Peepar name is inspired by the **Peepal (Sacred fig) tree**, known for its deep roots and branching structure. Just like the tree, Peepar organizes routes using a Trie data structure, enabling fast and predictable path matching with very low overhead.

---

## Features

* Trie based routing for fast lookups
* Zero dependencies
* Very small footprint
* Middleware chaining support
* Dynamic route parameters
* Wildcard route matching
* Works in Node.js and Bun
* TypeScript types included
* Inbuilt params parser
* Inbuilt query string parser

---

## Installation

```bash
npm install peepar
```

---

## Basic Usage

```js
import { TrieRouter } from "peepar";

const router = new TrieRouter();

// Global Middleware
router.pushMiddleware('/', function GlobalMiddleware1() => 'global middleware')
router.pushMiddleware('/', function Middleware2() => 'global middleware 2')


router.add("GET", "/", function handler () => "home");

const matchedhandler = router.search("GET", "/");

Output:
  {
    params: {},
    handler: [GlobalMiddleware1,GlobalMiddleware2,handler]
  }

// Route specific middleware
router.pushMiddleware("/users", function userMiddleware(ctx) => {
  console.log("/users middleware");
});
router.add("GET", "/users/:id", function userHandler() => "user profile");

const result = router.find("GET", "/users/42");
// /users/42 is incoming path from the server
const params = router.parseParams('/users/42',result.params); 
// you will have to manually parse params until we support inbuilt params parse inside our router seach method.

```

Output:

```js
{
  params: { id: 1 }, // id : 1 is'nt real params , it's just index of ":id" in path
  handler: [GlobalMiddleware1,GlobalMiddleware2,userMiddleware,userHandler]
}

// params
{ id: 42 }

```

---

## Middleware
 - peepar supports global and route specific middleware

Global middleware:

```js
router.pushMiddleware("/", (ctx) => {
  console.log("global middleware");
});
```

Route specific middleware:

```js
router.pushMiddleware("/users", (ctx) => {
  console.log("/users middleware");
});
```

---

## Wildcard Routes

```js
router.add("GET", "/static/*", () => "HTML page");
```

Matches:

* /static/app.js
* /static/css/style.css
* /static/images/logo.png

---

## Performance

Peepar is designed for speed and low allocation during hot path. we try to minimise allocation and make our fast as much as possible.

Key design goals:

* Try to Avoid unnecessary allocations in hot path
* Minimal overhead during lookup
* Fast static and dynamic route matching
* Lightweight and cache friendly structure

---

## API

### router.add(method, path, handler)
### router.insert(method, path, handler)


Register a route.

### router.pushMiddleware(path, middleware)

Register middleware for a path or globally.

### router.search(method, path)
### router.find(method, path)

Find matching route and collect handlers.

Returns:

```ts
{
  params: Record<string, number>;
  handler: Function[];
}
```

---

## Example

```js
import { TrieRouter } from "peepar";

const router = new TrieRouter();

router.pushMiddleware("/", () => console.log("global"));
router.pushMiddleware("/api/*", () => console.log("api middleware"));

router.add("GET", "/api/users/:id", () => console.log("user handler"));

const res = router.find("GET", "/api/users/100");

for (const fn of res.handler) {
  fn();
}
```

---

## Roadmap

* Route priority improvements
* Param parsing inbuilt in search method
* Optional parameter support
* Regex based params
* Zero allocation path parser
* Extended benchmarking

---

## Contributing

Contributions, ideas, and performance improvements are welcome.

If you find a bug or want to improve performance, open an issue or submit a pull request.

---

## License

MIT

---

## Author

Pradeep Kumar

GitHub: [https://github.com/pradeepbgs/peepar-router](https://github.com/pradeepbgs/peepar-router)
