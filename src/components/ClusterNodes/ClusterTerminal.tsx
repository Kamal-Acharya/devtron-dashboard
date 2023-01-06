import React, { useState, useEffect, useRef } from 'react'
import Tippy from '@tippyjs/react'
import ReactSelect, { components } from 'react-select'
import { shellTypes } from '../../config/constants'
import { SocketConnectionType } from '../v2/appDetails/k8Resource/nodeDetail/NodeDetailTabs/node.type'
import Terminal from '../v2/appDetails/k8Resource/nodeDetail/NodeDetailTabs/terminal/Terminal'
import {
    clusterDisconnectAndRetry,
    clusterTerminalDisconnect,
    clusterTerminalStart,
    clusterTerminalStop,
    clusterTerminalTypeUpdate,
    clusterTerminalUpdate,
} from './clusterNodes.service'
import { ReactComponent as Disconnect } from '../../assets/icons/ic-disconnected.svg'
import { ReactComponent as Abort } from '../../assets/icons/ic-abort.svg'
import { Option } from '../../components/v2/common/ReactSelect.utils'
import { ReactComponent as Connect } from '../../assets/icons/ic-connected.svg'
import { ReactComponent as Close } from '../../assets/icons/ic-close.svg'
import { ReactComponent as FullScreen } from '../../assets/icons/ic-fullscreen-2.svg'
import { ReactComponent as ExitScreen } from '../../assets/icons/ic-exit-fullscreen-2.svg'
import { ReactComponent as Play } from '../../assets/icons/ic-play.svg'
import CreatableSelect from 'react-select/creatable'
import { clusterImageDescription, convertToOptionsList, showError } from '../common'
import { ServerErrors } from '../../modals/commonTypes'
import ClusterManifest from './ClusterManifest'
import ClusterEvents from './ClusterEvents'
import TippyCustomized, { TippyTheme } from '../common/TippyCustomized'
import { ReactComponent as Help } from '../../assets/icons/ic-help.svg'
import { ReactComponent as HelpIcon } from '../../assets/icons/ic-help-outline.svg'
import { ClusterTerminalType } from './types'
import { clusterSelectStyle, CLUSTER_STATUS, IMAGE_LIST } from './constants'
import { OptionType } from '../userGroups/userGroups.types'

