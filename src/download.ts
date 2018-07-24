import { noUndef, root } from 'common-client';

const csvHeader = (
  config,
  types,
  { sort = [] as string[], fields },
  type = null as null | string,
) => {
  if (fields.length === 0) return [['Add field']];
  const blocks = fields.map(f => {
    if (typeof f === 'string') {
      const fieldName = type
        ? types[type].fields.find(x => x[0] === f)[1]
        : types[f].name;
      const fieldSort = sort.includes(f)
        ? 'asc'
        : sort.includes(`-${f}`)
          ? 'desc'
          : '';
      return [[fieldSort ? `${fieldName} [${fieldSort}]` : fieldName]];
    }
    const fieldName = type
      ? types[type].fields.find(x => x[0] === f.name)[1]
      : types[f.name].name;
    const newType = type ? (root.rgo.schema[type][f.name] as any).type : f.name;
    const filter = config.printFilter(f.filter, newType);
    const rows = csvHeader(config, types, f, newType);
    return [
      [
        `${(f.start || 0) + 1}`,
        ...rows[0].map(
          (_, i) =>
            i === 0 ? (filter ? `${fieldName} (${filter})` : fieldName) : '',
        ),
      ],
      ...rows.map((row, i) => [i === 0 ? `${f.end || ''}` : '', ...row]),
    ];
  });
  const height = Math.max(...blocks.map(rows => rows.length));
  return blocks.reduce((res, rows) => {
    Array.from({ length: height }).forEach((_, i) => {
      res[i] = [...(res[i] || []), ...(rows[i] || rows[0].map(() => ''))];
    });
    return res;
  }, []);
};

const csvData = (
  config,
  fields,
  data,
  type = null as null | string,
  start = 0,
) => {
  const dataArray = Array.isArray(data) ? data : [data];
  if (dataArray.length === 0) dataArray.push(undefined);
  return dataArray.reduce((result, values, i) => {
    const blocks = fields.map(f => {
      if (typeof f === 'string') {
        const value = noUndef(values && values[f]);
        return [
          [
            f === '' || values === undefined
              ? ''
              : f.startsWith('#')
                ? `${start + i + 1}`
                : config.printValue(
                    value,
                    f === 'id'
                      ? { scalar: 'string' }
                      : root.rgo.schema[type!][f],
                  ),
          ],
        ];
      }
      return csvData(
        config,
        ['#', ...(f.fields.length === 0 ? [''] : f.fields)],
        (values || {})[f.alias || f.name],
        type ? (root.rgo.schema[type][f.name] as any).type : f.name,
        f.start || 0,
      );
    });
    const height = Math.max(...blocks.map(rows => rows.length));
    return [
      ...result,
      ...blocks.reduce((res, rows) => {
        Array.from({ length: height }).forEach((_, j) => {
          res[j] = [...(res[j] || []), ...(rows[j] || rows[0].map(() => ''))];
        });
        return res;
      }, []),
    ];
  }, []);
};

export default (config, types, query, data, filename = 'data') => {
  const blocks = query.map(q => [
    ...csvHeader(config, types, { fields: [q] }),
    ...csvData(config, [q], data),
  ]);

  const height = Math.max(...blocks.map(rows => rows.length));
  const allRows = blocks.reduce((res, rows, i) => {
    Array.from({ length: height }).forEach((_, j) => {
      res[j] = [
        ...(res[j] || []),
        ...(i === 0 ? [] : ['']),
        ...(rows[j] || rows[0].map(() => '')),
      ];
    });
    return res;
  }, []);

  const csv = allRows
    .map(row => row.map(s => `°${s.replace(/\n|\r/g, '\r\n')}°`).join(','))
    .join('\r\n')
    .replace(/"/g, '""')
    .replace(/°/g, '"');

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${csv}`));
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
