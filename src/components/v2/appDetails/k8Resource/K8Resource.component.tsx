import React, { Dispatch, SetStateAction, useEffect } from 'react';
import NodeTreeComponent from './nodeType/NodeTree.component';
import FilterResource from './FilterResource';
import './k8resources.css';
import { useRouteMatch } from 'react-router';
import AppDetailsStore, { AppDetailsTabs } from '../appDetails.store';
import NodeComponent from './nodeType/Node.component';
import { useSharedState } from '../../utils/useSharedState';
import IndexStore from '../index.store';
import { URLS } from '../../../../config';

interface K8ResourceComponentProps {
    clickedNodes: Map<string, string>;
    registerNodeClick: Dispatch<SetStateAction<Map<string, string>>>;
    handleFocusTabs: () => void;
}

export default function K8ResourceComponent(props: K8ResourceComponentProps) {
    const { url } = useRouteMatch();
    const [nodes] = useSharedState(IndexStore.getAppDetailsNodes(), IndexStore.getAppDetailsNodesObservable());

    useEffect(() => {
        AppDetailsStore.markAppDetailsTabActiveByIdentifier(AppDetailsTabs.k8s_Resources);
    }, []);

    return (
        <div className="bcn-0" style={{ justifyContent: 'space-between' }}>
            <div className="pt-16 pl-20 pb-16">
                <FilterResource nodes={nodes} />
            </div>
            {nodes.length > 0 ? (
                <div className="resource-node-wrapper d-flex">
                    <div className="k8-resources-node-tree pt-8 pl-16 border-right">
                        <NodeTreeComponent />
                    </div>
                    <div className="flex-grow-1 p-0">
                        <NodeComponent handleFocusTabs={props.handleFocusTabs}/>
                    </div>
                </div>
            ) : (
                <div>Empty UI</div>
            )}
        </div>
    );
}