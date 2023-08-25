import React from 'react'
import ReactSelect from 'react-select'
import { DOCUMENTATION } from '../../../config'
import { appSelectorStyle, DropdownIndicator } from '../../AppSelector/AppSelectorUtil'
import { ERROR_SCREEN_LEARN_MORE, ERROR_SCREEN_SUBTITLE } from '../Constants'
import { ClusterOptionType } from '../Types'

interface ClusterSelectorType {
    onChange: ({ label, value }) => void
    clusterList: ClusterOptionType[]
    clusterId: string
}

export default function ClusterSelector({ onChange, clusterList, clusterId }: ClusterSelectorType) {
    const defaultOption = clusterList.find((item) => item.value == clusterId)

    return (
        <ReactSelect
            classNamePrefix="cluster-select-header"
            options={clusterList}
            onChange={onChange}
            components={{
                IndicatorSeparator: null,
                DropdownIndicator,
                LoadingIndicator: null,
            }}
            value={defaultOption}
            styles={appSelectorStyle}
        />
    )
}

export const unauthorizedInfoText = () => {
    return (
        <>
            {ERROR_SCREEN_SUBTITLE}&nbsp;
            <a
                className="dc__link"
                href={DOCUMENTATION.K8S_RESOURCES_PERMISSIONS}
                target="_blank"
                rel="noreferrer noopener"
            >
                {ERROR_SCREEN_LEARN_MORE}
            </a>
        </>
    )
}