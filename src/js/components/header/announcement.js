import React from 'react';
import Linkify from 'react-linkify';

import { Announcement as AnnounceIcon, Close as CloseIcon } from '@mui/icons-material';

const Announcement = ({ announcement, errorIconClassName, iconClassName, onHide, sectionClassName }) => (
  <div className={`flexbox centered fadeInSlow margin-left-small margin-right-small ${sectionClassName}`}>
    <AnnounceIcon className={errorIconClassName} fontSize="small" style={{ marginRight: 4, minWidth: 24 }} />
    <p>
      <Linkify properties={{ target: '_blank' }}>{announcement}</Linkify>
    </p>
    <CloseIcon className={iconClassName} style={{ marginLeft: 4, cursor: 'pointer' }} onClick={onHide} />
  </div>
);

export default Announcement;
