const encode = s =>
  !/[^\w-.]/.test(s)
    ? s
    : s.replace(/[^\w-.]/g, c => {
        if (c === '$') return '!';
        const code = c.charCodeAt(0);
        return code < 0x100
          ? `*${`00${code.toString(16)}`.slice(-2)}`
          : `**${`0000${code.toString(16)}`.slice(-4)}`;
      });

const stringify = v => {
  switch (typeof v) {
    case 'number':
      return isFinite(v) ? '~' + v : '~null';
    case 'boolean':
      return '~' + v;
    case 'string':
      return '~"' + encode(v);
    case 'object':
      if (!v) return '~null';
      return `~(${
        Array.isArray(v)
          ? v.map(x => stringify(x) || '~null').join('') || '~'
          : Object.keys(v)
              .map(k => {
                const s = stringify(v[k]);
                return s && `${encode(k)}${s}`;
              })
              .filter(s => s)
              .join('~')
      })`;
    default:
      return;
  }
};

const reserved = { true: true, false: false, null: null };

const parse = str => {
  try {
    if (!str) return null;
    const s = str.replace(/%(25)*22/g, '"');
    let i = 0;

    const eat = ex => {
      const c = s.charAt(i);
      if (c !== ex)
        throw new Error(`bad JSURL syntax: expected ${ex}, got ${c}`);
      i++;
    };

    const decode = () => {
      let beg = i;
      let ch;
      let r = '';
      while (i < s.length && (ch = s.charAt(i)) !== '~' && ch !== ')') {
        switch (ch) {
          case '*':
            if (beg < i) r += s.substring(beg, i);
            if (s.charAt(i + 1) === '*') {
              r += String.fromCharCode(parseInt(s.substring(i + 2, i + 6), 16));
              beg = i += 6;
            } else {
              r += String.fromCharCode(parseInt(s.substring(i + 1, i + 3), 16));
              beg = i += 3;
            }
            break;
          case '!':
            if (beg < i) r += s.substring(beg, i);
            r += '$';
            beg = ++i;
            break;
          default:
            i++;
        }
      }
      return r + s.substring(beg, i);
    };

    const parseOne = () => {
      eat('~');
      const ch = s.charAt(i);
      let result;
      switch (ch) {
        case '(':
          i++;
          if (s.charAt(i) === '~') {
            result = [];
            if (s.charAt(i + 1) === ')') {
              i++;
            } else {
              do {
                result.push(parseOne());
              } while (s.charAt(i) === '~');
            }
          } else {
            result = {};
            if (s.charAt(i) !== ')') {
              do {
                const key = decode();
                result[key] = parseOne();
              } while (s.charAt(i) === '~' && ++i);
            }
          }
          eat(')');
          break;
        case '"':
          i++;
          result = decode();
          break;
        default:
          const beg = i++;
          while (i < s.length && /[^)~]/.test(s.charAt(i))) i++;
          const sub = s.substring(beg, i);
          if (/[\d\-]/.test(ch)) {
            result = parseFloat(sub);
          } else {
            result = reserved[sub];
            if (typeof result === 'undefined') {
              throw new Error(`bad value keyword: ${sub}`);
            }
          }
      }
      return result;
    };
    return parseOne();
  } catch (error) {
    return null;
  }
};

export default { stringify, parse };
