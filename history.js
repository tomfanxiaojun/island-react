import URI from 'jsuri';
import { arrive } from './routes';

export function navigate(route, actions) {
  actions.navigate(route);
}

export function navigateTo(actions, uriStr, title, e) {
  var uri = new URI(uriStr),
    uriPath = uri.path(),
    uriQuery = uri.query(),
    pAndQ = uriPath + (uriQuery.length ? '?' + uriQuery : ''),
    route = arrive(pAndQ);

  if (uriPath && route) {

    if (e) { e.preventDefault() }
    navigate(route, actions);
    window.history.pushState(null, title, pAndQ);
  }
}

export function init(actions) {
  window.addEventListener("popstate", function(e) {
    var uri = new URI(document.location),
      uriPath = uri.path(),
      uriQuery = uri.query(),
      pAndQ = uriPath + (uriQuery.length ? '?' + uriQuery : '');

    navigate(arrive(pAndQ), actions);
  });

  window.addEventListener('click', function(e) {
    navigateTo(actions, e.target.href, e.target.title, e);
  });
}
