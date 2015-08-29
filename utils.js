export function roundAndTrim(x, d) {
  const fixed = x.toFixed(d);
  const fixedZero = x.toFixed(0);

  return ((fixed * 1) === (fixedZero * 1) ? fixedZero : fixed) * 1;
}

export function toKs(korks) {
  return (Array.isArray(korks) ? korks : [korks]);
}

export function range(start, end, step) {
  var ar = [];
  if (start < end) {
    if (arguments.length == 2) step = 1;
    for (var i = start; i <= end; i += step) {
      ar.push(i);
    }
  }
  else {
    if (arguments.length == 2) step = -1;
    for (var i = start; i >= end; i += step) {
      ar.push(i);
    }
  }
  return ar;
}
