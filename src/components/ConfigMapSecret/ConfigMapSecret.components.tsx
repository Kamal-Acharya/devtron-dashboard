import React, { useState, useEffect, useRef } from 'react'
import { Progressing, noop, showError, useThrottledEffect } from '@devtron-labs/devtron-fe-common-lib'
import YAML from 'yaml'
import { DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP, PATTERNS } from '../../config'
import arrowTriangle from '../../assets/icons/ic-chevron-down.svg'
import { ReactComponent as ProtectedIcon } from '../../assets/icons/ic-shield-protect-fill.svg'
import { ReactComponent as File } from '../../assets/icons/ic-file.svg'
import { ReactComponent as Add } from '../../assets/icons/ic-add.svg'
import { ReactComponent as Trash } from '../../assets/icons/ic-delete.svg'
import { ReactComponent as WarningIcon } from '../../assets/icons/ic-warning-y6.svg'
import { ReactComponent as InfoIcon } from '../../assets/icons/ic-info-filled.svg'
import { ReactComponent as DeleteIcon } from '../../assets/icons/ic-delete-interactive.svg'
import { ReactComponent as KeyIcon } from '../../assets/icons/ic-key.svg'
import {
    ConfigMapSecretProps,
    KeyValue,
    KeyValueInputInterface,
    KeyValueValidated,
    ResizableTextareaProps,
    KeyValueYaml,
} from './Types'
import { ConfigMapSecretForm } from './ConfigMapSecretForm'
import { CM_SECRET_STATE } from './Constants'
import { importComponentFromFELibrary } from '../common'
import DeploymentHistoryDiffView from '../app/details/cdDetails/deploymentHistoryDiff/DeploymentHistoryDiffView'
import { DeploymentHistoryDetail } from '../app/details/cdDetails/cd.type'
import { prepareHistoryData } from '../app/details/cdDetails/service'
import './ConfigMapSecret.scss'

const ConfigToolbar = importComponentFromFELibrary('ConfigToolbar')
const getDraft = importComponentFromFELibrary('getDraft', null, 'function')
const updateDraftState = importComponentFromFELibrary('updateDraftState', null, 'function')
export const KeyValueInput: React.FC<KeyValueInputInterface> = React.memo(
    ({
        keyLabel,
        valueLabel,
        k,
        v,
        index,
        onChange,
        onDelete,
        keyError = '',
        valueError = '',
        valueType = 'textarea',
        ...rest
    }) => {
        return (
            <article className="form__key-value-inputs">
                {typeof onDelete === 'function' && (
                    <Trash onClick={(e) => onDelete(e, index)} className="cursor icon-delete icon-n4" />
                )}
                <div className="form__field">
                    <label>
                        {keyLabel}
                        <input
                            data-testid={`secrets-gui-key-textbox-${index}`}
                            type="text"
                            autoComplete="off"
                            placeholder=""
                            value={k}
                            onChange={(e) => onChange(index, e.target.value, v)}
                            className="form__input"
                            disabled={typeof onChange !== 'function'}
                        />
                        {keyError ? <span className="form__error">{keyError}</span> : <div />}
                    </label>
                </div>
                <div className="form__field">
                    <label>{valueLabel}</label>
                    {valueType === 'textarea' ? (
                        <ResizableTextarea
                            value={v}
                            onChange={(e) => onChange(index, k, e.target.value)}
                            disabled={typeof onChange !== 'function'}
                            placeholder=""
                            maxHeight={300}
                            data-testid="Configmap-gui-value-textbox"
                        />
                    ) : (
                        <input
                            type="text"
                            autoComplete="off"
                            value={v}
                            onChange={(e) => onChange(index, k, e.target.value)}
                            className="form__input"
                            disabled={typeof onChange !== 'function'}
                        />
                    )}
                    {valueError ? <span className="form__error">{valueError}</span> : <div />}
                </div>
            </article>
        )
    },
)

