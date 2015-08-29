import React, { Component } from 'react';
import Immutable from 'Immutable';
import Moment from 'moment';
import ActionIcon from './ActionIcon';
import { components, registerComponent, unregisterComponent } from '../state';
import { roundAndTrim } from '../utils';

class Serving extends Component {
  render() {
    const { onClick, serving_description, serving_id } = this.props;

    return (
      <li
        onClick={function() { onClick(serving_id) }}
        style={{ margin: 0, padding: "1rem 0 1rem 0.25rem" }}>
        <h5 style={{ marginBottom: 0 }}>
          <span className="action" style={{ textDecoration: "none" }}>
            {serving_description}
          </span>
        </h5>
      </li>
    );
  }
}

class Servings extends Component {
  handleServingSelected(serving_id) {
    const { actions, cid, id } = this.props;
    actions.updateServing(cid, serving_id, id);
  }

  render() {
    const { servings } = this.props;

    return (
      <div>
        <hr style={{ color: '#d1d1d1', marginBottom: '1rem', marginTop :0 }} />
        <ul className="servings">
          {servings.map(x =>
            <Serving
              key={x.get('serving_id')}
              onClick={function(serving_id) { this.handleServingSelected(serving_id) }.bind(this)}
              serving_description={x.get('serving_description')}
              serving_id={x.get('serving_id')} />)}
        </ul>
      </div>
    );
  }
}

class ServingLink extends Component {
  handleShowServings() {
    const { cid, id } = this.props;
    const newState = (cid === 'day/Content') ?
      { logEntryId: id } :
      { showServings: true };

    components[cid].setState(newState);
  }

  render() {
    const { serving_description, servings } = this.props;
    const showLink = servings && (servings.count() > 1);

    return (
      <span
        className={ showLink ? 'action' : null }
        onClick={ showLink ? this.handleShowServings.bind(this) : null }
        title={ showLink ? 'View all servings' : null }>
        {serving_description}
      </span>
    );
  }
}

class QuantityInput extends Component {
  handleDecClicked() {
    const { actions, id, logEntry } = this.props;
    actions.editLogEntry(id, logEntry.updateIn(['quantity'], x => x - 1));
  }

  handleIncClicked() {
    const { actions, id, logEntry } = this.props;
    actions.editLogEntry(id, logEntry.updateIn(['quantity'], x => x + 1));
  }

  handleQuantityChanged(e) {
    const { actions, id, logEntry } = this.props;
    actions.editLogEntry(id, logEntry.set('quantity', e.target.value));
  }

  render() {
    const { id, quantity, onQuantityChanged } = this.props;
    const decIsDisabled = (quantity === 1) || (quantity < 1);

    return (
      <div className="justify-space-between" style={{ borderBottom: 0 }}>
        <ActionIcon
          isActive={!decIsDisabled}
          cssClasses="md-dark md-36"
          mdIconName="remove"
          onClick={function() { if (!decIsDisabled) { this.handleDecClicked() }}.bind(this)}
          style={Immutable.Map({ cursor: decIsDisabled ? 'not-allowed' : 'pointer' })}
          title={decIsDisabled ? 'Minimum qty 0' : 'Subtract 1 from qty'} />
        <input
          min={1}
          onChange={this.handleQuantityChanged.bind(this)}
          ref="qty-input"
          step="any"
          style={{ margin: '0 15px 0 20px', width: '6rem' }}
          type="number"
          value={quantity} />
        <ActionIcon
          isActive={true}
          cssClasses="md-dark md-36"
          mdIconName="add"
          onClick={this.handleIncClicked.bind(this)}
          style={Immutable.Map()}
          title= "Add 1 to qty" />
      </div>
    );
  }
}

function transformServing(serving) {
  return serving
    .delete('measurement_description').delete('metric_serving_unit')
    .delete('number_of_units').delete('serving_description')
    .delete('serving_id').delete('serving_url');
}

