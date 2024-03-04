import React, { useEffect } from 'react'
import {
    ClearIndicator,
    multiSelectStyles,
    MultiValueChipContainer,
    MultiValueRemove,
    Option,
} from '@devtron-labs/devtron-fe-common-lib'
import Select from 'react-select'
import { mapByKey } from '../../../../components/common'
import AppPermissions from '../shared/components/AppPermissions'
import { OptionType } from '../../../../components/app/types'
import {
    ChartGroupPermissionsFilter,
    DirectPermissionsRoleFilter,
    K8sPermissionFilter,
} from '../shared/components/userGroups/userGroups.types'
import { useAuthorizationContext } from '../AuthorizationProvider'
import { User } from '../types'

const GroupPermission = ({
    userData,
    userGroups,
    setUserGroups,
    directPermission,
    setDirectPermission,
    chartPermission,
    setChartPermission,
    k8sPermission,
    setK8sPermission,
}: {
    userData: User
    userGroups: OptionType[]
    setUserGroups: React.Dispatch<React.SetStateAction<OptionType[]>>
    directPermission: DirectPermissionsRoleFilter[]
    setDirectPermission: React.Dispatch<React.SetStateAction<DirectPermissionsRoleFilter[]>>
    chartPermission: ChartGroupPermissionsFilter
    setChartPermission: React.Dispatch<React.SetStateAction<ChartGroupPermissionsFilter>>
    k8sPermission: K8sPermissionFilter[]
    setK8sPermission: React.Dispatch<React.SetStateAction<K8sPermissionFilter[]>>
}) => {
    const { userGroupsList } = useAuthorizationContext()
    const userGroupsMap = mapByKey(userGroupsList, 'name')
    const availableGroups = userGroupsList?.map((group) => ({ value: group.name, label: group.name }))

    function populateDataFromAPI(data: User) {
        const { groups } = data
        setUserGroups(groups?.map((group) => ({ label: group, value: group })) || [])
    }

    useEffect(() => {
        if (userData) {
            populateDataFromAPI(userData)
        }
    }, [userData])

    const formatChartGroupOptionLabel = ({ value, label }) => (
        <div className="flex left column">
            <span>{label}</span>
            <small>{userGroupsMap.has(value) ? userGroupsMap.get(value).description : ''}</small>
        </div>
    )

    return (
        <>
            <div>
                <div className="cn-9 fs-13 fw-4 mb-6">Group permissions</div>
                <Select
                    placeholder="Select permission groups"
                    value={userGroups}
                    components={{
                        IndicatorSeparator: () => null,
                        MultiValueContainer: ({ ...props }) => <MultiValueChipContainer {...props} validator={null} />,
                        ClearIndicator,
                        MultiValueRemove,
                        Option,
                    }}
                    styles={{
                        ...multiSelectStyles,
                        dropdownIndicator: (base, state) => ({
                            ...base,
                            transition: 'all .2s ease',
                            transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }),
                        multiValue: (base) => ({
                            ...base,
                            border: `1px solid var(--N200)`,
                            borderRadius: `4px`,
                            background: 'white',
                            height: '30px',
                            margin: '0 8px 0 0',
                            padding: '1px',
                        }),
                    }}
                    formatOptionLabel={formatChartGroupOptionLabel}
                    closeMenuOnSelect={false}
                    isMulti
                    name="groups"
                    options={availableGroups}
                    hideSelectedOptions={false}
                    onChange={(selected) => setUserGroups((selected || []) as OptionType[])}
                    className="basic-multi-select"
                    classNamePrefix="group-permission-dropdown"
                />
            </div>
            <AppPermissions
                data={userData}
                directPermission={directPermission}
                setDirectPermission={setDirectPermission}
                chartPermission={chartPermission}
                setChartPermission={setChartPermission}
                hideInfoLegend
                k8sPermission={k8sPermission}
                setK8sPermission={setK8sPermission}
            />
        </>
    )
}

export default GroupPermission