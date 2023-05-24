import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';

// material ui
import { List, ListItem, ListItemText, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import copy from 'copy-to-clipboard';

import { setSnackbar, setVersionInfo } from '../actions/appActions';
import { TIMEOUTS } from '../constants/appConstants';
import { getDocsVersion, getFeatures, getTenantCapabilities, getUserCapabilities } from '../selectors';

const listItems = [
  { route: '/', text: 'Devices', canAccess: ({ userCapabilities: { canReadDevices } }) => canReadDevices },
  {
    route: '/auditlog',
    text: 'Audit log',
    canAccess: ({ tenantCapabilities: { hasAuditlogs }, userCapabilities: { canAuditlog } }) => hasAuditlogs && canAuditlog
  }
];

const useStyles = makeStyles()(theme => ({
  licenseLink: { fontSize: '13px', position: 'relative', top: '6px', color: theme.palette.primary.main },
  infoList: { padding: 0, position: 'absolute', bottom: 30, left: 0, right: 0 },
  list: {
    backgroundColor: theme.palette.background.lightgrey,
    borderRight: `1px solid ${theme.palette.grey[300]}`
  },
  navLink: { padding: '22px 16px 22px 42px' },
  listItem: { padding: '16px 16px 16px 42px' },
  versions: { display: 'grid', gridTemplateColumns: 'max-content 60px', columnGap: theme.spacing(), '>a': { color: theme.palette.grey[100] } }
}));

const linkables = {
  'Integration': 'integration',
  'Mender-Client': 'mender',
  'Mender-Artifact': 'mender-artifact',
  'GUI': 'gui'
};

const VersionInfo = ({ isHosted, setSnackbar, setVersionInfo, versionInformation }) => {
  const [clicks, setClicks] = useState(0);
  const timer = useRef();
  const { classes } = useStyles();

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const onVersionClick = () => {
    copy(JSON.stringify(versionInformation));
    setSnackbar('Version information copied to clipboard');
  };

  const versions = (
    <div className={classes.versions}>
      {Object.entries(versionInformation).reduce((accu, [key, version]) => {
        if (version) {
          accu.push(
            <React.Fragment key={key}>
              {linkables[key] ? (
                <a href={`https://github.com/mendersoftware/${linkables[key]}/tree/${version}`} target="_blank" rel="noopener noreferrer">
                  {key}
                </a>
              ) : (
                <div>{key}</div>
              )}
              <div className="align-right text-overflow" title={version}>
                {version}
              </div>
            </React.Fragment>
          );
        }
        return accu;
      }, [])}
    </div>
  );

  const onClick = () => {
    setClicks(clicks + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setClicks(0);
    }, TIMEOUTS.threeSeconds);
    if (clicks > 5) {
      setVersionInfo({ Integration: 'next' });
    }
    onVersionClick();
  };

  let title = versionInformation.Integration ? `Version: ${versionInformation.Integration}` : '';
  if (isHosted && versionInformation.Integration !== 'next') {
    title = 'Version: latest';
  }
  return (
    <Tooltip title={versions} placement="top">
      <div className="clickable slightly-smaller" onClick={onClick}>
        {title}
      </div>
    </Tooltip>
  );
};

export const LeftNav = ({ docsVersion, isHosted, setSnackbar, setVersionInfo, tenantCapabilities, userCapabilities, versionInformation }) => {
  const releasesRef = useRef();
  const { classes } = useStyles();

  // eslint-disable-next-line no-unused-vars
  const { latestRelease, ...versionInfo } = versionInformation;

  const licenseLink = (
    <a
      className={classes.licenseLink}
      href={`https://docs.mender.io/${docsVersion}release-information/open-source-licenses`}
      rel="noopener noreferrer"
      target="_blank"
    >
      License information
    </a>
  );

  return (
    <div className={`leftFixed leftNav ${classes.list}`}>
      <List style={{ padding: 0 }}>
        {listItems.reduce((accu, item, index) => {
          if (!item.canAccess({ tenantCapabilities, userCapabilities })) {
            return accu;
          }
          accu.push(
            <ListItem
              className={`navLink leftNav ${classes.navLink}`}
              component={NavLink}
              end={item.route === '/'}
              key={index}
              ref={item.route === '/releases' ? releasesRef : null}
              to={item.route}
            >
              <ListItemText primary={item.text} style={{ textTransform: 'uppercase' }} />
            </ListItem>
          );
          return accu;
        }, [])}
      </List>
      <List className={classes.infoList}>
        <ListItem className={`navLink leftNav ${classes.listItem}`} component={Link} to="/help">
          <ListItemText primary="Help & support" />
        </ListItem>
        <ListItem className={classes.listItem}>
          <ListItemText
            primary={<VersionInfo isHosted={isHosted} setSnackbar={setSnackbar} setVersionInfo={setVersionInfo} versionInformation={versionInfo} />}
            secondary={licenseLink}
          />
        </ListItem>
      </List>
    </div>
  );
};

const actionCreators = { setSnackbar, setVersionInfo };

const mapStateToProps = state => {
  const { isHosted } = getFeatures(state);
  return {
    docsVersion: getDocsVersion(state),
    isHosted,
    userCapabilities: getUserCapabilities(state),
    tenantCapabilities: getTenantCapabilities(state),
    versionInformation: state.app.versionInformation
  };
};

export default connect(mapStateToProps, actionCreators)(LeftNav);