export default function ClusterTerminal({
    clusterId,
    clusterName,
    nodeList,
    closeTerminal,
    clusterImageList,
    isNodeDetailsPage,
    namespaceList,
    node,
    setSelectedNode,
}: ClusterTerminalType) {
    const terminalAccessIdRef = useRef()
    const clusterShellTypes = shellTypes.filter((types) => types.label === 'sh' || types.label === 'bash')
    const clusterNodeList = convertToOptionsList(nodeList)
    const imageList = convertToOptionsList(clusterImageList, IMAGE_LIST.NAME, IMAGE_LIST.IMAGE)
    const defaultNamespaceList = convertToOptionsList(namespaceList)
    const defaultNameSpace = defaultNamespaceList.find((item) => item.label === 'default') || defaultNamespaceList[0]
    const [selectedNodeName, setSelectedNodeName] = useState(node ? { label: node, value: node } : clusterNodeList[0])
    const [selectedTerminalType, setSelectedtTerminalType] = useState(shellTypes[0])
    const [terminalCleared, setTerminalCleared] = useState<boolean>(false)
    const [isPodCreated, setPodCreated] = useState<boolean>(true)
    const [socketConnection, setSocketConnection] = useState<SocketConnectionType>(SocketConnectionType.CONNECTING)
    const [selectedImage, setImage] = useState<OptionType>(imageList[0])
    const [selectedNamespace, setNamespace] = useState(defaultNameSpace)
    const [update, setUpdate] = useState<boolean>(false)
    const [isFullScreen, setFullScreen] = useState<boolean>(false)
    const [isFetchRetry, setRetry] = useState<boolean>(false)
    const [connectTerminal, setConnectTerminal] = useState<boolean>(false)
    const [isReconnect, setReconnect] = useState<boolean>(false)
    const [toggleOption, settoggleOption] = useState<boolean>(false)
    const [selectedTabIndex, setSelectedTabIndex] = useState(0)
    const payload = {
        clusterId: clusterId,
        baseImage: selectedImage.value,
        shellName: selectedTerminalType.value,
        nodeName: selectedNodeName.value,
        namespace: selectedNamespace.value,
    }

    useEffect(() => {
        if (update && !isNodeDetailsPage) {
            updateSelectedContainerName()
        }
    }, [clusterId, nodeList, node])

    useEffect(() => {
        try {
            setSelectedTabIndex(0)
            if (update) {
                socketDisconnecting()
                clusterTerminalUpdate({ ...payload, id: terminalAccessIdRef.current })
                    .then((response) => {
                        terminalAccessIdRef.current = response.result.terminalAccessId
                        setTerminalCleared(true)
                        socketConnecting()
                        setPodCreated(true)
                        setRetry(false)
                    })
                    .catch((error) => {
                        sessionError(error)
                        setPodCreated(false)
                        setSocketConnection(SocketConnectionType.DISCONNECTED)
                    })
            } else {
                clusterTerminalStart(payload)
                    .then((response) => {
                        terminalAccessIdRef.current = response.result.terminalAccessId
                        setUpdate(true)
                        socketConnecting()
                        setConnectTerminal(true)
                        setPodCreated(true)
                        setRetry(false)
                    })
                    .catch((error) => {
                        showError(error)
                        setPodCreated(false)
                        if (error instanceof ServerErrors && Array.isArray(error.errors)) {
                            error.errors.map(({ userMessage }) => {
                                if (userMessage === CLUSTER_STATUS.SESSION_LIMIT_REACHED) {
                                    setRetry(true)
                                    setConnectTerminal(true)
                                } else if (userMessage === CLUSTER_STATUS.POD_TERMINATED) {
                                    setUpdate(false)
                                    setConnectTerminal(false)
                                }
                            })
                        } else {
                            setConnectTerminal(false)
                        }
                        setSocketConnection(SocketConnectionType.DISCONNECTED)
                    })
            }
            toggleOptionChange()
        } catch (error) {
            showError(error)
            setUpdate(false)
            setSocketConnection(SocketConnectionType.DISCONNECTED)
        }
    }, [selectedNodeName.value, selectedImage.value, isReconnect, selectedNamespace.value])

    useEffect(() => {
        try {
            if (update) {
                socketDisconnecting()
                clusterTerminalTypeUpdate({ ...payload, terminalAccessId: terminalAccessIdRef.current })
                    .then((response) => {
                        terminalAccessIdRef.current = response.result.terminalAccessId
                        socketConnecting()
                    })
                    .catch((error) => {
                        showError(error)
                        setRetry(true)
                        setPodCreated(false)
                        setSocketConnection(SocketConnectionType.DISCONNECTED)
                    })
            }
            toggleOptionChange()
        } catch (error) {
            showError(error)
            setUpdate(false)
            setSocketConnection(SocketConnectionType.DISCONNECTED)
        }
    }, [selectedTerminalType.value])

    // Disconnect terminal on unmount of the component
    useEffect(() => {
        return (): void => {
            closeTerminalModal()
        }
    }, [])

    function updateSelectedContainerName() {
        if (node) {
            if (node !== selectedNodeName.value) {
                setSelectedNodeName({ label: node, value: node })
            }
        } else {
            setNamespace(defaultNameSpace)
            setImage(imageList[0])
            setSelectedNodeName(clusterNodeList[0])
        }
    }

    async function closeTerminalModal(): Promise<void> {
        try {
            if (!isNodeDetailsPage && typeof closeTerminal === 'function') {
                closeTerminal()
            }
            setConnectTerminal(false)
            if (isPodCreated && terminalAccessIdRef.current) {
                await clusterTerminalDisconnect(terminalAccessIdRef.current)
            }
            socketDisconnecting()
            toggleOptionChange()
            setUpdate(false)
        } catch (error) {
            setConnectTerminal(true)
            showError(error)
        }
    }

    async function stopTerminalConnection(): Promise<void> {
        setSocketConnection(SocketConnectionType.DISCONNECTING)
        try {
            await clusterTerminalStop(terminalAccessIdRef.current)
        } catch (error) {
            showError(error)
        }
    }

    async function disconnectRetry(): Promise<void> {
        try {
            setPodCreated(true)
            clusterDisconnectAndRetry(payload).then((response) => {
                terminalAccessIdRef.current = response.result.terminalAccessId
                setSocketConnection(SocketConnectionType.DISCONNECTED)
                setUpdate(true)
                socketConnecting()
                setRetry(false)
                setConnectTerminal(true)
            })
            toggleOptionChange()
        } catch (error) {
            setPodCreated(false)
            showError(error)
        }
    }

    const sessionError = (error): void => {
        showError(error)
        if (error instanceof ServerErrors && Array.isArray(error.errors)) {
            error.errors.map(({ userMessage }) => {
                if (userMessage === CLUSTER_STATUS.SESSION_LIMIT_REACHED) {
                    setRetry(true)
                } else if (userMessage === CLUSTER_STATUS.POD_TERMINATED) {
                    setUpdate(false)
                    setConnectTerminal(false)
                }
            })
        }
    }

    const reconnectTerminal = (): void => {
        terminalAccessIdRef.current = null
        socketConnecting()
        setConnectTerminal(true)
        setReconnect(!isReconnect)
    }

    const socketConnecting = (): void => {
        setSocketConnection(SocketConnectionType.CONNECTING)
    }

    const socketDisconnecting = (): void => {
        setSocketConnection(SocketConnectionType.DISCONNECTING)
    }

    const resumePodConnection = (): void => {
        setRetry(false)
        socketConnecting()
    }

    const onChangeNodes = (selected): void => {
        setSelectedNodeName(selected)

        if (setSelectedNode) {
            setSelectedNode(selected.value)
        }
    }

    const onChangeTerminalType = (selected): void => {
        setSelectedtTerminalType(selected)
    }

    const onChangeImages = (selected): void => {
        setImage(selected)
    }

    const onChangeNamespace = (selected): void => {
        setNamespace(selected)
    }

    const toggleScreenView = (): void => {
        setFullScreen(!isFullScreen)
    }

    const toggleOptionChange = (): void => {
        settoggleOption(!toggleOption)
    }

    const selectTerminalTab = (): void => {
        setSelectedTabIndex(0)
    }

    const selectEventsTab = (): void => {
        setSelectedTabIndex(1)
    }

    const selectManifestTab = (): void => {
        setSelectedTabIndex(2)
    }

    const menuComponent = (props) => {
        return (
            <components.MenuList {...props}>
                <div className="fw-4 lh-20 pl-8 pr-8 pt-6 pb-6 cn-7 fs-13 dc__italic-font-style">
                    Use custom image: Enter path for publicly available image
                </div>
                {props.children}
            </components.MenuList>
        )
    }

    const terminalContainer = () => {
        return (
            <Terminal
                nodeName={selectedNodeName.value}
                containerName={selectedNodeName.label}
                socketConnection={socketConnection}
                isTerminalCleared={terminalCleared}
                shell={selectedTerminalType}
                setTerminalCleared={setTerminalCleared}
                setSocketConnection={setSocketConnection}
                isClusterTerminal={true}
                terminalId={terminalAccessIdRef.current}
                disconnectRetry={disconnectRetry}
                isFetchRetry={isFetchRetry}
                isToggleOption={toggleOption}
                isFullScreen={isFullScreen}
                isTerminalTab={selectedTabIndex === 0}
                setTerminalTab={setSelectedTabIndex}
                isPodConnected={connectTerminal}
                sessionError={sessionError}
            />
        )
    }

    const imageTippyInfo = () => {
        return (
            <div className="p-12 fs-13">
                Select image you want to run inside the pod. Images contain utility tools (eg. kubectl, helm,
                curl,&nbsp;
                <a href="https://github.com/nicolaka/netshoot" target="_blank">
                    netshoot
                </a>
                ,&nbsp;
                <a href="https://busybox.net/" target="_blank">
                    busybox
                </a>
                ) which can be used to debug clusters and workloads.
                <br />
                <br />
                You can use publicly available custom images as well.
            </div>
        )
    }

    const imageOptionComponent = (props) => {
        const tippyText = clusterImageDescription(clusterImageList, props.data.value)

        return (
            <Option
                {...props}
                tippyClass="default-tt w-200"
                showTippy={!!tippyText}
                placement="left"
                tippyContent={tippyText}
            />
        )
    }

    return (
        <div
            className={`${
                isFullScreen || isNodeDetailsPage ? 'cluster-full_screen' : 'cluster-terminal-view-container'
            } ${isNodeDetailsPage ? '' : 'node-terminal'}`}
        >
            <div className="flex dc__content-space bcn-0 pl-20 dc__border-top h-32">
                <div className="flex left">
                    {clusterName && (
                        <>
                            <div className="cn-6 mr-16">Cluster</div>
                            <div className="flex fw-6 fs-13 mr-20">{clusterName}</div>
                            <span className="bcn-2 mr-8 h-32" style={{ width: '1px' }} />
                        </>
                    )}
                    {isNodeDetailsPage && (
                        <Tippy
                            className="default-tt"
                            arrow={false}
                            placement="bottom"
                            content={connectTerminal ? 'Disconnect and terminate pod' : 'Connect to terminal'}
                        >
                            {connectTerminal ? (
                                <span className="flex mr-8">
                                    <Disconnect className="icon-dim-16 mr-4 cursor" onClick={closeTerminalModal} />
                                </span>
                            ) : (
                                <span className="flex mr-8">
                                    <Connect className="icon-dim-16 mr-4 cursor" onClick={reconnectTerminal} />
                                </span>
                            )}
                        </Tippy>
                    )}

                    {!isNodeDetailsPage && (
                        <>
                            <div className="cn-6 ml-8 mr-10">Node</div>
                            <div style={{ minWidth: '145px' }}>
                                <ReactSelect
                                    placeholder="Select Containers"
                                    options={clusterNodeList}
                                    defaultValue={selectedNodeName}
                                    value={selectedNodeName}
                                    onChange={onChangeNodes}
                                    styles={clusterSelectStyle}
                                    components={{
                                        IndicatorSeparator: null,
                                        Option: (props) => <Option {...props} style={{ direction: 'rtl' }} />,
                                    }}
                                />
                            </div>
                        </>
                    )}

                    <span className="bcn-2 ml-8 mr-8" style={{ width: '1px', height: '16px' }} />
                    <div className="cn-6 ml-8 mr-10">Namespace</div>
                    <div>
                        <CreatableSelect
                            placeholder="Select Namespace"
                            options={defaultNamespaceList}
                            defaultValue={selectedNamespace}
                            value={selectedNamespace}
                            onChange={onChangeNamespace}
                            styles={clusterSelectStyle}
                            components={{
                                IndicatorSeparator: null,
                                Option,
                            }}
                        />
                    </div>

                    <span className="bcn-2 ml-8 mr-8" style={{ width: '1px', height: '16px' }} />
                    <div className="cn-6 ml-8 mr-4">Image</div>
                    <TippyCustomized
                        theme={TippyTheme.white}
                        heading="Image"
                        placement="top"
                        interactive={true}
                        trigger="click"
                        className="w-300"
                        Icon={Help}
                        showCloseButton={true}
                        iconClass="icon-dim-20 fcv-5"
                        additionalContent={imageTippyInfo()}
                    >
                        <HelpIcon className="icon-dim-16 mr-8 cursor" />
                    </TippyCustomized>
                    <div>
                        <CreatableSelect
                            placeholder="Select Image"
                            options={imageList}
                            defaultValue={selectedImage}
                            value={selectedImage}
                            onChange={onChangeImages}
                            styles={{
                                ...clusterSelectStyle,
                                menu: (base, state) => ({
                                    ...base,
                                    zIndex: 9999,
                                    textAlign: 'left',
                                    maxWidth: '380px',
                                    minWidth: '350px',
                                }),
                                control: (base, state) => ({
                                    ...clusterSelectStyle.control(base, state),
                                    maxWidth: '300px',
                                }),
                            }}
                            components={{
                                IndicatorSeparator: null,
                                Option: imageOptionComponent,
                                MenuList: menuComponent,
                            }}
                        />
                    </div>
                </div>
                {!isNodeDetailsPage && (
                    <span className="flex">
                        {isFullScreen ? (
                            <ExitScreen className="mr-12 cursor fcn-6" onClick={toggleScreenView} />
                        ) : (
                            <FullScreen className="mr-12 cursor fcn-6" onClick={toggleScreenView} />
                        )}
                        <Close className="icon-dim-20 cursor fcn-6 mr-20" onClick={closeTerminalModal} />
                    </span>
                )}
            </div>

            <div className="flex left bcn-0 pl-20 dc__border-top h-28">
                <ul role="tablist" className="tab-list">
                    <li className="tab-list__tab pointer fs-12" onClick={selectTerminalTab}>
                        <div className={`tab-hover mb-4 mt-5 cursor ${selectedTabIndex == 0 ? 'active' : ''}`}>
                            Terminal
                        </div>
                        {selectedTabIndex == 0 && <div className="node-details__active-tab" />}
                    </li>
                    {terminalAccessIdRef.current && connectTerminal && (
                        <li className="tab-list__tab fs-12" onClick={() => selectEventsTab()}>
                            <div className={`tab-hover mb-4 mt-5 cursor ${selectedTabIndex == 1 ? 'active' : ''}`}>
                                Pod Events
                            </div>
                            {selectedTabIndex == 1 && <div className="node-details__active-tab" />}
                        </li>
                    )}
                    {terminalAccessIdRef.current && connectTerminal && (
                        <li className="tab-list__tab fs-12" onClick={selectManifestTab}>
                            <div className={`tab-hover mb-4 mt-5 cursor ${selectedTabIndex == 2 ? 'active' : ''}`}>
                                Pod Manifest
                            </div>
                            {selectedTabIndex == 2 && <div className="node-details__active-tab" />}
                        </li>
                    )}
                </ul>
                <div className={`${selectedTabIndex !== 0 ? 'dc__hide-section' : 'flex'}`}>
                    {connectTerminal && isPodCreated && (
                        <>
                            <span className="bcn-2 mr-8 h-28" style={{ width: '1px' }} />
                            <Tippy
                                className="default-tt cursor"
                                arrow={false}
                                placement="bottom"
                                content={
                                    socketConnection === SocketConnectionType.CONNECTING ||
                                    socketConnection === SocketConnectionType.CONNECTED
                                        ? 'Disconnect from pod'
                                        : 'Reconnect to pod'
                                }
                            >
                                {socketConnection === SocketConnectionType.CONNECTING ||
                                socketConnection === SocketConnectionType.CONNECTED ? (
                                    <span className="mr-8 cursor">
                                        <div
                                            className="icon-dim-12 mt-4 mr-4 mb-4 br-2 bcr-5"
                                            onClick={stopTerminalConnection}
                                        />
                                    </span>
                                ) : (
                                    <span className="mr-8 flex">
                                        <Play className="icon-dim-16 mr-4 cursor" onClick={resumePodConnection} />
                                    </span>
                                )}
                            </Tippy>
                            <Tippy className="default-tt" arrow={false} placement="bottom" content="Clear">
                                <div className="flex">
                                    <Abort
                                        className="icon-dim-16 mr-4 fcn-6 cursor"
                                        onClick={(e) => {
                                            setTerminalCleared(true)
                                        }}
                                    />
                                </div>
                            </Tippy>
                            <span className="bcn-2 ml-8 mr-8" style={{ width: '1px', height: '16px' }} />
                            <div className="cn-6 ml-8 mr-10">Shell </div>
                            <div>
                                <ReactSelect
                                    placeholder="Select Shell"
                                    options={clusterShellTypes}
                                    defaultValue={clusterShellTypes[0]}
                                    onChange={onChangeTerminalType}
                                    styles={clusterSelectStyle}
                                    components={{
                                        IndicatorSeparator: null,
                                        Option,
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div
                className={`cluster-terminal__wrapper ${isFullScreen ? 'full-screen-terminal' : ''} ${
                    isNodeDetailsPage ? 'node-details-full-screen' : ''
                }`}
            >
                <div className={`${selectedTabIndex === 0 ? 'h-100' : 'dc__hide-section'}`}>{terminalContainer()}</div>
                {selectedTabIndex === 1 && (
                    <div className="h-100 dc__overflow-scroll">
                        <ClusterEvents terminalAccessId={terminalAccessIdRef.current} />
                    </div>
                )}
                {selectedTabIndex === 2 && (
                    <div className="h-100">
                        <ClusterManifest terminalAccessId={terminalAccessIdRef.current} />
                    </div>
                )}
            </div>
        </div>
    )
}