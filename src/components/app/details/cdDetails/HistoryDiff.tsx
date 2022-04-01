import React from 'react';
import { Progressing } from '../../../common';
import { DeploymentTemplateHistoryType } from './cd.type';
import './cdDetail.scss';
import DeploymentTemplateHistory from './DeploymentTemplateHistory';

function HistoryDiff({ currentConfiguration, loader, codeEditorLoading, baseTemplateConfiguration }: DeploymentTemplateHistoryType) {

    return (
        <div className="historical-diff__container">
            {loader ? (
                <Progressing pageLoader />
            ) : (
                <div className="historical-diff__right ci-details__body bcn-1">
                    <DeploymentTemplateHistory
                        currentConfiguration={currentConfiguration}
                        baseTemplateConfiguration={baseTemplateConfiguration}
                        codeEditorLoading={codeEditorLoading}
                    />
                </div>
            )}
        </div>
    );
}

export default HistoryDiff;