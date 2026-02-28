// Copyright (c) 2026 Pradeep
// Licensed under the MIT License

class TrieNodes {
  children: Record<string, TrieNodes>;
  isEndOfWord: boolean;
  handlers: Record<string, Function> | undefined;
  middlewares: Function[];
  paramName: string
  finalHandler: Record<string, Array<Function> | undefined>
  constructor() {
    this.children = {};
    this.handlers = {};
    this.isEndOfWord = false;
    this.middlewares = [];
    this.paramName = ""
    this.finalHandler = undefined
  }
}

//
export class TrieRouter {
  root: TrieNodes;
  globalMiddlewares: Function[];
  isCompiled: boolean
  find: Function
  constructor() {
    this.root = new TrieNodes();
    this.globalMiddlewares = [];
    this.isCompiled = false
    this.find = this.lazyFind
  }

  addMiddleware(pattern: string, handlers: Function | Function[]) {
    return this.pushMiddleware(pattern, handlers)
  }

  pushMiddleware(pattern: string, handlers: Function | Function[]) {
    if (!Array.isArray(handlers)) handlers = [handlers];
    if (pattern === "/") {
      this.globalMiddlewares.push(...handlers);
      return;
    }

    let node = this.root;
    const pathSegments = pattern.split("/").filter(Boolean);

    for (const element of pathSegments) {
      let key = element;
      if (element.startsWith(":")) {
        key = ":";
      } else if (element.startsWith("*")) {
        node.middlewares.push(...handlers);
      }

      if (!node.children[key]) node.children[key] = new TrieNodes();

      node = node.children[key];
    }

    node.middlewares.push(...handlers);

    node.isEndOfWord = true
  }

  insert(method: string, pattern: string, handler: Function) {
    let node = this.root;

    const pathSegments = pattern.split("/").filter(Boolean);
    const collectedMiddlewares = this.globalMiddlewares.slice();
    if (pattern === "/") {
      node.isEndOfWord = true;
      node.handlers[method] = handler
      return;
    }
    for (let i = 0; i < pathSegments.length; i++) {
      const element = pathSegments[i];
      let key = element;
      let cleanParam = ''
      if (element.startsWith(":")) {
        key = ":";
        cleanParam = element.slice(1)
      }


      if (!node.children[key]) node.children[key] = new TrieNodes();

      node = node.children[key];
      if (cleanParam) {
        node.paramName = cleanParam
      }
      if (node.middlewares.length > 0) {
        collectedMiddlewares.push(...node.middlewares)
      }
    }
    node.handlers[method] = handler;
    node.isEndOfWord = true;
  }

  add(method: string, pattern: string, handler: Function) {
    return this.insert(method, pattern, handler)
  }

  search(method: string, pattern: string) {
    let node = this.root;
    const pathSegments = pattern.split("/")

    let collected: Array<Function> | undefined
    let params: Record<string, string> | undefined

    for (let i = 0; i < pathSegments.length; i++) {
      const element = pathSegments[i];
      if (element.length === 0) {
        continue;
      }

      if (node.children[element]) {
        node = node.children[element]!;
      } else if (node.children[":"]) {
        node = node.children[":"];
        if (!params) params = {}
        params[node.paramName] = element
      } else if (node.children["*"]) {
        node = node.children["*"];
        break;
      } else {
        return { params: params, handler: this.globalMiddlewares };
      }

      if (node?.middlewares?.length > 0) {
        const mw = node.middlewares;
        if (!collected) collected = this.globalMiddlewares.slice();
        for (let j = 0; j < mw.length; j++) {
          collected.push(mw[j]);
        }
      }
    }
    const methodHandler = node.handlers && node?.handlers[method]
    if (methodHandler) {
      if (!collected) collected = this.globalMiddlewares.slice();
      collected.push(methodHandler);
    }
    return {
      params: params,
      handler: collected,
    };
  }

  optimisedSearch(method: string, pattern: string) {
    let node = this.root;
    let element = "";

    let collected: Array<Function> | undefined
    let params: Record<string, string> | undefined

    for (let i = 0; i <= pattern.length; i++) {
      const char = pattern[i];

      if (char === "/" || i === pattern.length) {
        if (element.length === 0) continue;

        // node search
        if (node.children[element]) {
          node = node.children[element];
        } else if (node.children[":"]) {
          node = node.children[":"];
           if (!params) params = {}
          params[node.paramName] = element
        } else if (node.children["*"]) {
          node = node.children["*"];
          break;
        } else {
          return { params: params, handler: this.globalMiddlewares };
        }

        if (node?.middlewares?.length > 0) {
          const mw = node.middlewares;
          if (!collected) collected = this.globalMiddlewares.slice();
          for (let j = 0; j < mw.length; j++) {
            collected.push(mw[j]);
          }
        }

        element = "";
      } else {
        // element = element.concat(char)
        element += char
      }
    }
    const methodHandler = node.handlers && node?.handlers[method]
    if (methodHandler) {
      if (!collected) collected = this.globalMiddlewares.slice();
      collected.push(methodHandler);
    }
    return {
      params: params,
      handler: collected,
    };
  }

  // unstable API
  compiledFind(method: string, pattern: string) {
    let node = this.root;
    const pathSegments = pattern.split("/")

    let params: Record<string, string> | undefined

    for (let i = 0; i < pathSegments.length; i++) {
      const element = pathSegments[i];
      if (element.length === 0) {
        continue;
      }

      if (node.children[element]) {
        node = node.children[element]!;
      } else if (node.children[":"]) {
        node = node.children[":"];
        if (!params) params = {}
        params[node.paramName] = element
      } else if (node.children["*"]) {
        node = node.children["*"];
        break;
      } else {
        return { params: params, handler: node?.finalHandler?.[method] };
      }
    }
    return {
      params: params,
      handler: node?.finalHandler?.[method],
    };
  }
  // unstabel api
  private lazyFind(method: string, pattern: string) {
    this.compile()

    this.find = this.compiledFind
    return this.compiledFind(method, pattern)
  }
  // unstable api
  // Compile method which will compile all these routes once our application registers all it's route.
  private compileNode(node: TrieNodes, inheritedMiddlewares: Array<Function>) {
    const currentMiddlewares = [...inheritedMiddlewares, ...node?.middlewares]
    if (node.isEndOfWord) {
      if (!node.finalHandler) node.finalHandler = {}
      for (const method in node.handlers) {
        const finalHandler = [...currentMiddlewares, node.handlers[method]]
        node.finalHandler[method] = finalHandler
      }
      // node.middlewares=undefined
      // node.handlers=undefined
    }

    for (const key in node.children) {
      this.compileNode(node.children[key], currentMiddlewares);
    }

  }

  compile() {
    this.compileNode(this.root, this.globalMiddlewares)
  }

}