import { noUndef, root } from 'common-client';

const dataToRows = (
  context,
  fields,
  data,
  type = null as null | string,
  start = 0,
  initial = true,
  first = true,
) => {
  const dataArray = Array.isArray(data) ? data : [data];
  if (dataArray.length === 0) dataArray.push(undefined);
  return dataArray.reduce((result, values, i) => {
    const dataBlocks = fields.map((f, j) => {
      if (typeof f === 'string') {
        const value = noUndef(values && values[f]);
        const editable =
          values &&
          f !== '' &&
          !f.startsWith('#') &&
          f !== 'id' &&
          context.editable(type, f);
        const schemaField = type && {
          ...root.rgo.schema[type][f],
          meta: {
            ...root.rgo.schema[type][f],
            ...((context.meta[type] && context.meta[type][f]) ||
              {}),
          },
        };
        return [
          [
            {
              type,
              id: values && values.id,
              field: f,
              key: editable ? `${type}.${values && values.id}.${f}` : '',
              value,
              text:
                f === '' || values === undefined
                  ? ''
                  : f.startsWith('#')
                    ? `${start + i + 1}`
                    : context.config.printValue(
                        value,
                        f === 'id' ? { scalar: 'string' } : schemaField,
                      ),
              link:
                schemaField &&
                schemaField.meta &&
                schemaField.meta.file &&
                value &&
                `${context.fileServer}/storage/file/${value.split(':')[0]}`,
              first: first && i === 0,
              firstCol: f === '#0',
              lastCol: f === '#3',
            },
          ],
        ];
      }
      return dataToRows(
        context,
        [
          initial && j === 0 ? '#0' : '#1',
          ...(f.fields.length === 0 ? [''] : f.fields),
          initial && j === fields.length - 1 ? '#3' : '#2',
        ],
        (values || {})[f.alias || f.name],
        type ? (root.rgo.schema[type][f.name] as any).type : f.name,
        f.start || 0,
        false,
        first && i === 0,
      );
    });
    const height = Math.max(...dataBlocks.map(rows => rows.length));
    return [
      ...result,
      ...dataBlocks.reduce((res, rows) => {
        rows.forEach((row, j) => {
          res[j] = [
            ...(res[j] || []),
            ...row.map(
              v => (v.span === undefined ? { ...v, span: height } : v),
            ),
          ];
        });
        if (rows[0][0].span !== undefined && height > rows.length) {
          res[rows.length] = [
            ...(res[rows.length] || []),
            ...Array.from({ length: rows[0].length }).map((_, j) => ({
              type: rows[0][j].type,
              field: rows[0][j].field,
              span: height - rows.length,
              first: false,
              empty: true,
            })),
          ];
        }
        return res;
      }, []),
    ];
  }, []);
};

export default dataToRows;
