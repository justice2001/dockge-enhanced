import {DockgeServer} from "./dockge-server";
import childProcessAsync from "promisify-child-process";

export class DockerImage {
    protected server: DockgeServer;

    constructor(server: DockgeServer) {
        this.server = server;
    }

    async getImageLs() {
        const res = await childProcessAsync.spawn("docker", [ "image", "ls", "--format", "json" ], {
            encoding: "utf-8",
        });
        if (!res.stdout) {
            return {};
        }

        const imageList: ImageStruct[] = [];

        const images = res.stdout?.toString().split("\n");
        for (let image of images) {
            try {
                const parsed = JSON.parse(image);
                imageList.push({
                    imageId: parsed.ID,
                    repository: parsed.Repository,
                    size: parsed.Size,
                    used: 0,
                    tag: parsed.Tag
                });
            } catch (e) {

            }
        }

        return imageList;
    }

    async prune(all: boolean) {
        const args = [ "image", "prune", "-f" ];
        all && args.push("-a");
        const res = await childProcessAsync.spawn("docker", args, {
            encoding: "utf-8"
        });
        return !res.stderr;
    }
}

export interface ImageStruct {
    repository: string;
    tag: string;
    imageId: string;
    size: string;
    used: number;
}
