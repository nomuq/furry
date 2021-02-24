import "reflect-metadata";

import { Server, createServer, IncomingMessage, ServerResponse } from "http";
import { match, pathToRegexp } from "./router-regex";

export const MetadataKeys = {
  controller: "resty:controller",
  httpMethod: "resty:httpMethod",
  param: "resty:parameter",
};

export enum HTTPMethod {
  get = "get",
  post = "post",
  put = "put",
  delete = "delete",
  patch = "patch",
  options = "options",
  head = "head",
  all = "all",
}

export interface HTTPMethodMetadata {
  path: string;
  method: HTTPMethod;
  propertyKey: string;
  arguments: any[];
}

function httpMethod(path: string, method: HTTPMethod) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    var arrHttpMethodMetada: HTTPMethodMetadata[] =
      Reflect.getMetadata(MetadataKeys.httpMethod, target.constructor) ?? [];

    // Append / if not exist in path
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    const metadata: HTTPMethodMetadata = {
      path,
      method,
      propertyKey,
      arguments: Reflect.getMetadata("design:paramtypes", target, propertyKey),
    };

    arrHttpMethodMetada.push(metadata);

    Reflect.defineMetadata(
      MetadataKeys.httpMethod,
      arrHttpMethodMetada,
      target.constructor
    );
  };
}

export function Get(path: string) {
  return httpMethod(path, HTTPMethod.get);
}

export function Post(path: string) {
  return httpMethod(path, HTTPMethod.post);
}

export function Put(path: string) {
  return httpMethod(path, HTTPMethod.put);
}

export function Delete(path: string) {
  return httpMethod(path, HTTPMethod.delete);
}

export function Patch(path: string) {
  return httpMethod(path, HTTPMethod.patch);
}

export function Options(path: string) {
  return httpMethod(path, HTTPMethod.options);
}

export function Head(path: string) {
  return httpMethod(path, HTTPMethod.head);
}

export function All(path: string) {
  return httpMethod(path, HTTPMethod.all);
}

export interface ControllerMetadata {
  path: string;
}

export function Controller(path: string) {
  return function (target: any) {
    // Append / if not exist in path
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    const metadata: ControllerMetadata = {
      path: path,
    };
    Reflect.defineMetadata(MetadataKeys.controller, metadata, target);
  };
}

//

// server.listen(8080);

@Controller("/hello")
class HelloController {
  @Get("/")
  index() {
    return "Hello World";
  }

  @Get("/health")
  health() {
    return "ok";
  }

  @Get("/posts/:postID")
  postsbyid() {
    return "ok";
  }
}

const metadata: ControllerMetadata = Reflect.getMetadata(
  MetadataKeys.controller,
  HelloController
);

const arrHttpMethodMetada: HTTPMethodMetadata[] =
  Reflect.getMetadata(MetadataKeys.httpMethod, HelloController) ?? [];

function handler(req: IncomingMessage, res: ServerResponse) {
  // if strict mode is off or add traling slash
  if (!req.url?.endsWith("/")) {
    req.url = req.url + "/";
  }

  console.log(req.headers["content-type"]);
  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      // console.log(body);
      res.end("ok");
    });

    
    // console.log(body);
  }

  arrHttpMethodMetada.forEach((m) => {
    if (!m.path.endsWith("/")) {
      m.path = m.path + "/";
    }

    var route = metadata.path + m.path;

    const fn = match(route, { decode: decodeURIComponent });

    if (req.url && fn(req.url)) {
      console.log('Found Route:', fn(req.url));
    }
  });

  res.end();
}

const server: Server = createServer(handler);
server.listen(8080);
