import * as React from 'react';
import r from 'refluent';
import { restyle, root } from 'common-client';

import createQuery from './createQuery';
import Footer from './Footer';
import jsonUrl from './jsonUrl';
import Table from './Table';

const initStore = (printFilter, store, fields, type?, path?) =>
  fields.forEach((f, i) => {
    if (typeof f !== 'string') {
      const newType = type
        ? (root.rgo.schema[type][f.name] as any).type
        : f.name;
      const newPath = path ? `${path}.${i}` : `${i}`;
      if (f.filter) {
        store.set(`${newPath}_filter`, printFilter(f.filter, newType));
      }
      store.set(`${newPath}_start`, (f.start || 0) + 1);
      if (f.end) store.set(`${newPath}_end`, f.end);
      initStore(printFilter, store, f.fields || [], newType, newPath);
    }
  });

const addAliases = (fields, alias = '') =>
  fields.map((f, i) => {
    if (typeof f === 'string') return f;
    const newAlias = `${alias}_${i}`;
    return {
      ...f,
      alias: newAlias,
      fields: addAliases(f.fields, newAlias),
    };
  });

const addIds = fields =>
  fields.map(f => {
    if (typeof f === 'string') return f;
    return {
      ...f,
      fields: f.fields.includes('id')
        ? addIds(f.fields)
        : ['id', ...addIds(f.fields)],
    };
  });

export default r
  .do(
    restyle(style => ({
      base: style
        .numeric('paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft')
        .scale({
          borderTopWidth: { borderTopWidth: 0.5, borderBottomWidth: 0.5 },
          borderRightWidth: { borderLeftWidth: 0.5, borderRightWidth: 0.5 },
          borderBottomWidth: { borderTopWidth: 0.5, borderBottomWidth: 0.5 },
          borderLeftWidth: { borderLeftWidth: 0.5, borderRightWidth: 0.5 },
        }),
      footer: style.scale({
        height: {
          fontSize: 1,
          paddingTop: 1,
          paddingBottom: 1,
          borderTopWidth: 2,
          borderBottomWidth: 2,
        },
      }),
    })),
  )
  .do((_, push) => {
    root.rgo.query().then(() => push({ loading: false }));
    return {
      loading: true,
      reset: () => push({ isReset: true }, () => push({ isReset: false })),
    };
  })
  .yield(
    ({ loading, isReset, loader, next }) =>
      loading || isReset ? loader() : next(),
  )
  .do((props$, push) => {
    const values = {};
    const listeners = {};
    const set = (key, value?) => {
      if (value !== values[key]) {
        if (value === undefined) delete values[key];
        else values[key] = value;
        listeners[''] && listeners[''].forEach(l => l(values));
        listeners[key] && listeners[key].forEach(l => l(value));
      }
    };
    const store = {
      get: key => values[key],
      set,
      update: (key, map: (v) => any) => set(key, map(values[key])),
      listen: (key, listener) => {
        listener(key ? values[key] : values);
        listeners[key] = listeners[key] || [];
        listeners[key].push(listener);
        return () => listeners[key].splice(listeners[key].indexOf(listener), 1);
      },
    };

    let unsubscribe;
    const query = createQuery(
      props$().query || jsonUrl.parse(location.search.slice(1)) || [],
      q => {
        initStore(props$().config.printFilter, store, q);
        const aliasQuery = addAliases(q);
        push({ query: aliasQuery, linkQuery: [...q] });
        if (unsubscribe) unsubscribe();
        unsubscribe = root.rgo.query(...addIds(aliasQuery), data => {
          if (!data) {
            push({ fetching: true });
          } else {
            push({ data: { ...data } }, () =>
              setTimeout(() => push({ fetching: false })),
            );
          }
        });
      },
    );

    const widthElems = {};
    const setWidthElem = (key, elem) => {
      if (elem) {
        widthElems[key] = elem;
      } else {
        delete widthElems[key];
        store.set(key);
      }
    };
    const updateWidths = () => {
      Object.keys(widthElems).forEach(key =>
        store.set(key, widthElems[key].getBoundingClientRect().width),
      );
    };
    store.listen('', () => setTimeout(updateWidths));
    props$().resizer && props$().resizer(updateWidths);

    props$(
      'config',
      'types',
      'meta',
      'editable',
      'input',
      'permalink',
      'logOut',
      'fileServer',
      'reset',
      (
        config,
        types,
        meta = {},
        editable,
        input,
        permalink,
        logOut,
        fileServer,
        reset,
      ) => ({
        context: {
          config,
          types,
          meta,
          editable,
          input,
          permalink,
          logOut,
          fileServer,
          reset,
          store,
          query,
          setWidthElem,
          updateWidths,
          setActive: (active, focus) => {
            store.update(
              'header',
              (state = {}) =>
                state.activeFocus && !focus
                  ? state
                  : {
                      activeFocus: active && focus,
                      activeType: active && active.type,
                      activePath: active && active.path,
                    },
            );
          },
        },
      }),
    );

    return unsubscribe;
  })
  .yield(
    ({ query, data, loader, next }) => (!query || !data ? loader() : next()),
  )
  .yield(({ context, query, fetching, data, style, linkQuery }) => (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        paddingBottom: 10 + style.footer.height,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          whiteSpace: 'nowrap',
          overflow: 'auto',
        }}
      >
        {Array.from({ length: query.length + 1 }).map((_, i) => (
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'top',
              height: '100%',
              paddingLeft: i !== 0 ? 30 : 0,
            }}
            key={i}
          >
            <Table
              context={context}
              query={query[i] ? [query[i]] : []}
              fetching={fetching}
              data={data}
              index={i}
              style={style.base}
            />
          </div>
        ))}
      </div>
      <Footer
        context={context}
        query={query}
        linkQuery={linkQuery}
        data={data}
        style={style.footer}
      />
    </div>
  ));
