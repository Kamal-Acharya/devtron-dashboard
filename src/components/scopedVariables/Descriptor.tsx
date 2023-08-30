import React from 'react'
import { TippyCustomized, TippyTheme } from '@devtron-labs/devtron-fe-common-lib'
import { validator } from './utils/helpers'
import { DescriptorI, ReadFileAs } from './types'
import { ReactComponent as ICHelpOutline } from '../../assets/img/ic-help-outline.svg'
import { ReactComponent as QuestionFilled } from '../../assets/icons/ic-help.svg'
import { ReactComponent as ICUpload } from '../../assets/icons/ic-upload-blue.svg'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from './constants'
import ScopedVariablesInput from './ScopedVariablesInput'

const Descriptor = ({ children, showUploadButton, readFile }: DescriptorI) => {
    const handleReUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (readFile) {
            readFile(e.target.files![0], validator, ReadFileAs.TEXT)
        }
    }

    return (
        <>
            <div
                className="descriptor-container pt-16 pb-16 pl-20 pr-20 flex column dc__align-self-stretch bcn-0 dc__content-space dc__align-start"
                style={children ? { padding: '16px 20px 8px 20px', borderBottom: 'none' } : {}}
            >
                <div className="flex dc__gap-8 w-100 dc__content-space">
                    <div className="flex dc__gap-8">
                        <p className="default-view-title-typography">{DEFAULT_TITLE}</p>

                        <TippyCustomized
                            theme={TippyTheme.white}
                            className="w-300 h-100 fcv-5"
                            placement="right"
                            Icon={QuestionFilled}
                            heading={DEFAULT_TITLE}
                            infoText={DEFAULT_DESCRIPTION}
                            showCloseButton={true}
                            trigger="click"
                            interactive={true}
                        >
                            <button className="descriptor-help-button">
                                <ICHelpOutline width={20} height={20} />
                            </button>
                        </TippyCustomized>
                    </div>
                    {showUploadButton && (
                        <button className="descriptor-container__upload-button bcb-5 p-0 flex center">
                            <ScopedVariablesInput handleFileUpload={handleReUpload}>
                                <div className="flex dc__gap-6 center pt-6 pr-10 pb-6 pl-8">
                                    <ICUpload width={14} height={14} className='scn-0'/>
                                    <p>Upload new file to replace</p>
                                </div>
                            </ScopedVariablesInput>
                        </button>
                    )}
                </div>
            </div>
            {children}
        </>
    )
}

export default Descriptor