class StackedLogEntryRow extends Component {
  render() {
    return (
      <tr>
        <td style={{ verticalAlign: 'bottom' }}>
          <h4 style={{ color: '#6f6f6f', marginBottom: 0 }}>
            {this.props.children[0]}
          </h4>
        </td>
        <td style={{ textAlign: 'right', verticalAlign: 'bottom' }}>
          <h5 style={{ marginBottom: 0 }}>
            {this.props.children[1]}
          </h5>
        </td>
      </tr>
    );
  }
}

function getLogEntryTotals(logEntry)  {
  const quantity = logEntry.get('quantity');
  const serving = logEntry ? logEntry.get('serving') : Immutable.Map();
  return transformServing(serving).map(x => roundAndTrim(((x || 0) * 1 * quantity), 1));
}

class StackedLogEntry extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { isExpanded: false, showServings: false };
  }

  componentWillMount() { registerComponent('day/StackedLogEntry', this); }

  componentWillUnmount() { unregisterComponent('day/StackedLogEntry'); }

  render() {
    return (this.state.isExpanded ? this.renderExpanded() : this.renderClosed());
  }

  renderClosed() {
    const { food, id, logEntry, serving, quantity } = this.props;
    const { serving_description } = serving.toJS();
    const { calories, carbohydrate, fat, protein } =
    logEntry ? getLogEntryTotals(logEntry).toJS() : {
      calories: 0,
      carbohydrate: 0,
      fat: 0,
      protein: 0
    };

    return (
      <div style={{ backgroundColor: '#f1f1f1', padding: '1rem' }}>
        <div
          className="justify-space-between"
          onClick={() => this.setState({ isExpanded: true })}
          style={{ backgroundColor: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
          <h3 style={{ color: '#6f6f6f', marginBottom: '0.5rem' }}>
            {food.get('food_name')}
          </h3>
          <ActionIcon
            isActive={true}
            cssClasses="md-dark md-36"
            mdIconName="arrow_drop_down"
            onClick={null}
            style={Immutable.Map()}
            title="Show entry details" />
        </div>
      </div>
    );
  }

  renderExpanded() {
    const { food } = this.props;

    return (
      <div style={{ backgroundColor: '#f1f1f1', padding: '1rem' }}>
        <div
          className="justify-space-between"
          onClick={() => this.setState({ isExpanded: false })}
          style={{ borderTop: '1px solid #ccc', padding: '0.5rem' }}>
          <h3 style={{ color: '#6f6f6f', marginBottom: '0.5rem' }}>
            {food.get('food_name')}
          </h3>
          <ActionIcon
            isActive={true}
            cssClasses="md-dark md-36"
            mdIconName="arrow_drop_up"
            onClick={null}
            style={Immutable.Map()}
            title="Hide entry details" />
        </div>
        {this.state.showServings ? this.renderServings() : this.renderTable()}
      </div>
    );
  }

  renderTable() {
    const { food, id, logEntry, serving, quantity } = this.props;
    const { serving_description } = serving.toJS();
    const { calories, carbohydrate, fat, protein } =
    logEntry ? getLogEntryTotals(logEntry).toJS() : {
      calories: 0,
      carbohydrate: 0,
      fat: 0,
      protein: 0
    };
    const inputId = 'stacked-input-qty-' + id;

    return (
      <div style={{ backgroundColor: '#fff', padding: '2rem' }}>
        <table className="u-full-width" style={{ marginBottom: 0 }}>
          <tbody style={{ backgroundColor: '#fff' }}>
            <StackedLogEntryRow>
              <label htmlFor={inputId}>
                <h4 style={{ color: '#6f6f6f', marginBottom: 0 }}>Qty</h4>
              </label>
              <ActionIcon
                isActive={true}
                cssClasses="md-dark md-36"
                mdIconName="delete"
                onClick={this.handleDeleteLogEntry.bind(this)}
                style={Immutable.Map()}
                title="Delete entry" />
            </StackedLogEntryRow>
            <tr><td colSpan={2}><QuantityInput c={this} {...this.props} /></td></tr>
            <StackedLogEntryRow>
              Serving
              <ServingLink
                cid={'day/StackedLogEntry'}
                id={id}
                serving_description={serving_description}
                servings={serving} />
            </StackedLogEntryRow>
            <StackedLogEntryRow>
              Calories
              {calories}
            </StackedLogEntryRow>
            <StackedLogEntryRow>
              Fat (g)
              {fat}
            </StackedLogEntryRow>
            <StackedLogEntryRow>
              Carb (g)
              {carbohydrate}
            </StackedLogEntryRow>
            <StackedLogEntryRow>
              Protein (g)
              {protein}
            </StackedLogEntryRow>
          </tbody>
        </table>
      </div>
    );
  }

  renderServings() {
    const { id, food } = this.props;

    return (
      <div style={{ backgroundColor: '#fff', padding: '1rem' }}>
        <h3 style={{ marginBottom: 0 }}>Servings</h3>
        <Servings
          cid="day/StackedLogEntry"
          id={id}
          servings={food.getIn(['servings', 'serving'])}
          {...this.props} />
      </div>
    );
  }

  handleDeleteLogEntry() {
    const { id, actions } = this.props;
    actions.deleteLogEntry(id);
  }
}

class LogEntry extends Component {
  render() {
    const { food, id, logEntry, serving, quantity } = this.props;
    const { serving_description } = serving.toJS();
    const { calories, carbohydrate, fat, protein } =
    logEntry ? getLogEntryTotals(logEntry).toJS() : {
      calories: 0,
      carbohydrate: 0,
      fat: 0,
      protein: 0
    };

    return (
      <tr>
        <td style={{ textAlign: 'left' }}>{food.get('food_name')}</td>
        <td><QuantityInput c={this} {...this.props} /></td>
        <td>
          <ServingLink
            cid={'day/Content'}
            id={id}
            serving_description={serving_description}
            servings={serving} />
        </td>
        <td>{calories}</td>
        <td>{fat}</td>
        <td>{carbohydrate}</td>
        <td>{protein}</td>
        <td>
          <ActionIcon
            isActive={true}
            cssClasses="md-dark"
            mdIconName="delete"
            onClick={this.handleDeleteLogEntry.bind(this)}
            style={Immutable.Map()}
            title="Delete entry" />
        </td>
      </tr>
    );
  }

  handleDeleteLogEntry() {
    const { id, actions } = this.props;
    actions.deleteLogEntry(id);
  }
}

class FoodLog extends Component {
  getTotals(logEntry) {
    const quantity = logEntry.get('quantity');
    const serving = logEntry ? logEntry.get('serving') : Immutable.Map();
    return transformServing(serving).map(x => (x || 0) * 1 * quantity);
  }

  render() {
    const { app, foods, logEntries } = this.props;
    const logEntriesSeq =
      (logEntries || Immutable.Map())
        .valueSeq()
        .filter(x => Moment(x.get('date'))
          .isSame(Moment(app.getIn(['route', 'date']), 'YYYY-MM-DD'), "days"))
        .map(le => le.merge(Immutable.fromJS({
            food: foods.get(le.get('food_id')),
            serving: foods.get(le.get('food_id'))
              .getIn(['servings', 'serving'])
              .find(s => (s.get('serving_id') === le.get('serving_id')))})))
        .sortBy(x => x.get('date'))
        .reverse();

    const { calories, carbohydrate, fat, protein } =
      (logEntriesSeq.map(le => this.getTotals(le))
        .reduce((pv, cv) =>
          cv.mapEntries(([k, v]) => [k,
            (((pv.get(k) || 0) * 1) + ((cv.get(k) || 0) * 1))])) ||
      Immutable.Map({ calories: 0, carbohydrate:0, fat: 0, protein: 0}))
        .map(x => roundAndTrim(x, 1)).toJS();

    return (
      logEntriesSeq.count() ?
        <section
          className="food-log"
          style={{ marginTop: '1rem' }}>
          <table className="food-log">
            <thead>
              <tr>
                <th colSpan="3" style={{ textAlign: 'left' }}>
                  <h3 style={{ color: '#ccc', marginBottom: 0 }}>Totals</h3>
                </th>
                <th><h4>{calories}</h4></th>
                <th><h4>{fat}</h4></th>
                <th><h4>{carbohydrate}</h4></th>
                <th><h4>{protein}</h4></th>
                <th></th>
              </tr>
              <tr>
                <th style={{ textAlign: "left" }}>Description</th>
                <th>Qty</th>
                <th>Serving</th>
                <th>Cals</th>
                <th>Fat (g)</th>
                <th>Carb (g)</th>
                <th>Protein (g)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logEntriesSeq.map(x =>
                <LogEntry
                  key={x.get('id')}
                  food={x.get('food')}
                  id={x.get('id')}
                  logEntry={x}
                  serving={x.get('serving')}
                  quantity={x.get('quantity')}
                  {...this.props} />
              )}
            </tbody>
          </table>
          <div className="food-log-stacked-totals">
            <h3 style={{ color: '#ccc', marginBottom: 0 }}>Totals</h3>
            <table className="u-full-width">
              <thead>
                <tr>
                  <th>Calories</th>
                  <th>Fat (g)</th>
                  <th>Carb (g)</th>
                  <th>Protein (g)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><h4>{calories}</h4></td>
                  <td><h4>{fat}</h4></td>
                  <td><h4>{carbohydrate}</h4></td>
                  <td><h4>{protein}</h4></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="food-log-stacked">
            {logEntriesSeq.map(x =>
              <StackedLogEntry
                key={x.get('id')}
                food={x.get('food')}
                id={x.get('id')}
                logEntry={x}
                serving={x.get('serving')}
                quantity={x.get('quantity')}
                {...this.props} />)}
          </div>
        </section> :
        <h4 style={{ color: '#ccc', marginTop: '1rem' }}>
          No entries for this date. Tap or click '+' to search for foods.
        </h4>
    );
  }
}