export function ConfigMapSecretContainer({
    componentType,
    title,
    appChartRef,
    update,
    data,
    index,
    id,
    isOverrideView,
    isJobView,
    isProtected,
}: ConfigMapSecretProps) {
    const [collapsed, toggleCollapse] = useState(true)
    const [isLoader, setLoader] = useState<boolean>(false)
    const [draftData, setDraftData] = useState(null)
    const [selectedTab, setSelectedTab] = useState(draftData?.draftState === 4 ? 2 : 3)

    async function getDraftData() {
        try {
            setLoader(true)
            const { result: draftData } = await getDraft(data.draftId)
            setDraftData(draftData)
            toggleCollapse(false)
        } catch (error) {
            setDraftData('')
            showError(error)
        } finally {
            setLoader(false)
        }
    }
    let cmSecretStateLabel = CM_SECRET_STATE.BASE
    if (isOverrideView) {
        if (data?.global) {
            cmSecretStateLabel = data.overridden ? CM_SECRET_STATE.OVERRIDDEN : CM_SECRET_STATE.INHERITED
        } else {
            cmSecretStateLabel = !data?.isNew ? CM_SECRET_STATE.ENV : CM_SECRET_STATE.UNPUBLISHED
        }
    }

    const updateCollapsed = (): void => {
        //toggleCollapse(!collapsed)
        if (collapsed && getDraft && isProtected && data?.draftId) {
            getDraftData()
        } else {
            toggleCollapse(!collapsed)
        }
    }

    async function discardDraftData() {
        try {
            setLoader(true)
            await updateDraftState(data.draftId, draftData.draftVersionId, 2)
            toggleCollapse(true)
        } catch (error) {
            showError(error)
        } finally {
            setLoader(false)
        }
    }

    const handleDiscardDraft = (): void => {
        discardDraftData()
    }

    const handleTabSelection = (index: number): void => {
        setSelectedTab(index)
    }

    const renderIcon = (): JSX.Element => {
        if (!title) {
            return <Add className="configuration-list__logo icon-dim-20 fcb-5" />
        } else {
            if (componentType === 'secret') {
                return <KeyIcon className="configuration-list__logo icon-dim-20" />
            } else {
                return <File className="configuration-list__logo icon-dim-20" />
            }
        }
    }

    const renderDetails = (): JSX.Element => {
        if (title && isProtected && data.draftId && (data.draftState === 1 || data.draftState === 4)) {
            return (
                <>
                    <ConfigToolbar
                        loading={isLoader}
                        selectedTabIndex={selectedTab}
                        handleTabSelection={handleTabSelection}
                        isDraftMode={draftData?.draftState === 1 || draftData?.draftState === 4}
                        handleDiscardDraft={handleDiscardDraft}
                        noReadme={true}
                        showReadme={false}
                        handleReadMeClick={noop}
                        handleCommentClick={noop}
                        isApprovalPending={draftData?.draftState === 4}
                        approvalUsers={draftData?.approvers}
                        activityHistory={[]}
                    />
                    <ProtectedConfigMapSecretDetails
                        appChartRef={appChartRef}
                        toggleCollapse={toggleCollapse}
                        data={data}
                        id={id}
                        isOverrideView={isOverrideView}
                        componentType={componentType}
                        update={update}
                        index={index}
                        cmSecretStateLabel={cmSecretStateLabel}
                        isJobView={isJobView}
                        selectedTab={selectedTab}
                        draftData={draftData}
                    />
                </>
            )
        }
        return (
            <ConfigMapSecretForm
                appChartRef={appChartRef}
                toggleCollapse={toggleCollapse}
                configMapSecretData={data}
                id={id}
                isOverrideView={isOverrideView}
                componentType={componentType}
                update={update}
                index={index}
                cmSecretStateLabel={cmSecretStateLabel}
                isJobView={isJobView}
                readonlyView={false}
                isProtectedView={isProtected}
                draftMode={false}
            />
        )
    }

    const renderDraftState = (): JSX.Element => {
        if (collapsed) {
            if (data.draftState === 1) {
                return <i className="mr-10 cr-5">In draft</i>
            } else if (data.draftState === 4) {
                return <i className="mr-10 cg-5">Approval pending</i>
            }
        }

        return null
    }

    return (
        <>
            <section className={`pt-20 dc__border bcn-0 br-8 ${title ? 'mb-16' : 'en-3 bw-1 dashed mb-20'}`}>
                <article
                    className="dc__configuration-list pointer pr-16 pl-16 mb-20"
                    onClick={updateCollapsed}
                    data-testid="click-to-add-configmaps-secret"
                >
                    {renderIcon()}
                    <div
                        data-testid={`add-${componentType}-button`}
                        className={`flex left lh-20 ${!title ? 'fw-5 fs-14 cb-5' : 'fw-5 fs-14 cn-9'}`}
                    >
                        {title || `Add ${componentType === 'secret' ? 'Secret' : 'ConfigMap'}`}
                        {cmSecretStateLabel && <div className="flex tag ml-12">{cmSecretStateLabel}</div>}
                    </div>
                    <div className="flex right">
                        {isProtected && title && (
                            <>
                                {renderDraftState()}
                                <ProtectedIcon className="icon-n4 cursor icon-delete" />
                            </>
                        )}
                        {title && isLoader ? (
                            <span style={{ width: '20px' }}>
                                <Progressing />
                            </span>
                        ) : (
                            <img className="configuration-list__arrow pointer h-20" src={arrowTriangle} />
                        )}
                    </div>
                </article>
                {!collapsed && renderDetails()}
            </section>
        </>
    )
}

