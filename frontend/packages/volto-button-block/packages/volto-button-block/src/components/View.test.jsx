import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-intl-redux';
import configureStore from 'redux-mock-store';
import View from './View';

const mockStore = configureStore();

const store = mockStore({
  intl: {
    locale: 'en',
    messages: {},
  },
});

describe('View', () => {
  it('renders without errors', () => {
    render(
      <Provider store={store}>
        <View data={{}} />
      </Provider>,
    );
  });
});