class Food extends Component {
  handleAddLogEntry() {
    const { app, actions, food_id } = this.props;

    actions.clearSearchResults();

    components['day/Header'].setState({ showFoodForm: false });

    actions.addLogEntry(Moment(app.getIn(['route', 'date']), 'YYYY-MM-DD'), food_id);
  }

  render() {
    const { food_name } = this.props;

    return (
      <li
        onClick={this.handleAddLogEntry.bind(this)}
        style={{ cursor: 'pointer', margin: 0, padding: '1rem 0 1rem 0.25rem' }}>
        <h5 style={{ margin: 0 }}>{food_name}</h5>
      </li>
    );
  }
}

class SearchResults extends Component {
  render() {
    const { app, searchResults } = this.props;

    return (
      <div className="row">
        <div className="four columns">
          <ul className="foods" style={{ color: '#1EAEDB', listStyleType: 'none'}}>
            {searchResults.valueSeq().sortBy(x => x.get('index')).map(x =>
              <Food
                key={x.get('food_id')}
                food_id={x.get('food_id')}
                food_name={x.get('food_name')}
                {...this.props} />
            )}
          </ul>
        </div>
      </div>
    );
  }
}

class Content extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { logEntryId: null };
  }

  componentWillMount() { registerComponent('day/Content', this) }

  componentWillUnmount() { unregisterComponent('day/Content') }

  render() {
    return (!this.state.logEntryId ?
      this.renderSearchResults() :
      this.renderServings()
    );
  }

  renderSearchResults() {
    const { app, searchResults } = this.props;

    return !searchResults ?
      <h4 style={{ color: '#ccc', marginTop: '1rem' }}>No matching foods</h4> :
      !searchResults.count() ?
        <FoodLog
          onClick={function (id) { this.setState({ logEntryId: id }) }}
          {...this.props} /> :
        <SearchResults {...this.props} />;
  }

  renderServings() {
    const { app, foods, logEntries } = this.props;
    const logEntryId = this.state.logEntryId;

    return (
      <Servings
        cid="day/Content"
        id={logEntryId}
        servings={foods.getIn([logEntries.getIn([logEntryId, 'food_id']),
          'servings', 'serving'])}
        {...this.props} />
    );
  }
}

