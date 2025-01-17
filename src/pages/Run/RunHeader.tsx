import React, { useContext } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Artifact, Run, RunParam } from '../../types';

import StatusField from '../../components/Status';
import { Link, useHistory } from 'react-router-dom';

import { getRunDuration, getRunEndTime, getRunId, getRunStartTime, getTagOfType, getUsername } from '../../utils/run';
import { TimezoneContext } from '../../components/TimezoneProvider';
import TagRow from './components/TagRow';

import Collapsable from '../../components/Collapsable';
import RunParameterTable from './RunParameterTable';
import PluginGroup from '../../components/Plugins/PluginGroup';
import AutoUpdating from '../../components/AutoUpdating';
import DataHeader from '../../components/DataHeader';
import RunWarning from './components/RunWarning';
import useResource from '../../hooks/useResource';

//
// Typedef
//

type Props = {
  run: Run;
};

//
// Component
//

const RunHeader: React.FC<Props> = ({ run }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { timezone } = useContext(TimezoneContext);

  const headerItems = [
    { label: t('fields.run-id'), value: getRunId(run) },
    { label: t('fields.status'), value: <StatusField status={run.status} /> },
    {
      label: t('fields.user'),
      value: <StyledLink to={`/?user=${encodeURIComponent(run.user || 'null')}`}>{getUsername(run)}</StyledLink>,
      hidden: !getUsername(run),
    },
    {
      label: t('fields.project'),
      value: <ProjectField run={run} />,
      hidden: !getTagOfType(run.system_tags, 'project'),
    },
    {
      label: t('fields.language'),
      value: getTagOfType(run.system_tags, 'language'),
      hidden: !getTagOfType(run.system_tags, 'language'),
    },
    { label: t('fields.started-at'), value: getRunStartTime(run, timezone) },
    { label: t('fields.finished-at'), value: getRunEndTime(run, timezone) },
    {
      label: t('fields.duration'),
      value: <AutoUpdating enabled={run.status === 'running'} content={() => getRunDuration(run)} />,
    },
  ];

  const params = useResource<RunParam, RunParam>({
    url: `/flows/${run.flow_id}/runs/${getRunId(run)}/parameters`,
    subscribeToEvents: true,
    initialData: {},
  });

  const dstype = useResource<Artifact[], Artifact>({
    url: `/flows/${run.flow_id}/runs/${getRunId(run)}/artifacts`,
    queryParams: {
      ds_type: 'local',
      _limit: '1',
    },
    subscribeToEvents: true,
    initialData: [],
  });

  return (
    <RunHeaderContainer>
      <DataHeader items={headerItems} wide />
      <RunWarning run={run} usesLocalDataStore={(dstype.data && dstype.data.length > 0) || false} />

      <Collapsable title={t('run.run-details')}>
        <>
          <RunParameterTable params={params} />

          <TagRow label={t('run.tags')} tags={run.tags || []} push={history.push} noTagsMsg={t('run.no-tags')} />

          <TagRow
            label={t('run.system-tags')}
            tags={run.system_tags || []}
            push={history.push}
            noTagsMsg={t('run.no-system-tags')}
          />
          <PluginWrapper>
            <PluginGroup id={getRunId(run)} title="Extensions" slot="run-header" />
          </PluginWrapper>
        </>
      </Collapsable>
    </RunHeaderContainer>
  );
};

const ProjectField: React.FC<{ run: Run }> = ({ run }) => {
  const project = getTagOfType(run.system_tags, 'project');
  const projectBranch = getTagOfType(run.system_tags, 'project_branch');

  if (!project) return null;

  return (
    <div>
      <StyledLink to={`/?_tags=project:${project}`}>{project}</StyledLink>
      {projectBranch && ' / '}
      {projectBranch && (
        <StyledLink
          to={
            project
              ? `/?_tags=project:${project},project_branch:${projectBranch}`
              : `/?_tags=project_branch:${projectBranch}`
          }
        >
          {projectBranch}
        </StyledLink>
      )}
    </div>
  );
};

//
// Style
//

const RunHeaderContainer = styled.div`
  position: relative;
`;

const StyledLink = styled(Link)`
  color: #fff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PluginWrapper = styled.div`
  margin-top: 1rem;
`;

export default RunHeader;
