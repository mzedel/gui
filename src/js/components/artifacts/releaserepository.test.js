import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import configureStore from 'redux-mock-store';
import ReleaseRepository from './releaserepository';

const mockStore = configureStore([]);
const store = mockStore({
  releases: {
    byId: {},
    selectedArtifact: null,
    selectedRelease: null,
    uploading: false
  },
  users: {
    onboarding: { complete: false },
    showHelptips: true
  }
});
it('renders correctly', () => {
  const tree = renderer
    .create(
      <Provider store={store}>
        <ReleaseRepository artifacts={[]} />
      </Provider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
