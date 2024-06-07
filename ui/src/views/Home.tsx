import React from "react";
import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { Space } from "antd";
import { Tiny } from "@ant-design/charts";
import NodeList from "../../component/home/NodeList";

const HomeView: React.FC = () => {
    return (
        <>
            <Space direction="vertical" style={{ width: "100%" }}>
                <ProCard headerBordered title={"数据概览"} bordered>
                    <StatisticCard.Group>
                        <StatisticCard
                            statistic={{
                                title: "总计",
                                value: 20
                            }}
                        />
                        <StatisticCard.Divider/>
                        <StatisticCard
                            statistic={{
                                title: "未操作",
                                value: 1,
                                status: "default"
                            }}
                        />
                        <StatisticCard
                            statistic={{
                                title: "正在运行",
                                value: 17,
                                status: "success"
                            }}
                        />
                        <StatisticCard
                            statistic={{
                                title: "部署中",
                                value: 0,
                                status: "processing"
                            }}
                        />
                        <StatisticCard
                            statistic={{
                                title: "状态异常",
                                value: 1,
                                status: "warning"
                            }}
                        />
                        <StatisticCard
                            statistic={{
                                title: "已停止",
                                value: 1,
                                status: "error"
                            }}
                        />
                    </StatisticCard.Group>
                </ProCard>

                <ProCard title={"资源池"} bordered headerBordered>
                    <StatisticCard.Group>
                        <StatisticCard statistic={{
                            title: "已注册节点",
                            value: 2,
                            status: "default"
                        }} />
                        <StatisticCard statistic={{
                            title: "已联机节点",
                            value: 1,
                            status: "success"
                        }} />
                        <StatisticCard.Divider />
                        <StatisticCard statistic={{
                            title: "CPU 占用率",
                            value: "20%"
                        }} chart={
                            <img
                                src="https://gw.alipayobjects.com/zos/alicdn/6YR18tCxJ/huanlv.svg"
                                alt="百分比"
                                width="100%"
                            />
                        } chartPlacement={"left"}/>
                        <StatisticCard statistic={{
                            title: "内存占用率",
                            value: "60%"
                        }} chart={<Tiny.Ring percent={0.6} width={60} height={60} color={[ "#E8EFF5", "#66AFF4" ]} />}
                        chartPlacement={"left"}/>
                    </StatisticCard.Group>
                </ProCard>
                <ProCard title={"节点列表"} bordered headerBordered>
                    <NodeList />
                </ProCard>
            </Space>
        </>
    );
};

export default HomeView;
