import React from 'react'
import { useHistory } from 'react-router-dom'
import { useMainContext } from '@devtron-labs/devtron-fe-common-lib'
import { ClusterMetaDataBarProps } from './types'
import { URLS } from '../../../config'
import { K8S_EMPTY_GROUP } from '../../ResourceBrowser/Constants'
import { AppDetailsTabs } from '../../v2/appDetails/appDetails.store'
import { ReactComponent as ArrowLeft } from '../../../assets/icons/ic-arrow-left.svg'
import { ReactComponent as AllResourcesIcon } from '../../../assets/icons/ic-resource.svg'
import { ReactComponent as TerminalIcon } from '../../../assets/icons/ic-terminal-fill.svg'
import './ClusterMetaData.scss'

export const ClusterMetaDataBar = ({ clusterName, namespace, clusterId }: ClusterMetaDataBarProps) => {
    const { isSuperAdmin } = useMainContext()
    const history = useHistory()
    const darkTheme =
        history.location.pathname.includes('manifest') ||
        history.location.pathname.includes('events') ||
        history.location.pathname.includes('terminal') ||
        history.location.pathname.includes('logs') ||
        history.location.pathname.includes('log-analyzer')

    const renderNavigationToAllResources = () => {
        const navigateToAllResources = () => {
            history.push(`${URLS.RESOURCE_BROWSER}/${clusterId}/${namespace}/pod/${K8S_EMPTY_GROUP}`)
        }
        return (
            <div
                className={` ${darkTheme ? 'fcn-0' : ''} fw-6 flex left dc__gap-6 cursor`}
                onClick={navigateToAllResources}
            >
                <AllResourcesIcon />
                All resources in cluster
            </div>
        )
    }

    const renderNavigationToAClusterTerminal = () => {
        const navigateToAClusterTerminal = () => {
            history.push(
                `${URLS.RESOURCE_BROWSER}/${clusterId}/${namespace}/${AppDetailsTabs.terminal}/${K8S_EMPTY_GROUP}`,
            )
        }
        return (
            <div
                className={` ${darkTheme ? 'fcn-0' : 'fcn-9'} w-6 flex left dc__gap-6 cursor`}
                onClick={navigateToAClusterTerminal}
            >
                <TerminalIcon className="icon-dim-16" />
                Cluster terminal
            </div>
        )
    }

    if (!isSuperAdmin) {
        return null
    }
    return (
        <div
            className={`cluster-meta-data-wrapper ${darkTheme ? 'dark-theme cn-0' : 'cn-9 bcn-0'} flex left dc__position-fixed dc__bottom-0 pl-16 w-100 fs-12 dc__border-top dc__gap-6 pt-4 pb-4 lh-20 cn-9`}
        >
            <span className="dc__opacity-0_8"> Cluster: {clusterName}</span>
            <div className="dc__border-left h-12 dc__opacity-0_2" />
            <span className="pl-6 dc__opacity-0_8">Namespace: {namespace}</span>
            <ArrowLeft
                className={`${darkTheme ? 'fcn-0 dc__opacity-0_5' : ''} rotate dc__gap-6 icon-dim-16 flex`}
                style={{ ['--rotateBy' as string]: '180deg' }}
            />
            {renderNavigationToAllResources()}
            <div className="dc__border-left h-12 dc__opacity-0_2" />
            {renderNavigationToAClusterTerminal()}
        </div>
    )
}
