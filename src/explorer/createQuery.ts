import { fieldIs } from 'rgo';
import { ejson, root } from 'common-client';

export default (initial, onUpdate) => {
  let query = initial && ejson.parse(ejson.stringify(initial));
  onUpdate(query);
  return {
    filter: (path, filter) => {
      const splitPath = path.split('.');
      const f = splitPath.reduce((res, i) => res.fields[i], {
        fields: query,
      });
      f.filter = filter;
      if (!f.filter) delete f.filter;
      onUpdate(query);
    },
    sort: path => {
      const splitPath = path.split('.');
      const index = splitPath[splitPath.length - 1];
      const parent = splitPath
        .slice(0, -1)
        .reduce((res, i) => res.fields[i], { fields: query });
      const f = parent.fields[index];
      const ascIndex = (parent.sort || []).indexOf(f);
      const descIndex = (parent.sort || []).indexOf(`-${f}`);
      if (ascIndex !== -1) {
        parent.sort[ascIndex] = `-${f}`;
      } else if (descIndex !== -1) {
        parent.sort.splice(descIndex, 1);
        if (parent.sort.length === 0) delete parent.sort;
      } else if (!parent.sort) {
        parent.sort = [f];
      } else {
        let i = 0;
        while (i !== -1) {
          const s = parent.sort[i];
          if (
            i === parent.sort.length ||
            parent.fields.indexOf(s[0] === '-' ? s.slice(1) : s) > index
          ) {
            parent.sort.splice(i, 0, f);
            i = -1;
          } else {
            i++;
          }
        }
      }
      onUpdate(query);
    },
    limit: (path, start, end) => {
      const splitPath = path.split('.');
      const f = splitPath.reduce((res, i) => res.fields[i], {
        fields: query,
      });
      f.start = start;
      if (!f.start) delete f.start;
      f.end = end;
      if (!f.end) delete f.end;
      onUpdate(query);
    },
    add: (path, type, field) => {
      const splitPath = path.split('.');
      const index = parseInt(splitPath[splitPath.length - 1], 10);
      const parent = splitPath
        .slice(0, -1)
        .reduce((res, i) => res.fields[i], { fields: query });
      const fieldSchema =
        type &&
        (root.rgo.schema[type][field] || {
          scalar: 'string',
        });
      const isList =
        !fieldSchema ||
        fieldIs.foreignRelation(fieldSchema) ||
        fieldSchema.isList;
      parent.fields.splice(
        index,
        0,
        field === 'id' || (type && fieldIs.scalar(fieldSchema))
          ? field
          : isList
            ? {
                name: field,
                end: path.split('.').length === 1 ? 100 : 10,
                fields: [],
              }
            : { name: field, fields: [] },
      );
      onUpdate(query, (!fieldSchema || !fieldIs.scalar(fieldSchema)) && path);
    },
    remove: path => {
      const splitPath = path.split('.');
      const index = parseInt(splitPath[splitPath.length - 1], 10);
      const parent = splitPath
        .slice(0, -1)
        .reduce((res, i) => res.fields[i], { fields: query });

      const f = parent.fields[index];
      if (parent.fields.filter(x => x === f).length === 1) {
        const ascIndex = (parent.sort || []).indexOf(f);
        const descIndex = (parent.sort || []).indexOf(`-${f}`);
        if (ascIndex !== -1) parent.sort.splice(ascIndex, 1);
        else if (descIndex !== -1) parent.sort.splice(descIndex, 1);
        if (parent.sort && parent.sort.length === 0) delete parent.sort;
      }

      parent.fields.splice(index, 1);
      onUpdate(query);
    },
  };
};
