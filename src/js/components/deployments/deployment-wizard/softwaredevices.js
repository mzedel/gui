import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import pluralize from 'pluralize';

import { TextField, Tooltip } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { ErrorOutline as ErrorOutlineIcon, InfoOutlined as InfoOutlinedIcon } from '@material-ui/icons';

import { onboardingSteps } from '../../../constants/onboardingConstants';
import { getOnboardingComponentFor } from '../../../utils/onboardingmanager';
import { allDevices } from '../createdeployment';
import theme from '../../../themes/mender-theme';

export const styles = {
  infoStyle: {
    minWidth: 400,
    borderBottom: 'none'
  },
  selection: { minWidth: 'min-content', maxWidth: theme.spacing(50), minHeight: 105 },
  selectionTitle: {
    marginBottom: 0
  },
  textField: {
    minWidth: 400
  }
};

export const SoftwareDevices = ({
  acceptedDeviceCount,
  advanceOnboarding,
  createdGroup,
  deploymentAnchor,
  deploymentObject = {},
  groups,
  hasDevices,
  hasDynamicGroups,
  hasPending,
  onboardingState,
  releases,
  selectedDevice,
  selectedGroup,
  selectedRelease,
  setDeploymentSettings
}) => {
  // eslint-disable-next-line no-unused-vars
  const [size, setSize] = useState({ height: window.innerHeight, width: window.innerWidth });
  const groupRef = useRef();
  const releaseRef = useRef();

  const deploymentSettingsUpdate = (value, property) => {
    const state = { ...deploymentObject, [property]: value };
    let deviceIds = (state.deploymentDeviceIds = []);
    let deviceCount = state.deploymentDeviceCount;
    if ((state.device || state.group) && state.release) {
      deviceIds = [];
      deviceCount = deviceIds.length;
      if (state.device) {
        deviceIds = [state.device.id];
        deviceCount = deviceIds.length;
      } else if (state.group !== allDevices) {
        deviceCount = groups[state.group].total;
      } else {
        deviceCount = acceptedDeviceCount;
      }
      advanceOnboarding(onboardingSteps.SCHEDULING_GROUP_SELECTION);
    }
    setDeploymentSettings({ ...deploymentObject, [property]: value, deploymentDeviceIds: deviceIds, deploymentDeviceCount: deviceCount });
  };

  const handleResize = () => setTimeout(() => setSize({ height: window.innerHeight, width: window.innerWidth }), 500);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { deploymentDeviceCount, deploymentDeviceIds = [], device, group = null, release: deploymentRelease = null } = deploymentObject;
  const releaseDeviceTypes = deploymentRelease ? deploymentRelease.device_types_compatible : [];
  const devicetypesInfo = (
    <Tooltip title={<p>{releaseDeviceTypes.join(', ')}</p>} placement="bottom">
      <span className="link">
        {releaseDeviceTypes.length} device {pluralize('types', releaseDeviceTypes.length)}
      </span>
    </Tooltip>
  );

  const groupItems = [allDevices, ...Object.keys(groups)];
  let releaseItems = releases;
  let groupLink = '/devices';
  if (device && device.attributes) {
    // If single device, don't show incompatible releases
    releaseItems = releaseItems.filter(rel => rel.device_types_compatible.some(type => type === device.attributes.device_type));
    groupLink = `${groupLink}?id=${device.id}`;
  } else {
    groupLink = group && group !== allDevices ? `${groupLink}?group=${group}` : groupLink;
  }

  let onboardingComponent = null;
  if (releaseRef.current && groupRef.current && deploymentAnchor) {
    const anchor = { top: releaseRef.current.offsetTop + (releaseRef.current.offsetHeight / 3) * 2, left: releaseRef.current.offsetWidth / 2 };
    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.SCHEDULING_ARTIFACT_SELECTION,
      { ...onboardingState, selectedRelease: deploymentRelease },
      { anchor, place: 'right' }
    );
    const groupAnchor = { top: groupRef.current.offsetTop + (groupRef.current.offsetHeight / 3) * 2, left: groupRef.current.offsetWidth };
    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.SCHEDULING_ALL_DEVICES_SELECTION,
      onboardingState,
      { anchor: groupAnchor, place: 'right' },
      onboardingComponent
    );
    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.SCHEDULING_GROUP_SELECTION,
      { ...onboardingState, createdGroup },
      { anchor: groupAnchor, place: 'right' },
      onboardingComponent
    );
    if (hasDevices && deploymentDeviceCount && deploymentRelease) {
      const buttonAnchor = {
        top: deploymentAnchor.offsetTop - deploymentAnchor.offsetHeight,
        left: deploymentAnchor.offsetLeft + deploymentAnchor.offsetWidth / 2
      };
      onboardingComponent = getOnboardingComponentFor(
        onboardingSteps.SCHEDULING_RELEASE_TO_DEVICES,
        { ...onboardingState, selectedDevice, selectedGroup, selectedRelease: deploymentRelease },
        { anchor: buttonAnchor, place: 'bottom' },
        onboardingComponent
      );
    }
  }
  return (
    <div style={{ overflow: 'visible', minHeight: '300px', marginTop: '15px' }}>
      {!releaseItems.length ? (
        <p className="info" style={{ marginTop: '0' }}>
          <ErrorOutlineIcon style={{ marginRight: '4px', fontSize: '18px', top: '4px', color: 'rgb(171, 16, 0)' }} />
          There are no {releases.length ? 'compatible ' : ''}artifacts available. <Link to="/artifacts">Upload one to the repository</Link> to get started.
        </p>
      ) : (
        <form className="flexbox column margin margin-top-none">
          <h4 style={styles.selectionTitle}>Select a device group to target</h4>
          <div ref={groupRef} style={styles.selection}>
            {device ? (
              <TextField value={device.id} label="Device" disabled={true} style={styles.infoStyle} />
            ) : (
              <div>
                <Autocomplete
                  id="deployment-device-group-selection"
                  autoSelect
                  autoHighlight
                  filterSelectedOptions
                  handleHomeEndKeys
                  disabled={!(hasDevices || hasDynamicGroups)}
                  options={groupItems}
                  onChange={(e, item) => deploymentSettingsUpdate(item, 'group')}
                  renderInput={params => (
                    <TextField {...params} placeholder="Select a device group" InputProps={{ ...params.InputProps }} style={styles.textField} />
                  )}
                  value={group}
                />
                {!(hasDevices || hasDynamicGroups) && (
                  <p className="info" style={{ marginTop: '10px' }}>
                    <ErrorOutlineIcon style={{ marginRight: '4px', fontSize: '18px', top: '4px', color: 'rgb(171, 16, 0)', position: 'relative' }} />
                    There are no connected devices.{' '}
                    {hasPending ? (
                      <span>
                        <Link to="/devices/pending">Accept pending devices</Link> to get started.
                      </span>
                    ) : (
                      <span>
                        <Link to="/help/get-started">Read the help pages</Link> for help with connecting devices.
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
            {(deploymentDeviceIds.length > 0 || group) && (
              <p className="info">
                {group ? (
                  <>All devices{group !== allDevices ? ' in this group' : null}</>
                ) : (
                  <>
                    {deploymentDeviceIds.length} {pluralize('devices', deploymentDeviceIds.length)}
                  </>
                )}{' '}
                will be targeted. <Link to={groupLink}>View the {pluralize('devices', group === allDevices ? 2 : deploymentDeviceIds.length)}</Link>
              </p>
            )}
            {onboardingComponent}
          </div>
          <h4 style={styles.selectionTitle}>Select a Release to deploy</h4>
          <div ref={releaseRef} style={styles.selection}>
            {selectedRelease ? (
              <TextField value={selectedRelease} label="Release" disabled={true} style={styles.infoStyle} />
            ) : (
              <Autocomplete
                id="deployment-release-selection"
                autoSelect
                autoHighlight
                filterSelectedOptions
                getOptionLabel={option => (typeof option === 'string' ? option : option.Name)}
                handleHomeEndKeys
                options={releaseItems}
                onChange={(e, item) => deploymentSettingsUpdate(item, 'release')}
                renderInput={params => <TextField {...params} placeholder="Select a Release" InputProps={{ ...params.InputProps }} style={styles.textField} />}
                value={deploymentRelease}
              />
            )}
            {releaseDeviceTypes.length ? (
              <p className="info" style={{ marginBottom: 0 }}>
                This Release is compatible with {devicetypesInfo}.
              </p>
            ) : null}
          </div>
          <p className="info icon">
            <InfoOutlinedIcon fontSize="small" style={{ verticalAlign: 'middle', margin: '0 6px 4px 0' }} />
            The deployment will skip any devices in the group that are already on the target Release version, or that have an incompatible device type.
          </p>
        </form>
      )}
    </div>
  );
};

export default SoftwareDevices;
