import React from 'react';
import { render } from '@testing-library/react';
import FilterItem from './filteritem';
import { undefineds } from '../../../../tests/mockData';

describe('FilterItem Component', () => {
  it('renders correctly', async () => {
    const { baseElement } = render(
      <FilterItem
        filterAttributes={['test']}
        filter={{ key: 'testkey', value: 'testvalue' }}
        filters={[{ key: 'testkey', value: 'testvalue' }]}
        attributes={[{ key: 'testkey', value: 'testvalue' }]}
        index={0}
      />
    );
    const view = baseElement.firstChild.firstChild;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });
});