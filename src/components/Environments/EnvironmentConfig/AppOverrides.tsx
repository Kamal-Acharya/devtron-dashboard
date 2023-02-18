import React, { Suspense } from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import { ErrorBoundary, Progressing } from '../../common'
import EnvironmentOverride from '../../EnvironmentOverride/EnvironmentOverride'
import { ConfigAppList } from '../EnvironmentGroup.types'

export default function AppOverrides({
    appList,
    environments,
    setEnvironments,
}: {
    appList?: ConfigAppList[]
    environments: any
    setEnvironments: any
}) {
    const { path, url } = useRouteMatch()
    return (
        <ErrorBoundary>
            <Suspense fallback={<Progressing pageLoader />}>
                <Switch>
                    <Route path={`${path}/:appId(\\d+)?`}>
                        <EnvironmentOverride environments={environments} setEnvironments={setEnvironments} />
                    </Route>
                </Switch>
            </Suspense>
        </ErrorBoundary>
    )
}
