import Immutable from 'Immutable';
import * as types from '../constants/ActionTypes';

const initialState = Immutable.fromJS({
  auth0: { lock: Auth0Lock("fwUmqNr4c8xn8Vp8i5UNDE1GZnu51HkD", "cascada-io.auth0.com") },
  entities: Immutable.fromJS({ foods: {}, logEntries: {}, searchResults: {} }),
  route: null,
  showError: false,
  showSpinner: false,
  userIsAuthenticated: false
});

export function app(state = initialState, action) {
  switch (action.type) {
    case types.SEARCH_RESULTS_REQUEST:
      return state.set('showSpinner', true);

    case types.SEARCH_RESULTS_SUCCESS:
      const entities = action.response ? action.response.entities.searchResults : null;

      if (entities) {
        delete entities[undefined];
      }

      return state.setIn(['entities', 'searchResults'], Immutable.fromJS(entities)
        .map((x, i) => x.set('index', i)));

    case types.SEARCH_RESULTS_COMPLETE:
      return state.set('showSpinner', false);

    case types.CLEAR_SEARCH_RESULTS:
      return state.setIn(['entities', 'searchResults'], Immutable.Map());

    case types.FOOD_REQUEST:
      return state.set('showSpinner', true);

    case types.FOOD_SUCCESS:
      return state.setIn(['entities', 'foods', action.newFood.get('food_id')], action.newFood);

    case types.FOOD_COMPLETE:
      return state.set('showSpinner', false);

    case types.RECEIVE_FOODS:
      return state.updateIn(['entities', 'foods'], x => x.merge(action.foods));

    case types.CLEAR_FOODS:
      return state.setIn(['entities', 'foods'], Immutable.Map());

    case types.ADD_LOG_ENTRY:
      return state.setIn(['entities', 'logEntries', action.newLogEntry.get('id')],
        action.newLogEntry);

    case types.DELETE_LOG_ENTRY:
      return state.deleteIn(['entities', 'logEntries', action.id]);

    case types.EDIT_LOG_ENTRY:
      return state.setIn(['entities', 'logEntries', action.id], action.newLogEntry);

    case types.RECEIVE_LOG_ENTRIES:
      return state.updateIn(['entities', 'logEntries'], x => x.merge(action.logEntries));

    case types.CLEAR_LOG_ENTRIES:
      return state.setIn(['entities', 'logEntries'], Immutable.Map());

    case types.ROLLBACK:
      return state.update(x => {
        x.setIn(action.ks, action.v);
        x.setIn('error', msg);
      });

    case types.SIGN_IN:
      return state.merge(Immutable.fromJS({
        auth0: { lock: state.getIn(['auth0', 'lock']), profile: action.profile },
        userIsAuthenticated: true
      }));

    case types.SIGN_OUT:
      return state.merge(Immutable.fromJS({
        auth0: { lock: state.getIn(['auth0', 'lock']), profile: null },
        userIsAuthenticated: false
      }))
      .setIn(['entities', 'logEntries'], Immutable.Map())
      .setIn(['entities', 'foods'], Immutable.Map());

    case types.NAVIGATE:
      return state.set('route', action.newRoute);

    default:
      return state;
  }
}
