import { Schema, arrayOf, normalize } from 'normalizr';
import 'isomorphic-fetch';

const API_ROOT = 'http://cascadaio-fsapi.azurewebsites.net/api/default';

const foodSchema = new Schema('foods', {
  idAttribute: 'food_id'
});

foodSchema.define({
  food: foodSchema
});

const singleSearchResultSchema = new Schema('searchResults', {
  idAttribute: 'food_id'
});

singleSearchResultSchema.define({
  foods: {
    food: singleSearchResultSchema
  }
});

const searchResultSchema = new Schema('searchResults', {
  idAttribute: 'food_id'
});

searchResultSchema.define({
  foods: {
    food: arrayOf(searchResultSchema)
  }
});

export const Schemas = {
  FOOD: foodSchema,
  SEARCH_RESULT: searchResultSchema,
  SEARCH_RESULT_ARRAY: arrayOf(searchResultSchema)
};

function callApi(endpoint, schema, params) {
  if (endpoint.indexOf(API_ROOT) === -1) {
    endpoint = API_ROOT + endpoint;
  }

  return fetch(endpoint, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    .then(response =>
      response.json().then(json => ({ json, response}))
    ).then(({ json, response }) => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      if (schema === searchResultSchema && json.foods.food.food_id) {
        schema = singleSearchResultSchema;
      }

      return Object.assign(
        {},
        normalize(json, schema)
      );
    });
}

export const CALL_API = Symbol('Call API');

export default store => next => action => {
  const callAPI = action[CALL_API];
  if (typeof callAPI === 'undefined') {
    return next(action);
  }

  let { endpoint } = callAPI;
  const { schema, actionCreators, bailout, params } = callAPI;

  if (typeof endpoint === 'function') {
    endpoint = endpoint(store.getState());
  }

  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.');
  }
  if (!schema) {
    throw new Error('Specify one of the exported Schemas.');
  }
  if (!Array.isArray(actionCreators) || actionCreators.length !== 3) {
    throw new Error('Expected an array of three action creators.');
  }
  if (!actionCreators.every(actionCreator => typeof actionCreator === 'function')) {
    throw new Error('Expected actionCreator types to be functions.');
  }
  if (typeof bailout !== 'undefined' && typeof bailout !== 'function') {
    throw new Error('Expected bailout to either be undefined or a function.');
  }

  if (bailout && bailout(store.getState())) {
    return Promise.resolve();
  }

  const [requestAction, successAction, failureAction, completeAction] = actionCreators;
  next(requestAction());

  return callApi(endpoint, schema, params).then(
    response => next(successAction(response)),
    error => next(failureAction(error))
  );
};
