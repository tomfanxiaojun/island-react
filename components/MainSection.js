import React, { Component } from 'react';
import Immutable from 'Immutable';
import Month from './Month';
import Day from './Day';

class MainSection extends Component {
  render() {
    const { app } = this.props;
    const Component = Immutable.Map({ month: Month})
      .get(app.getIn(['route', 'name'])) || Day;

    return (<Component {...this.props} />);
  }
}

export default MainSection;
