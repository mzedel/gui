import React from 'react';
import { Provider } from 'react-redux';

import { act, screen, waitFor } from '@testing-library/react';
import 'jsdom-worker';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Cookies from 'universal-cookie';

import { defaultState, mockDate, token, undefineds } from '../../../tests/mockData';
import { render } from '../../../tests/setupTests';
import { getConfiguredStore } from '../reducers';
import App, { timeout } from './app';

jest.mock('../tracking');

const mockStore = configureStore([thunk]);

const state = {
  ...defaultState,
  app: {
    ...defaultState.app,
    trackerCode: 'testtracker',
    versionInformation: {
      Integration: 'next'
    }
  },
  deployments: {
    ...defaultState.deployments,
    byId: {},
    byStatus: {
      ...defaultState.deployments.byStatus,
      inprogress: {
        ...defaultState.deployments.byStatus.inprogress,
        total: 0
      }
    },
    deploymentDeviceLimit: null
  },
  users: {
    ...defaultState.users,
    currentUser: null
  }
};

describe('App Component', () => {
  let cookies;
  beforeEach(() => {
    cookies = new Cookies();
    cookies.get.mockReturnValue('omnomnom');
  });
  it('renders correctly', async () => {
    const store = mockStore(state);

    window.localStorage.getItem.mockReturnValueOnce('false');
    const { baseElement } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    const view = baseElement;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });

  it('works as intended', async () => {
    const store = getConfiguredStore({
      preloadedState: {
        ...state,
        users: {
          ...state.users,
          currentUser: 'notNull'
        }
      }
    });
    window.localStorage.getItem.mockReturnValueOnce('false');
    const ui = (
      <Provider store={store}>
        <App />
      </Provider>
    );
    const { rerender } = render(ui);
    cookies.get.mockReturnValue(token);
    act(() => {
      jest.advanceTimersByTime(timeout + 500);
      jest.runAllTicks();
    });
    cookies.get.mockReturnValue('');
    await waitFor(() => rerender(ui));
    act(() => {
      jest.runOnlyPendingTimers();
      jest.runAllTicks();
    });
    await waitFor(() => expect(screen.queryByText(/Version:/i)).not.toBeInTheDocument(), { timeout: 5000 });
    expect(screen.queryByText(/Northern.tech/i)).toBeInTheDocument();
    expect(screen.queryByText(`© ${mockDate.getFullYear()} Northern.tech AS`)).toBeInTheDocument();
  }, 7000);
});