export function ProtectedConfigMapSecretDetails({
    appChartRef,
    toggleCollapse,
    data,
    id,
    isOverrideView,
    componentType,
    update,
    index,
    cmSecretStateLabel,
    isJobView,
    selectedTab,
    draftData,
}) {
    const [isLoader, setLoader] = useState(false)
    const getData = () => {
        try {
            if (selectedTab === 3) {
                return JSON.parse(draftData.data).configData[0]
            } else if (cmSecretStateLabel === CM_SECRET_STATE.UNPUBLISHED) {
                return null
            } else {
                return data
            }
        } catch (error) {
            return null
        }
    }

    const getCurrentConfig = (): DeploymentHistoryDetail => {
        let currentConfigData = {},
            values = {},
            codeEditorValue = { displayName: 'data', value: '' }
        try {
            currentConfigData = JSON.parse(draftData.data).configData[0]
            values = { ...currentConfigData }
            codeEditorValue.value = JSON.stringify(currentConfigData['data']) ?? ''
            delete values['data']
        } catch (error) {}
        return prepareHistoryData(
            { values, codeEditorValue },
            componentType === 'secret'
                ? DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.SECRET.DISPLAY_NAME
                : DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.CONFIGMAP.DISPLAY_NAME,
        )
    }

    const getBaseConfig = (): DeploymentHistoryDetail => {
        const values = { ...data }
        const codeEditorValue = { displayName: 'data', value: JSON.stringify(data.data ?? data.defaultData) ?? '' }
        delete values['data']
        return prepareHistoryData(
            { values, codeEditorValue },
            componentType === 'secret'
                ? DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.SECRET.DISPLAY_NAME
                : DEPLOYMENT_HISTORY_CONFIGURATION_LIST_MAP.CONFIGMAP.DISPLAY_NAME,
        )
    }

    async function approveDraftData() {
        try {
            setLoader(true)
            await updateDraftState(data.draftId, draftData.draftVersionId, 4)
            toggleCollapse(true)
        } catch (error) {
            showError(error)
        } finally {
            setLoader(false)
        }
    }

    const renderDiffView = (): JSX.Element => {
        return (
            <>
                <DeploymentHistoryDiffView
                    currentConfiguration={getBaseConfig()}
                    baseTemplateConfiguration={getCurrentConfig()}
                    previousConfigAvailable={true}
                />
                {draftData.canApprove && (
                    <div className="dc__align-right pt-16 pr-16 pb-16 pl-16">
                        <button
                            data-testid="approve-config-button"
                            type="button"
                            className="cta"
                            onClick={approveDraftData}
                        >
                            {isLoader ? <Progressing /> : <>Approve changes</>}
                        </button>
                    </div>
                )}
            </>
        )
    }
    const renderForm = (): JSX.Element => {
        return (
            <ConfigMapSecretForm
                appChartRef={appChartRef}
                toggleCollapse={toggleCollapse}
                configMapSecretData={getData()}
                id={id}
                isOverrideView={isOverrideView}
                componentType={componentType}
                update={update}
                index={index}
                cmSecretStateLabel={cmSecretStateLabel}
                isJobView={isJobView}
                readonlyView={selectedTab === 1}
                isProtectedView={true}
                draftMode={selectedTab === 3}
            />
        )
    }

    return selectedTab == 2 ? renderDiffView() : renderForm()
}

export const ResizableTextarea: React.FC<ResizableTextareaProps> = ({
    minHeight,
    maxHeight,
    value,
    onChange = null,
    onBlur = null,
    onFocus = null,
    className = '',
    placeholder = 'Enter your text here..',
    lineHeight = 14,
    padding = 12,
    disabled = false,
    dataTestId,
    ...props
}) => {
    const [text, setText] = useState('')
    const _textRef = useRef(null)

    useEffect(() => {
        setText(value)
    }, [value])

    function handleChange(e) {
        e.persist()
        setText(e.target.value)
        if (typeof onChange === 'function') onChange(e)
    }

    function handleBlur(e) {
        if (typeof onBlur === 'function') onBlur(e)
    }

    function handleFocus(e) {
        if (typeof onFocus === 'function') onFocus(e)
    }

    useThrottledEffect(
        () => {
            _textRef.current.style.height = 'auto'
            let nextHeight = _textRef.current.scrollHeight
            if (minHeight && nextHeight < minHeight) {
                nextHeight = minHeight
            }
            if (maxHeight && nextHeight > maxHeight) {
                nextHeight = maxHeight
            }
            _textRef.current.style.height = nextHeight + 2 + 'px'
        },
        500,
        [text],
    )

    return (
        <textarea
            data-testid={dataTestId}
            ref={(el) => (_textRef.current = el)}
            value={text}
            placeholder={placeholder}
            className={`dc__resizable-textarea ${className}`}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            style={{ lineHeight: `${lineHeight}px`, padding: `${padding}px` }}
            spellCheck={false}
            disabled={disabled}
            {...props}
        />
    )
}

