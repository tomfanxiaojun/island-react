import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Actions from '../actions/index';
import Header from '../components/Header';
import MainSection from '../components/MainSection';
import * as History from '../history';
import * as Routes from '../routes';
import * as Auth0Utils from '../utils/auth0';
import Immutable from 'Immutable';

class IslandApp extends Component {
  componentWillMount() {
    const { app, dispatch } = this.props;
    const actions = bindActionCreators(Actions, dispatch);

    Auth0Utils.getProfile(app.getIn(['auth0', 'lock']), actions);
    History.init(actions);
    History.navigate(Routes.arrive(), actions);
  }

  render() {
    const { dispatch } = this.props;
    const actions = bindActionCreators(Actions, dispatch);

    return (
      <div>
        <Header actions={actions} {...this.props} />
        <MainSection actions={actions} {...this.props} />
      </div>
    );
  }
}

function select(state) {
  return {
    app: state.app.delete('entities'),
    foods: state.app.getIn(['entities', 'foods']),
    logEntries: state.app.getIn(['entities', 'logEntries']),
    searchResults: state.app.getIn(['entities', 'searchResults'])
  };
}

export default connect(select)(IslandApp);
