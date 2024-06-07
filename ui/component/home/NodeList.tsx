import React from "react";
import { ProList } from "@ant-design/pro-components";
import {
    ApiOutlined,
    CloudServerOutlined,
    CodeOutlined,
    DeleteOutlined,
    DockerOutlined,
    ReloadOutlined
} from "@ant-design/icons";
import { Badge, Button, Space } from "antd";
import ChipsetOutlined from "../../src/icon/ChipsetOutlined";
import MemoryOutlined from "../../src/icon/MemoryOutlined";
import ServerOutlined from "../../src/icon/ServerOutlined";

const statusMap: Record<string, {
    status: "success" | "default" | "processing" | "error" | "warning";
    text: string
}> = {
    "connected": {
        status: "success",
        text: "已连接，运行中"
    },
    "disconnected": {
        status: "error",
        text: "链接断开"
    },
    "registered": {
        status: "processing",
        text: "已注册，但从未链接"
    },
    "performance": {
        status: "warning",
        text: "性能警告"
    }
};

type NodeInfo = {
    cpu: string;
    memory: string;
    disk: string;
    dockerVersion: string;
    daemonVersion: string;
    nodeStatus: string;
}

type NodeData = {
    nodeName: string;
    nodeIp: string;
    nodeMngPort: string;
    nodeInfo: NodeInfo;
}

const demoData: NodeData[] = [
    {
        nodeName: "Services-Node",
        nodeIp: "10.0.0.28",
        nodeMngPort: "20000",
        nodeInfo: {
            cpu: "2C4T",
            memory: "16GB",
            disk: "128GB",
            dockerVersion: "1.23.5",
            daemonVersion: "1.0.0",
            nodeStatus: "connected"
        },
    },
    {
        nodeName: "Lab-Node",
        nodeIp: "10.0.0.27",
        nodeMngPort: "20000",
        nodeInfo: {
            cpu: "2C2T",
            memory: "8GB",
            disk: "32GB",
            dockerVersion: "1.23.5",
            daemonVersion: "1.0.0",
            nodeStatus: "disconnected"
        }
    }
];

const nodeList: React.FC = () => {
    return (
        <>
            <ProList<NodeData>
                dataSource={demoData}
                metas={{
                    avatar: {
                        render: () => <ServerOutlined style={{ fontSize: 22, color: "#1D63ED" }} />
                    },
                    title: {
                        dataIndex: "nodeName"
                    },
                    description: {
                        dataIndex: "nodeIp"
                    },
                    content: {
                        dataIndex: "nodeInfo",
                        render: (data) => {
                            const dt = data as unknown as NodeInfo;
                            return (
                                <Space size={"large"}>
                                    <Space direction={"vertical"}>
                                        <div><ChipsetOutlined /> {dt.cpu}</div>
                                        <div><MemoryOutlined /> {dt.memory}</div>
                                    </Space>
                                    <Space direction={"vertical"}>
                                        <div><DockerOutlined /> {dt.dockerVersion}</div>
                                        <div><ApiOutlined /> {dt.daemonVersion}</div>
                                    </Space>
                                    <div>
                                        <Badge status={statusMap[dt.nodeStatus]?.status || "default"}
                                            text={statusMap[dt.nodeStatus]?.text || "未知"} />
                                    </div>
                                </Space>
                            );
                        },
                    },
                    actions: {
                        render: (text, row) => [
                            <Button
                                type={"link"}
                                icon={<CodeOutlined />}
                            >
                                终端
                            </Button>,
                            <Button
                                type={"link"}
                                icon={<ReloadOutlined />}
                            >
                                重新连接
                            </Button>,
                            <Button
                                type={"link"}
                                icon={<DeleteOutlined />}
                                danger
                            >
                                删除节点
                            </Button>,
                        ]
                    }
                }}
            >

            </ProList>
        </>
    );
};

export default nodeList;
