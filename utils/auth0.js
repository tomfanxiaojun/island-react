export function handleGetProfile(actions, err, profile) {
  if (err) {
    console.log("Error loading the Profile: ", err);
    actions.signOut();
  } else {
    actions.signIn(profile);
    actions.firebaseSync();
  }
}

export function getIdToken(lock) {
  const idToken = localStorage.getItem('userToken');
  const authHash = lock.parseHash();
  const newIdToken = authHash ? authHash.id_token : null;

  if (!idToken && authHash) {
    if (newIdToken) {
      localStorage.setItem('userToken', newIdToken);
    }

    if (authHash.error) {
      console.log('Error signing in', authHash);
    }
  }
  return idToken || newIdToken;
}

export function getProfile(lock, actions) {
  const idToken = getIdToken(lock);
  if (idToken) {
    history.replaceState('', '', location.pathname);
    lock.getProfile(idToken, function(err, profile) {
      handleGetProfile(actions, err, profile)
    });
  }
}
