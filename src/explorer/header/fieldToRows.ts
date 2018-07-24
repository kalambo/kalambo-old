import { fieldIs } from 'rgo';
import { root } from 'common-client';

const fieldToRows = (
  context,
  { sort = [] as any, fields },
  type,
  path,
  baseIndex = 0,
) =>
  fields.length === 0
    ? [
        [
          {
            name: '',
            type,
            path: path ? `${path}.${0}` : `${baseIndex}`,
            text: !path && !baseIndex ? 'Explore' : 'Add field',
          },
        ],
      ]
    : fields.reduce(
        (rows, f, i) => {
          const newPath = path ? `${path}.${i}` : `${baseIndex + i}`;
          const nextPath = path ? `${path}.${i + 1}` : `${baseIndex + i + 1}`;
          if (typeof f === 'string') {
            rows[0].push({
              name: f,
              type,
              isList: f !== 'id' && (root.rgo.schema[type!][f] as any).isList,
              path: newPath,
              sort: sort.includes(f)
                ? 'asc'
                : sort.includes(`-${f}`)
                  ? 'desc'
                  : null,
              last: i === fields.length - 1 && nextPath,
              text: context.types[type].fields.find(x => x[0] === f)[1],
            });
            return rows;
          }
          const newType = type
            ? (root.rgo.schema[type][f.name] as any).type
            : f.name;
          const newRows = fieldToRows(context, f, newType, newPath);
          const fieldSchema = type && root.rgo.schema[type][f.name];
          rows[0].push(
            {
              name: '#1',
              type: type,
              isList:
                !fieldSchema ||
                fieldIs.foreignRelation(fieldSchema) ||
                fieldSchema.isList,
              path: newPath,
              firstCol: i === 0 && !path,
            },
            {
              name: f.name,
              type: newType,
              path: newPath,
              span: newRows[0].reduce((res, g) => res + (g.span || 1), 0),
              text: type
                ? context.types[type].fields.find(x => x[0] === f.name)[1]
                : context.types[f.name].name,
            },
            {
              name: '#2',
              type: type,
              path: `${newPath}.${
                newRows[0].filter(d => !d.name.startsWith('#')).length
              }`,
              last: i === fields.length - 1 && nextPath,
              lastCol: i === fields.length - 1 && !path,
            },
          );
          newRows.forEach((r, j) => {
            rows[j + 1] = [...(rows[j + 1] || []), ...r];
          });
          return rows;
        },
        [[]],
      );

export default fieldToRows;
