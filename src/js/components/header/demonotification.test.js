import React from 'react';
import DemoNotification from './demonotification';
import { undefineds } from '../../../../tests/mockData';
import { render } from '../../../../tests/setupTests';

describe('DemoNotification Component', () => {
  it('renders correctly', async () => {
    const { baseElement } = render(<DemoNotification />);
    const view = baseElement.firstChild.firstChild;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });
});
