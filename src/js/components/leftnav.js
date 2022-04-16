import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';
import copy from 'copy-to-clipboard';

// material ui
import { List, ListItem, ListItemText, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { getLatestReleaseInfo, setSnackbar, setVersionInfo } from '../actions/appActions';

import { onboardingSteps } from '../constants/onboardingConstants';
import { getDocsVersion, getFeatures, getIsEnterprise, getOnboardingState, getUserRoles } from '../selectors';
import { getOnboardingComponentFor } from '../utils/onboardingmanager';

const listItems = [
  { route: '/', text: 'Dashboard', isAdmin: false, isEnterprise: false },
  { route: '/devices', text: 'Devices', isAdmin: false, isEnterprise: false },
  { route: '/releases', text: 'Releases', isAdmin: false, isEnterprise: false },
  { route: '/deployments', text: 'Deployments', isAdmin: false, isEnterprise: false },
  { route: '/auditlog', text: 'Audit log', isAdmin: true, isEnterprise: true }
];

const useStyles = makeStyles()(theme => ({
  licenseLink: { fontSize: '13px', position: 'relative', top: '6px', color: theme.palette.primary.main },
  infoList: { padding: 0, position: 'absolute', bottom: 30, left: 0, right: 0 },
  list: {
    backgroundColor: theme.palette.grey[400],
    borderRight: `1px solid ${theme.palette.grey[300]}`
  },
  listItem: { padding: '16px 16px 16px 42px' }
}));

const VersionInfo = ({ getLatestReleaseInfo, isHosted, setSnackbar, setVersionInfo, versionInformation }) => {
  const [clicks, setClicks] = useState(0);
  const timer = useRef();

  useEffect(() => {
    getLatestReleaseInfo();
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const onVersionClick = () => {
    copy(JSON.stringify(versionInformation));
    setSnackbar('Version information copied to clipboard');
  };

  const versions = (
    <ul className="unstyled" style={{ minWidth: 120 }}>
      {Object.entries(versionInformation).reduce((accu, [key, version]) => {
        if (version) {
          accu.push(
            <li key={key} className="flexbox space-between">
              <div>{key}</div>
              <div>{version}</div>
            </li>
          );
        }
        return accu;
      }, [])}
    </ul>
  );

  const onClick = () => {
    setClicks(clicks + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setClicks(0);
    }, 3000);
    if (clicks > 5) {
      setVersionInfo({ Integration: 'next' });
    }
    onVersionClick();
  };

  let title = versionInformation.Integration ? `Version: ${versionInformation.Integration}` : '';
  if (isHosted && versionInformation.Integration !== 'next') {
    title = 'latest';
  }
  return (
    <Tooltip title={versions} placement="top">
      <div className="clickable slightly-smaller" onClick={onClick}>
        {title}
      </div>
    </Tooltip>
  );
};

export const LeftNav = ({
  docsVersion,
  getLatestReleaseInfo,
  isHosted,
  isAdmin,
  isEnterprise,
  onboardingState,
  setSnackbar,
  setVersionInfo,
  versionInformation
}) => {
  const releasesRef = useRef();
  const { classes } = useStyles();

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

  let onboardingComponent;
  if (releasesRef.current) {
    onboardingComponent = getOnboardingComponentFor(onboardingSteps.APPLICATION_UPDATE_REMINDER_TIP, onboardingState, {
      anchor: {
        left: releasesRef.current.offsetWidth - 48,
        top: releasesRef.current.offsetTop + releasesRef.current.offsetHeight / 2
      },
      place: 'right'
    });
  }
  return (
    <div className={`leftFixed leftNav ${classes.list}`}>
      <List style={{ padding: 0 }}>
        {listItems.reduce((accu, item, index) => {
          if ((item.isEnterprise && !isEnterprise) || (item.isAdmin && !isAdmin)) {
            return accu;
          }
          accu.push(
            <ListItem
              className="navLink leftNav"
              component={NavLink}
              exact={item.route === '/'}
              key={index}
              style={{ padding: '22px 16px 22px 42px' }}
              ref={item.route === '/releases' ? releasesRef : null}
              to={item.route}
            >
              <ListItemText primary={item.text} style={{ textTransform: 'uppercase' }} />
            </ListItem>
          );
          return accu;
        }, [])}
      </List>
      {onboardingComponent ? onboardingComponent : null}
      <List className={classes.infoList}>
        <ListItem className={`navLink leftNav ${classes.listItem}`} component={Link} to="/help">
          <ListItemText primary="Help & support" />
        </ListItem>
        <ListItem className={classes.listItem}>
          <ListItemText
            primary={
              <VersionInfo
                getLatestReleaseInfo={getLatestReleaseInfo}
                isHosted={isHosted}
                setSnackbar={setSnackbar}
                setVersionInfo={setVersionInfo}
                versionInformation={versionInformation}
              />
            }
            secondary={licenseLink}
          />
        </ListItem>
      </List>
    </div>
  );
};

const actionCreators = { getLatestReleaseInfo, setSnackbar, setVersionInfo };

const mapStateToProps = state => {
  const { isHosted } = getFeatures(state);
  return {
    docsVersion: getDocsVersion(state),
    isAdmin: getUserRoles(state).isAdmin,
    isEnterprise: getIsEnterprise(state),
    isHosted,
    onboardingState: getOnboardingState(state),
    versionInformation: state.app.versionInformation
  };
};

export default connect(mapStateToProps, actionCreators)(LeftNav);
