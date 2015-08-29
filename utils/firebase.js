import * as Utils from '../utils';

function fetchDelegationToken() {
  return fetch('https://cascada-io.auth0.com/delegation', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: 'fwUmqNr4c8xn8Vp8i5UNDE1GZnu51HkD',
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        id_token: localStorage.getItem('userToken'),
        target: 'fwUmqNr4c8xn8Vp8i5UNDE1GZnu51HkD',
        scope: 'openid',
        api_type: 'firebase'
      })
    })
    .then(req => req.json())
    .then(json => json.id_token);
}

export function getRef(korks, cb, profile) {
  if (profile) {
    fetchDelegationToken().then(idToken => {
      const ref = new Firebase('https://island.firebaseio.com/' +
        profile.user_id + '/' + Utils.toKs(korks).join('/'));

      ref.authWithCustomToken(idToken, function(error, authData) {
        if (error) {
          cb({ error: error });
        } else {
          cb({ authData: authData, ref: ref });
        }
      });
    });
  } else {
    cb({ error: 'Not logged in'});
  }
}

export function pull(ref, successCb, errorCb) {
  ref.once("value", successCb, errorCb);
}

export function sync(ref, newValue, successCb, errorCb) {
  ref.set(newValue, function(error) {
    if (error) {
      errorCb(error);
    } else {
      successCb(newValue);
    }
  })
}
