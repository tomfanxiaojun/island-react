import React, { Component } from 'react';
import Immutable from 'Immutable';
import Moment from 'moment';
import ActionIcon from './ActionIcon';
import { connect } from 'react-redux';
import { range } from '../utils';
import { navigateTo } from '../history';

class Day extends Component {
  render() {
    const { actions, date } = this.props;
    const dateStr = date.format('YYYY-MM-DD');
    const href = "/" + date.format('YYYY-MM') + "/" + dateStr;

    return (
      <li
        className="justify-flex-start"
        onClick={function() {navigateTo(actions, href)}}
        style={{ alignItems: "center", margin: 0, padding: "1rem 0 1rem 0.25rem" }}>
        <h4 style={{margin: 0}}>
          <a href={href} style={{margin: 0, padding: 0}}>
            {dateStr}
          </a>
        </h4>
        {this.renderCountIndicator()}
      </li>
    );
  }

  renderCountIndicator() {
    const { logEntryCount } = this.props;

    return ((logEntryCount > 0) ?
      <h5 style={{ color: "#ccc", margin: "-2px 0 0 20px"}}>
        {'(' + logEntryCount + ')'}
      </h5> :
      null);
  }
}

class Days extends Component {
  render() {
    const { app, logEntries } = this.props;
    const userIsAuthenticated = app.get('userIsAuthenticated');

    return (
      <main>
        <div className="container">
          <div className="row">
            <div className="six columns">
              <h3 style={{marginBottom: 0}}>Dates</h3>
              <hr style={{color: "#d1d1d1", marginBottom: "1rem", marginTop: 0}} />
              {app.getIn(['auth0', 'profile']) ? this.renderMonthSelector() : null}
              {this.renderDays()}
            </div>
          </div>
        </div>
      </main>
    );
  }

  renderMonthSelector() {
    const { actions, isThisMonth, monthDate } = this.props;
    const prevHref= "/" + Moment(monthDate).add(-1, 'month').format('YYYY-MM') + "/";
    const nextHref= "/" + Moment(monthDate).add(1, 'month').format('YYYY-MM') + "/";

    return (
      <div className="justify-space-between">
        <ActionIcon
          isActive={true}
          cssClasses="md-dark md-48"
          mdIconName="chevron_left"
          onClick={function() {navigateTo(actions, prevHref)}}
          style={Immutable.Map()}
          title={"Previous Month"} />
        <h4 style={{ color: "#ccc", marginBottom: 0 }}>{Moment(monthDate).format('MMM-YYYY')}</h4>
        <ActionIcon
          isActive={true}
          cssClasses="md-dark md-48"
          mdIconName="chevron_right"
          onClick={function() { if (!isThisMonth) { navigateTo(actions, nextHref) }}}
          style={Immutable.Map({ cursor: (isThisMonth ? "not-allowed" : "pointer") })}
          title={"Next Month"} />
      </div>
    );
  }

  renderDays() {
    const { days } = this.props;

    return (
      <ul className="days">
        {days.map(x =>
           <Day
              key={x.get('id')}
              date={x.get('date')}
              logEntryCount={x.get('logEntryCount')}
              {...this.props} />)}
      </ul>
    );
  }
}

class Month extends Component {
  getMonthDates(monthDate) {
    const startDate = Moment(monthDate).startOf('month');
    const diff = Moment(monthDate).diff(startDate, "days");

    return Immutable.fromJS(range(0, diff).map(x => ({
      id: Moment(startDate).add(x, "days").format('YYYY-MM-DD'),
      date: Moment(startDate).add(x, "days")
    })));
  }

  getMonthDays(logEntries, monthDate, userIsAuthenticated) {
    const logEntriesSeq = logEntries.valueSeq();
    const self = this;

    return (userIsAuthenticated ?
      self.getMonthDates(monthDate).map(function (d) {
        const date = d.get('date');

        return Immutable.fromJS({
          id: date.format('YYYY-MM-DD'),
          date: date,
          logEntryCount: logEntriesSeq
            .filter(x => x.get('date').isSame(date, "days"))
            .count()
          });
        })
        .filter(x => x.get('date').isBefore(Moment().add(1, "days"), "days"))
        .sortBy(x => x.id)
        .reverse() :
      Immutable.fromJS([{
        id: Moment().format('YYYY-MM-DD'),
        date: Moment(),
        logEntryCount: logEntriesSeq
          .filter(x => Moment(x.get('date')).isSame(Moment(), "days"))
          .count()
      }]));
  }

  componentWillMount() {
    this.props.actions.firebaseSync();
  }

  render() {
    const { app, auth0, logEntries } = this.props;
    const userIsAuthenticated = app.get('userIsAuthenticated');
    const monthDate =
      Moment(app.getIn(['route', 'month']), 'YYYY-MM').endOf('month');

    return (
        <Days
          days={this.getMonthDays(logEntries, monthDate, userIsAuthenticated)}
          isThisMonth={monthDate.isSame(Moment(), "month")}
          monthDate={monthDate}
          {...this.props} />
    );
  }
}

export default Month;
