import Transit from 'transit-js';
import Immutable from 'Immutable';
import Moment from 'moment';

function momentReadHandler(x) {
  return Moment(parseInt(x));
}

const r = Transit.reader('json', {
  arrayBuilder: {
    init: function(node) { return Immutable.List().asMutable(); },
    add: function(ret, val, node) { return ret.push(val); },
    finalize: function(ret, node) { return ret.asImmutable(); },
    fromArray: function(arr, node) {
      return Immutable.fromJS(arr);
    }
  },
  mapBuilder: {
    init: function(node) { return Immutable.Map().asMutable(); },
    add: function(ret, key, val, node) { return ret.set(key, val); },
    finalize: function(ret, node) { return ret.asImmutable(); }
  },
  handlers: { "m": momentReadHandler }
});

const MomentWriteHandler = Transit.makeWriteHandler({
  tag: function(v, h) { return "m" },
  rep: function(v, h) { return v.valueOf().toString(); },
  stringRep: function(v, h) { return h.rep(v); }
});

const w = Transit.writer('json', {
  handlers: Transit.map([Moment().constructor, MomentWriteHandler])
});

export function read(json) { return r.read(json); }

export function write(v) { return w.write(v); }
