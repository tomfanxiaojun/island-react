import React, { Component } from 'react';
import IslandApp from './IslandApp';
import { Provider } from 'react-redux';
import createAsyncStore from '../store/createAsyncStore';

const store = createAsyncStore();

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        {() => <IslandApp /> }
      </Provider>
    );
  }
}
