export const isUndefined = o => typeof o === 'undefined';

export const isMirror = s => s.raw.length === 1 && s.raw[0] === '';