class FoodForm extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { value: null };
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  handleSubmit(e) {
    const { actions } = this.props;

    e.preventDefault();
    actions.loadSearchResults(React.findDOMNode(this.refs.searchInput).value);
  }

  handleSubmitClicked(e) {
    if (React.findDOMNode(this.refs.searchInput).value) {
      React.findDOMNode(this.refs.submit).click();
    }
  }

  render() {
    const { handleBackClicked } = this.props;
    const value = this.state.value;
    const hasValue = value && value.length;

    return (
      <header className="justify-space-between">
        <div className="justify-flex-start">
          <ActionIcon
            isActive={true}
            cssClasses="md-dark md-48"
            mdIconName="arrow_back"
            onClick={handleBackClicked}
            style={Immutable.Map()}
            title="Back to food log" />
          <form
            onSubmit={this.handleSubmit.bind(this)}
            style={{ margin: 0 }}>
            <input
              autoFocus={true}
              onChange={this.handleChange.bind(this)}
              onClick={function(e) { e.target.select() }}
              placeholder="Search"
              ref="searchInput"
              required={true}
              style={{
                border: 0,
                color: '#666',
                display: 'inline-block',
                fontSize: '24px',
                height: '48px',
                marginBottom: 0,
                width: '100%'
              }}
              type="text"
              value={value} />
            <input className="hidden" ref="submit" type="submit" />
          </form>
        </div>
        <div className="justify-flex-end">
          <ActionIcon
            isActive={hasValue}
            cssClasses="md-dark md-48"
            mdIconName="clear"
            onClick={function(e) { this.setState({ value: null }) }.bind(this)}
            style={Immutable.Map()}
            title="Clear search text" />
          <ActionIcon
            isActive={hasValue}
            cssClasses="md-dark md-48"
            mdIconName="search"
            onClick={this.handleSubmitClicked.bind(this)}
            style={Immutable.Map()}
            title="Search foods" />
        </div>
      </header>
    );
  }
}

