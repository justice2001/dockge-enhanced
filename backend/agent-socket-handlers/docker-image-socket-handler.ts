import { AgentSocketHandler } from "../agent-socket-handler";
import {callbackResult, DockgeSocket, ValidationError} from "../util-server";
import { DockgeServer } from "../dockge-server";
import { AgentSocket } from "../../common/agent-socket";
import { DockerImage } from "../image";

export class DockerImageSocketHandler extends AgentSocketHandler {
    create(socket: DockgeSocket, server: DockgeServer, agentSocket: AgentSocket) {
        agentSocket.on("getImageList", async (callback) => {
            const image = new DockerImage(server);
            const ls = await image.getImageLs();
            callbackResult({
                ok: true,
                images: ls
            }, callback);
        });

        agentSocket.on("pruneImages", async (all: unknown, callback) => {
            if (typeof all !== "boolean") {
                throw new ValidationError("All Param not Boolean");
            }
            const image = new DockerImage(server);
            const result = await image.prune(all);
            callbackResult({
                ok: result
            }, callback);
        });
    }
}
