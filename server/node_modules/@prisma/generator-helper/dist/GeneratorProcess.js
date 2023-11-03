"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var GeneratorProcess_exports = {};
__export(GeneratorProcess_exports, {
  GeneratorError: () => GeneratorError,
  GeneratorProcess: () => GeneratorProcess
});
module.exports = __toCommonJS(GeneratorProcess_exports);
var import_debug = __toESM(require("@prisma/debug"));
var import_child_process = require("child_process");
var import_cross_spawn = require("cross-spawn");
var import_colors = require("kleur/colors");
var import_byline = __toESM(require("./byline"));
const debug = (0, import_debug.default)("prisma:GeneratorProcess");
let globalMessageId = 1;
class GeneratorError extends Error {
  constructor(message, code, data) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "GeneratorError";
    if (data?.stack) {
      this.stack = data.stack;
    }
  }
}
class GeneratorProcess {
  constructor(pathOrCommand, { isNode = false } = {}) {
    this.pathOrCommand = pathOrCommand;
    this.handlers = {};
    this.errorLogs = "";
    this.getManifest = this.rpcMethod(
      "getManifest",
      (result) => result.manifest ?? null
    );
    this.generate = this.rpcMethod("generate");
    this.isNode = isNode;
  }
  async init() {
    if (!this.initPromise) {
      this.initPromise = this.initSingleton();
    }
    return this.initPromise;
  }
  initSingleton() {
    return new Promise((resolve, reject) => {
      if (this.isNode) {
        this.child = (0, import_child_process.fork)(this.pathOrCommand, [], {
          stdio: ["pipe", "inherit", "pipe", "ipc"],
          env: {
            ...process.env,
            PRISMA_GENERATOR_INVOCATION: "true"
          },
          // TODO: this assumes the host has at least 8 GB of RAM which may not be the case.
          execArgv: ["--max-old-space-size=8096"]
        });
      } else {
        this.child = (0, import_cross_spawn.spawn)(this.pathOrCommand, {
          stdio: ["pipe", "inherit", "pipe"],
          env: {
            ...process.env,
            PRISMA_GENERATOR_INVOCATION: "true"
          },
          shell: true
        });
      }
      this.child.on("exit", (code, signal) => {
        debug(`child exited with code ${code} on signal ${signal}`);
        if (code) {
          const error = new GeneratorError(
            `Generator ${JSON.stringify(this.pathOrCommand)} failed:

${this.errorLogs}`
          );
          this.pendingError = error;
          this.rejectAllHandlers(error);
        }
      });
      this.child.stdin.on("error", () => {
      });
      this.child.on("error", (error) => {
        debug(error);
        this.pendingError = error;
        if (error.code === "EACCES") {
          reject(
            new Error(
              `The executable at ${this.pathOrCommand} lacks the right permissions. Please use ${(0, import_colors.bold)(
                `chmod +x ${this.pathOrCommand}`
              )}`
            )
          );
        } else {
          reject(error);
        }
        this.rejectAllHandlers(error);
      });
      (0, import_byline.default)(this.child.stderr).on("data", (line) => {
        const response = String(line);
        let data;
        try {
          data = JSON.parse(response);
        } catch (e) {
          this.errorLogs += response + "\n";
          debug(response);
        }
        if (data) {
          this.handleResponse(data);
        }
      });
      this.child.on("spawn", resolve);
    });
  }
  rejectAllHandlers(error) {
    for (const id of Object.keys(this.handlers)) {
      this.handlers[id].reject(error);
      delete this.handlers[id];
    }
  }
  handleResponse(data) {
    if (data.jsonrpc && data.id) {
      if (typeof data.id !== "number") {
        throw new Error(`message.id has to be a number. Found value ${data.id}`);
      }
      if (this.handlers[data.id]) {
        if (isErrorResponse(data)) {
          const error = new GeneratorError(data.error.message, data.error.code, data.error.data);
          this.handlers[data.id].reject(error);
        } else {
          this.handlers[data.id].resolve(data.result);
        }
        delete this.handlers[data.id];
      }
    }
  }
  sendMessage(message, callback) {
    if (!this.child) {
      callback(new GeneratorError("Generator process has not started yet"));
      return;
    }
    if (!this.child.stdin.writable) {
      callback(new GeneratorError("Cannot send data to the generator process, process already exited"));
      return;
    }
    this.child.stdin.write(JSON.stringify(message) + "\n", (error) => {
      if (!error) {
        return callback();
      }
      if (error.code === "EPIPE") {
        return callback();
      }
      callback(error);
    });
  }
  getMessageId() {
    return globalMessageId++;
  }
  stop() {
    if (!this.child?.killed) {
      this.child?.kill();
    }
  }
  rpcMethod(method, mapResult = (x) => x) {
    return (params) => new Promise((resolve, reject) => {
      if (this.pendingError) {
        reject(this.pendingError);
        return;
      }
      const messageId = this.getMessageId();
      this.handlers[messageId] = {
        resolve: (result) => resolve(mapResult(result)),
        reject
      };
      this.sendMessage(
        {
          jsonrpc: "2.0",
          method,
          params,
          id: messageId
        },
        (error) => {
          if (error)
            reject(error);
        }
      );
    });
  }
}
function isErrorResponse(response) {
  return response.error !== void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GeneratorError,
  GeneratorProcess
});