class Header extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { showFoodForm: false };
  }

  getTodayWithTime(date) {
      return date.format('YYYY-MM-DD');
  }

  componentWillMount() { registerComponent('day/Header', this); }

  componentWillUnmount() { unregisterComponent('day/Header'); }

  handleAddEntry() {
    this.setState({ showFoodForm: true });
  }

  handleBackClicked() {
    this.setState({showFoodForm: false});
    this.props.actions.clearSearchResults();
  }

  render() {
    const { actions, date } = this.props;
    const showFoodForm = this.state.showFoodForm;

    return ( showFoodForm ?
      <FoodForm
        handleBackClicked={this.handleBackClicked.bind(this)}
        {...this.props} /> :
      <header className="justify-space-between">
        <h3 style={{marginBottom: 0}}>
          <a href={'/' + date.format('YYYY-MM') + '/'}>
            {this.getTodayWithTime(date)}
          </a>
        </h3>
        <ActionIcon
          isActive={true}
          cssClasses="md-dark md-48"
          mdIconName="add"
          onClick={this.handleAddEntry.bind(this)}
          style={Immutable.Map()}
          title="Add entry" />
      </header>
    );
  }
}

class Day extends Component {
  render() {
    const { app, actions } = this.props;

    return (
      <main>
        <div className="container">
          <Header
            date={Moment(app.getIn(['route', 'date']), 'YYYY-MM-DD')}
            {...this.props} />
          <Content {...this.props} />
        </div>
      </main>
    );
  }
}

export default Day;
