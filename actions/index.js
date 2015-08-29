import Immutable from 'Immutable';
import Moment from 'moment';
import ShortId from 'shortid';
import * as types from '../constants/ActionTypes';
import { CALL_API, Schemas } from '../middleware/api';
import * as FirebaseUtils from '../utils/firebase';
import * as TransitUtils from '../utils/transit';
import { components } from '../state';

function requestFood() {
  return {
    type: types.FOOD_REQUEST
  };
}

function getFoodFromResponse(response) {
  const food = Immutable.fromJS(response.entities.foods).first().toJS();

  food.servings.serving = Array.isArray(food.servings.serving) ?
    food.servings.serving :
    [food.servings.serving];

  return Immutable.fromJS(food);
}

function receiveFood(response) {
  return {
    type: types.FOOD_SUCCESS,
    newFood: getFoodFromResponse(response)
  };
}

function receiveFoodError(response) {
  return {
    type: types.FOOD_FAILURE,
    response
  };
}

function receiveFoodComplete() {
  return {
    type: types.FOOD_COMPLETE
  };
}

function fetchFood(food_id, successActionCreator, errorActionCreator) {
  return {
    [CALL_API]: {
      actionCreators: [
        requestFood,
        (successActionCreator || receiveFood),
        (errorActionCreator || receiveFoodError)
      ],
      endpoint: '',
      schema: Schemas.FOOD,
      params: { FoodId: food_id }
    }
  };
}

function getNewLogEntryAction(newLogEntry) {
  return {
    type: types.ADD_LOG_ENTRY,
    newLogEntry
  };
}

function getNewLogEntry(date, food) {
  const id = ShortId.generate();

  return Immutable.fromJS({
    date: date,
    id: id,
    food_id: food.get('food_id'),
    quantity: 1,
    serving_id: food.getIn(['servings', 'serving']).first().get('serving_id')
  });
}

export function addLogEntry(date, food_id) {
  return (dispatch, getState) => {
    let newLogEntry = null;
    const app = getState().app;
    const { auth0 } = app.toJS();
    const entities = app.get('entities');
    const foods = entities.get('foods')
    const food = foods.get(food_id);
    const logEntries = entities.get('logEntries');
    const profile = auth0.profile;

    if (!food) {
      return dispatch(fetchFood(food_id, function (response) {
          const newFood = getFoodFromResponse(response);
          newLogEntry = getNewLogEntry(date, newFood);

          dispatch(receiveFood(response));
          dispatch(receiveFoodComplete());
          if (profile) {
            dispatch(syncUserFood(newFood, foods, profile));
            dispatch(syncLogEntry(newLogEntry, logEntries, profile));
          }
          return getNewLogEntryAction(newLogEntry);
        }, function (response) {
          dispatch(receiveFoodError(response));
          return receiveFoodComplete();
        }));
    } else {
      newLogEntry = getNewLogEntry(date, food);
      if (profile) {
        dispatch(syncLogEntry(newLogEntry, logEntries, profile))
      }
      return dispatch(getNewLogEntryAction(newLogEntry));
    }
  };
}

export function deleteLogEntry(id) {
  return (dispatch, getState) => {

    const app = getState().app;
    const { auth0 } = app.toJS();
    const profile = auth0.profile;
    const logEntries = app.getIn(['entities', 'logEntries']);
    const date = logEntries.getIn([id, 'date']);

    if (profile) {
      FirebaseUtils.getRef(['log-entries', Moment(date).format('YYYY-MM'),
        Moment(date).format('YYYY-MM-DD'), id.toString()],
        function (result) {
          const { ref } = result;

          if (ref) {
            ref.set(null, function (error) {
              if (error) {
                maybeRollback('Error deleting log entry', ['entities', 'logEntries'],
                  logEntries, error);
              }
            });
          }
        },
        profile
      );
    }

    return dispatch({
      type: types.DELETE_LOG_ENTRY,
      id
    });
  };
}

export function editLogEntry(id, newLogEntry) {
  return (dispatch, getState) => {
    const app = getState().app;
    const { auth0 } = app.toJS();
    const profile = auth0.profile;

    if (profile) {
      dispatch(
        syncLogEntry(
          newLogEntry,
          app.getIn(['entities', 'logEntries']),
          profile)
      );
    }

    return dispatch({
      type: types.EDIT_LOG_ENTRY,
      id,
      newLogEntry
    });
  };
}

export function clearLogEntries() {
  return {
    type: types.CLEAR_LOG_ENTRIES
  };
}

function requestSearchResults() {
  return {
    type: types.SEARCH_RESULTS_REQUEST
  };
}

function receiveSearchResults(response) {
  return {
    type: types.SEARCH_RESULTS_SUCCESS,
    response
  };
}

function receiveSearchResultsError(json) {
  return {
    type: types.SEARCH_RESULTS_FAILURE,
    json
  };
}

function receiveSearchResultsComplete() {
  return {
    type: types.SEARCH_RESULTS_COMPLETE
  };
}

function fetchSearchResults(searchExpression, successActionCreator, errorActionCreator) {
  return {
    [CALL_API]: {
      actionCreators: [
        requestSearchResults,
        (successActionCreator || receiveSearchResults),
        (errorActionCreator || receiveSearchResultsError)
      ],
      endpoint: '',
      schema: Schemas.SEARCH_RESULT,
      params: { SearchExpression: searchExpression }
    }
  };
}

