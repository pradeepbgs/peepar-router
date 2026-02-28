import { describe, expect, test, beforeAll } from "bun:test";
import { TrieRouter } from "./router";

let router: TrieRouter;

beforeAll(() => {
  router = new TrieRouter();

  router.add("GET", "/", () => "root");
  router.add("GET", "/about", () => "about page");
  router.add("GET", "/user/profile", () => "static profile");
  router.add("GET", "/user/:id", () => "dynamic user");
  router.add("GET", "/files/*", () => "catch all");

  router.add("GET", "/api/data", () => "GET handler");
  router.add("POST", "/api/data", () => "POST handler");

  router.add("GET", "/a/:b/c/:d/e", () => "nested");
  router.add("GET", "/orgs/:orgId/teams/:teamId", () => "team");
});

const runHandlers = (handlers: any) => {
  if (!handlers) return null;
  let result: any;
  for (const h of handlers) {
    result = h();
  }
  return result;
};

describe("TrieRouter - Basic Routing", () => {

  test("root route", () => {
    const result = router.search("GET", "/");
    expect(runHandlers(result?.handler)).toBe("root");
  });

  test("static route", () => {
    const result = router.search("GET", "/about");
    expect(runHandlers(result?.handler)).toBe("about page");
  });

  test("dynamic route", () => {
    const result = router.search("GET", "/user/123");
    expect(runHandlers(result?.handler)).toBe("dynamic user");
  });

  test("wildcard route", () => {
    const result = router.search("GET", "/files/images/photo.png");
    expect(runHandlers(result?.handler)).toBe("catch all");
  });

  test("multiple methods", () => {
    const getResult = router.search("GET", "/api/data");
    const postResult = router.search("POST", "/api/data");

    expect(runHandlers(getResult?.handler)).toBe("GET handler");
    expect(runHandlers(postResult?.handler)).toBe("POST handler");
  });

  test("method not found", () => {
    const result = router.search("PUT", "/api/data");
    expect(result?.handler).toBeEmpty()
  });

  test("deep dynamic route", () => {
    const result = router.search("GET", "/a/123/c/456/e");
    expect(runHandlers(result?.handler)).toBe("nested");
  });

  test("prefer exact over dynamic", () => {
    const result = router.search("GET", "/user/profile");
    expect(runHandlers(result?.handler)).toBe("static profile");
  });

  test("non-existent route", () => {
    const result = router.search("GET", "/non-existent");
    expect(result?.handler).toBeEmpty()
  });
});

describe("TrieRouter - Middleware Order", () => {

  let router: TrieRouter;

  beforeAll(() => {
    router = new TrieRouter();

    router.addMiddleware("/", () => "mw1");
    router.addMiddleware("/", () => "mw2");

    router.add("GET", "/", () => "handler");
  });

  test("middleware order", () => {
    const result = router.find("GET", "/");
    const outputs = result?.handler?.map((fn: () => any) => fn());
    expect(outputs).toEqual(["mw1", "mw2", "handler"]);
  });
});

describe('Middleware Path Matching', () => { 

    let r : TrieRouter

    beforeAll(() => {
        r = new TrieRouter()
        r.addMiddleware('/', () => "global")
        r.addMiddleware('/users', () => 'users level')
        r.addMiddleware('/user/**', () => "/user** level")
        r.addMiddleware('/user/name', () => '/user/** and /user/name')
        r.add('GET', '/user/name', () => 'handler')
    })

    test("should only contain global if no handler for a path or method", () => {
        let rs = r.search('POST', '/users/name') // method won't match
        let outputs = rs?.handler?.map(fn => fn())
        expect(outputs).toEqual(["global"])

        rs = r.search('GET', '/users/name') // path wont match
        outputs = rs.handler?.map(fn => fn())
        expect(outputs).toEqual(["global"])
    })

    test("collects all matching middleware", () => {
        const result = r.search('GET', '/user/name')
        const outputs = result?.handler?.map(fn => fn())
        expect(outputs).toEqual(["global", "/user** level", '/user/** and /user/name', 'handler'])
    })

    test("collect only users/ level handlers", () => {
        const rs = r.search('GET', '/users')
        const outputs = rs.handler?.map(fn => fn())
        expect(outputs).toEqual(['global','users level'])
    })

 })