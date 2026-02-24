// Copyright (c) 2026 Pradeep
// Licensed under the MIT License

class TrieNodes {
  children: Record<string, TrieNodes>;
  isEndOfWord: boolean;
  handlers: Record<string, Function>;
  middlewares: Function[];
  paramName:string
  constructor() {
    this.children = {};
    this.handlers = {};
    this.isEndOfWord = false;
    this.middlewares = [];
    this.paramName=""
  }
}

//
export class TrieRouter {
  root: TrieNodes;
  globalMiddlewares: Function[];
  constructor() {
    this.root = new TrieNodes();
    this.globalMiddlewares = [];
  }

  pushMiddleware(path: string, handlers: Function | Function[]) {
    if (!Array.isArray(handlers)) handlers = [handlers];
    if (path === "/") {
      this.globalMiddlewares.push(...handlers);
      return;
    }

    let node = this.root;
    const pathSegments = path.split("/").filter(Boolean);

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

    // node.isEndOfWord = true
  }

 insert(method: string, path: string, handler: Function) {
    let node = this.root;

    const pathSegments = path.split("/").filter(Boolean);

    // handle if path is /
    if (path === "/") {
      node.isEndOfWord = true;
      node.handlers[method]=handler
      return;
    }
    for (let i=0; i<pathSegments.length; i++) {
      const element = pathSegments[i];
      let key = element;
      let cleanParam = ''
      if (element.startsWith(":")) {
        key = ":";
        cleanParam = element.slice(1)
      }
      

      if (!node.children[key]) node.children[key] = new TrieNodes();

      node = node.children[key];
      if(cleanParam) {
        node.paramName=cleanParam
      }
    }
    node.handlers[method]=handler;
    node.isEndOfWord = true;
 }
  
  add(method: string, path: string, handler:Function) {
    return this.insert(method,path,handler)
  }

  search(method: string, path: string) {
    let node = this.root;

    const pathSegments = path.split("/")

    let collected = this.globalMiddlewares.slice();
    let params:Record<string,string>|undefined

    for (let i = 0; i < pathSegments.length; i++) {
      const element = pathSegments[i];
      if (element.length === 0) {
        continue;
      }

      if (node.children[element]) {
        node = node.children[element]!;
      } else if (node.children[":"]) {
        node = node.children[":"];
        if(!params)params={}
        params[node.paramName]=element
      } else if (node.children["*"]) {
        node = node.children["*"];
        break;
      } else {
        return { params: params, handler: collected };
      }

      if (node.middlewares.length > 0) {
        const mw = node.middlewares;
        for (let j = 0; j < mw.length; j++) {
          collected.push(mw[j]);
        }
      }
    }
    const methodHandler = node.handlers[method]
    if (methodHandler) collected.push(methodHandler);
    return {
      params: params,
      handler: collected,
    };
  }
  
  find(method: string, path: string) {
    return this.search(method,path)
  }

  // param parser
  parseParams(inComingpath: string|null, param: Record<string, number>|null) {
    const paramObject: Record<string, any> = {};
    
    const pathWithoutQuery = inComingpath?.split('?')[0]
    // URL = /user/id/register?name=pradeep
    // [ "/user/id/register", "name=pradeep" ]
    const paths = pathWithoutQuery?.split('/').filter(Boolean);
    for (const key in param) {
      paramObject[key] = paths?.[param[key]];
    }
    return paramObject;
  }
}