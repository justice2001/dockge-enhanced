import { AgentSocketHandler } from "../agent-socket-handler";
import {callbackResult, checkLogin, DockgeSocket, ValidationError} from "../util-server";
import { DockgeServer } from "../dockge-server";
import { AgentSocket } from "../../common/agent-socket";
import { log } from "../log";
import { Stack } from "../stack";

export class FileSocketHandler extends AgentSocketHandler {
    create(socket: DockgeSocket, server: DockgeServer, agentSocket: AgentSocket) {
        agentSocket.on("listDir", async (stackName: unknown, path: unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(path) !== "string") {
                    throw new ValidationError("Path must be a string");
                }
                const stack = await this.getStack(server, stackName);
                const res = await stack.listFiles(path);
                callbackResult({
                    ok: true,
                    files: res
                }, callback);
            } catch (e) {
                if (e instanceof Error) {
                    log.warn("agent", e.message);
                }
            }
        });

        agentSocket.on("getFile", async (stackName: unknown, file: unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(file) !== "string") {
                    throw new ValidationError("File Path must be a string");
                }

                const stack = await this.getStack(server, stackName);
                const content = await stack.getFile(file);

                callbackResult({
                    ok: true,
                    content: content,
                }, callback);
            } catch (e) {
                if (e instanceof Error) {
                    log.warn("agent", e.message);
                }
            }
        });

        agentSocket.on("saveFile", async (stackName: unknown, file: unknown, content: unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(file) !== "string") {
                    throw new ValidationError("File Path must be a string");
                }

                if (typeof(content) !== "string") {
                    throw new ValidationError("File content must be a string");
                }

                const stack = await this.getStack(server, stackName);
                await stack.saveFile(file, content);

                callbackResult({
                    ok: true
                }, callback);

            } catch (e) {
                if (e instanceof Error) {
                    log.warn("agent", e.message);
                }
            }
        });
    }

    async getStack(server : DockgeServer, stackName: unknown) {
        if (typeof(stackName) !== "string") {
            throw new ValidationError("Stack name must be a string");
        }
        return await Stack.getStack(server, stackName);
    }
}