export function validateKeyValuePair(arr: KeyValue[]): KeyValueValidated {
    let isValid = true
    arr = arr.reduce((agg, { k, v }) => {
        if (!k && typeof v !== 'string') {
            // filter when both are missing
            return agg
        }
        let keyError: string
        let valueError: string
        if (k && typeof v !== 'string') {
            valueError = 'value must not be empty'
            isValid = false
        }
        if (typeof v === 'string' && !PATTERNS.CONFIG_MAP_AND_SECRET_KEY.test(k)) {
            keyError = `Key '${k}' must consist of alphanumeric characters, '.', '-' and '_'`
            isValid = false
        }
        return [...agg, { k, v, keyError, valueError }]
    }, [])
    return { isValid, arr }
}

export function useKeyValueYaml(keyValueArray, setKeyValueArray, keyPattern, keyError): KeyValueYaml {
    //input containing array of [{k, v, keyError, valueError}]
    //return {yaml, handleYamlChange}
    const [yaml, setYaml] = useState('')
    const [error, setError] = useState('')
    useEffect(() => {
        if (!Array.isArray(keyValueArray)) {
            setYaml('')
            setError('')
            return
        }
        setYaml(
            YAML.stringify(
                keyValueArray.reduce((agg, { k, v }) => ({ ...agg, [k]: v }), {}),
                { indent: 2 },
            ),
        )
    }, [keyValueArray])

    function handleYamlChange(yamlConfig) {
        if (!yamlConfig) {
            setKeyValueArray([])
            return
        }
        try {
            let obj = YAML.parse(yamlConfig)
            if (typeof obj !== 'object') {
                setError('Could not parse to valid YAML')
                return null
            }
            let errorneousKeys = []
            let tempArray = Object.keys(obj).reduce((agg, k) => {
                if (!k && !obj[k]) return agg
                let v =
                    obj[k] && ['object', 'number'].includes(typeof obj[k])
                        ? YAML.stringify(obj[k], { indent: 2 })
                        : obj[k]
                let keyErr: string
                if (k && keyPattern.test(k)) {
                    keyErr = ''
                } else {
                    keyErr = keyError
                    errorneousKeys.push(k)
                }
                return [...agg, { k, v: v ?? '', keyError: keyErr, valueError: '' }]
            }, [])
            setKeyValueArray(tempArray)
            let error = ''
            if (errorneousKeys.length > 0) {
                error = `Keys can contain: (Alphanumeric) (-) (_) (.) > Errors: ${errorneousKeys
                    .map((e) => `"${e}"`)
                    .join(', ')}`
            }
            setError(error)
        } catch (err) {
            setError('Could not parse to valid YAML')
        }
    }

    return { yaml, handleYamlChange, error }
}

export function Override({ overridden, onClick, loading = false, type, readonlyView }) {
    const renderButtonContent = (): JSX.Element => {
        if (loading) {
            return <Progressing />
        } else if (overridden) {
            return (
                <>
                    <DeleteIcon className="icon-dim-16 mr-8" />
                    <span>Delete override</span>
                </>
            )
        } else {
            return <>Allow override</>
        }
    }
    return (
        <div className={`override-container ${overridden ? 'override-warning' : ''}`}>
            {overridden ? <WarningIcon className="icon-dim-20" /> : <InfoIcon className="icon-dim-20" />}
            <div className="flex column left">
                <div className="override-title" data-testid="env-override-title">
                    {overridden ? 'Base configurations are overridden' : 'Inheriting base configurations'}
                </div>
                {!readonlyView && (
                    <div className="override-subtitle" data-testid="env-override-subtitle">
                        {overridden
                            ? 'Deleting will discard the current overrides and base configuration will be applicable to this environment.'
                            : `Overriding will fork the ${type} for this environment. Updating the base values will no longer affect this configuration.`}
                    </div>
                )}
            </div>
            {!readonlyView && (
                <button
                    data-testid={`button-override-${overridden ? 'delete' : 'allow'}`}
                    className={`cta override-button ${overridden ? 'delete scr-5' : 'ghosted'}`}
                    onClick={onClick}
                >
                    {renderButtonContent()}
                </button>
            )}
        </div>
    )
}