export function loadSearchResults(searchExpression, requiredFields = []) {
  return dispatch => {
    return dispatch(fetchSearchResults(searchExpression, function (response) {
      dispatch(receiveSearchResults(response));
      return receiveSearchResultsComplete();
    }, function (error) {
      dispatch(receiveSearchResultsError(error));
      return receiveSearchResultsComplete();
    }));
  };
}

export function resetErrorMessage() {
  return {
    type: types.RESET_ERROR_MESSAGE
  };
}

export function signIn(profile) {
  return {
    type: types.SIGN_IN,
    profile
  };
}

export function signOut() {
  localStorage.removeItem('userToken');
  return {
    type: types.SIGN_OUT
  };
}

export function navigate(newRoute) {
  return {
    type: types.NAVIGATE,
    newRoute
  };
}

export function clearSearchResults() {
  return {
    type: types.CLEAR_SEARCH_RESULTS
  }
}

function maybeRollback(msg, korks, v, error) {
  dispatch => {
    if (error) {
      const ks = utils.toKs(korks);
      return {
        type: types.ROLLBACK,
        msg,
        ks,
        v
      };
    } else {
      return null;
    }
  }
}

function syncLogEntry(newEntry, prevValue, profile) {
  const { date, id } = newEntry.toJS();

  FirebaseUtils.getRef(['log-entries', Moment(date).format('YYYY-MM'),
    Moment(date).format('YYYY-MM-DD'), id.toString()],
    function (result) {
      const { ref } = result;

      if (ref) {
        ref.set(TransitUtils.write(newEntry.toJS()), function (error) {
          if (error) {
            maybeRollback('Error creating log entry', ['entities', 'logEntries'],
              prevValue, error);
          }
        });
      }
    },
    profile
  );

  return {
    type: types.SYNC_LOG_ENTRY
  };
}

function receiveFoods(foods) {
  return {
    type: types.RECEIVE_FOODS,
    foods
  }
}

function receiveLogEntries(logEntries) {
  return {
    type: types.RECEIVE_LOG_ENTRIES,
    logEntries
  }
}

function fetchFoods(profile, dispatch, cb) {
  FirebaseUtils.getRef(['foods'],
    function (result) {
      const { ref } = result;

      if (ref) {
        FirebaseUtils.pull(ref, function(dataSnapshot){
          const foods = Immutable.fromJS(dataSnapshot.val());

          dispatch(receiveFoods(foods ? foods.map(x => TransitUtils.read(x)) : Immutable.Map()));
          cb();
        });
      }
    },
    profile
  );
}

function extractLogEntries(m, period) {
  const logEntries = [];

  if (period === 'day') {
    return m ? m.map(le => TransitUtils.read(le)) : Immutable.Map();
  } else {
    if (m) {
      m.forEach(d => { d.forEach(le => { logEntries.push(TransitUtils.read(le)); }); });
    }
    return Immutable.Map(logEntries.map(le => ([le.get('id'), le])));
  }
}

function fetchLogEntries(date, period, profile, dispatch, cb) {
  const ks = (period === 'day') ?
    ['log-entries', Moment(date).format('YYYY-MM'), Moment(date).format('YYYY-MM-DD')] :
    ['log-entries', date];

  FirebaseUtils.getRef(ks,
    function (result) {
      const { ref } = result;

      if (ref) {
        FirebaseUtils.pull(ref, function(dataSnapshot){
          const logEntries = extractLogEntries(Immutable.fromJS(dataSnapshot.val()), period);

          dispatch(receiveLogEntries(logEntries));
          cb();
        });
      }
    },
    profile
  );
}

function syncUserFood(newFood, prevValue, profile) {

  FirebaseUtils.getRef(['foods', newFood.get('food_id')],
    function (result) {
      const { ref } = result;

      if (ref) {
        ref.set(TransitUtils.write(newFood.toJS()), function (error) {
          if (error) {
            maybeRollback('Error creating food', ['entities', 'foods'],
              prevValue, error);
          }
        });
      }
    },
    profile
  );

  return {
    type: types.SYNC_USER_FOOD
  };
}

export function firebaseSync() {
  return (dispatch, getState) => {
    const app = getState().app;
    const { auth0, route } = app.toJS();
    const profile = auth0.profile;
    const { date, month, name } = route;
    const entities = app.get('entities');
    const foods = entities.get('foods');
    const logEntries = entities.get('logEntries');

    fetchFoods(profile, dispatch, () => {
      fetchLogEntries((date || month), (date ? 'day' : 'month'), profile, dispatch, () => {
          logEntries.valueSeq().forEach(x => {
            dispatch(syncUserFood(foods.get(x.get('food_id')), foods, profile));
            dispatch(syncLogEntry(x, logEntries, profile));
          });
      });
    });

    return dispatch({ type: types.FIREBASE_SYNC });
  };
}

export function updateServing(cid, serving_id, log_entry_id) {
  return (dispatch, getState) => {
    const oldEntry = getState().app.getIn(['entities', 'logEntries', log_entry_id]);
    const newEntry = oldEntry.set('serving_id', serving_id);

    if (oldEntry.get('serving_id') !== serving_id) {
      dispatch(editLogEntry(newEntry.get('id'), newEntry));
    }

    const newState = (cid === 'day/Content') ?
      { logEntryId: null } :
      { showServings: false };

    components[cid].setState(newState);

    return dispatch({
      type: types.UPDATE_SERVING
    });
  };
}
