import Immutable from 'Immutable';
import Moment from 'moment';

export function arrive(pAndQ) {
  const token = pAndQ || window.location.pathname;
  const tokenArr = token ? token.split('/').filter(x => x.length > 0) : [];

  switch (tokenArr.length) {
    case 1: return Immutable.Map({ name: 'month', month: tokenArr[0] });
    case 2: return Immutable.Map({ name: 'day', month: tokenArr[0], date: tokenArr[1] })
    default: return Immutable.Map({ name: 'day', date: Moment() });
  }
}
