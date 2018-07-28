import * as React from 'react';
import * as ReactDOM from 'react-dom';
import r from 'refluent';
import { css } from 'elmnt';
import * as deepEqual from 'deep-equal';
import { restyle, root } from 'common-client';

import d3, { applyStyle } from './d3';
import dataToRows from './dataToRows';
import isolate from './isolate';

export default r
  .do(
    restyle(style => {
      const base = style
        .mergeKeys('data')
        .defaults({ fontStyle: 'normal', fontWeight: 'normal' })
        .scale({
          paddingTop: { paddingTop: 1, fontSize: 0.5, lineHeight: -0.5 },
          paddingBottom: {
            paddingBottom: 1,
            fontSize: 0.5,
            lineHeight: -0.5,
          },
        })
        .filter(
          ...css.groups.text,
          'padding',
          'border',
          'background',
          'maxWidth',
        )
        .merge({
          position: 'relative',
          verticalAlign: 'top',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        });
      return {
        base,
        null: base.mergeKeys('null'),
        empty: base.mergeKeys('empty'),
        fileLink: base.mergeKeys('fileLink').filter(...css.groups.text),
        changed: base.mergeKeys('changed'),
        input: style
          .mergeKeys('data', 'input')
          .scale({ maxWidth: { maxWidth: 1, borderLeftWidth: 1 } })
          .merge({ zIndex: 200 }),
      };
    }),
  )
  .do('context', 'query', 'data', (context, query, data) => ({
    dataRows: dataToRows(context, query, data),
  }))
  .do('context', (context, push) =>
    context.store.listen('editing', (editing = {} as any) =>
      push({ isEditing: !!editing.key }),
    ),
  )
  .do('context', (context, push) =>
    context.store.listen('unchanged', (unchanged = {}) => push({ unchanged })),
  )
  .yield(
    isolate((elem, props$) => {
      const Input = props$().context.input;

      const startEditing = (key, value) => {
        props$().context.store.set('editing', { key, value });
        props$().context.store.update('unchanged', (unchanged = {}) => ({
          ...unchanged,
          ...(unchanged[key] === undefined ? { [key]: value } : {}),
        }));
      };
      const stopEditing = invalid => {
        const { key, value } = props$().context.store.get('editing');
        props$().context.store.set('editing', {});
        props$().context.store.update(
          'unchanged',
          ({ [key]: v, ...unchanged }) => {
            if (deepEqual(v, value, { strict: true }) || invalid) {
              root.rgo.set({ key: key.split('.'), value: undefined });
              return unchanged;
            }
            root.rgo.set({ key: key.split('.'), value });
            return { ...unchanged, [key]: v };
          },
        );
      };

      let inputRef = null;
      const unlisten = props$().context.store.listen(
        'editing',
        (editing = {} as any) => {
          if (editing.key) {
            const splitKey = editing.key.split('.');
            const elems = elem.querySelectorAll(`[data-key='${editing.key}']`);
            for (let i = 0; i < elems.length; i++) {
              if (elems[i] !== inputRef) {
                elems[i].textContent = props$().context.config.printValue(
                  editing.value,
                  {
                    ...root.rgo.schema[splitKey[0]][splitKey[2]],
                    meta: {
                      ...root.rgo.schema[splitKey[0]][splitKey[2]],
                      ...((props$().context.meta[splitKey[0]] &&
                        props$().context.meta[splitKey[0]][splitKey[2]]) ||
                        {}),
                    },
                  },
                );
              }
            }
          }
        },
      );

      props$(
        'context',
        'dataRows',
        'style',
        'isEditing',
        'unchanged',
        (context, dataRows, style, _, unchanged) => {
          const editing = context.store.get('editing') || {};

          const rows = d3
            .select(elem)
            .selectAll('tr')
            .data([...dataRows]);

          rows
            .exit()
            .selectAll('td')
            .each(function() {
              ReactDOM.unmountComponentAtNode(this);
            });
          rows.exit().remove();

          const allRows = rows
            .enter()
            .append('tr')
            .merge(rows);

          const cells = allRows.selectAll('td').data(d => d);

          cells
            .exit()
            .each(function() {
              ReactDOM.unmountComponentAtNode(this);
            })
            .remove();

          const allCells = cells
            .enter()
            .append('td')
            .merge(cells)
            .datum(d => ({
              ...d,
              style:
                inputRef !== this && Object.keys(unchanged).includes(d.key)
                  ? 'changed'
                  : d.empty
                    ? 'empty'
                    : d.field.startsWith('#') || d.value === null
                      ? 'null'
                      : 'base',
            }))
            .style(d => style[d.style])
            .style(d => ({
              borderTopWidth: (!d.first ? 1 : 0) * style.base.borderTopWidth,
              borderBottomWidth: 0,
              borderLeftWidth:
                ((!d.firstCol && (d.field === '#1' ? 2 : 1)) || 0) *
                style.base.borderLeftWidth,
              borderRightWidth:
                ((!d.lastCol && d.field === '#2' && 1) || 0) *
                style.base.borderRightWidth,
            }))
            .attr('rowspan', d => d.span)
            .attr('data-key', d => d.key);

          allCells
            .filter(({ key }) => key)
            .style({ cursor: 'pointer' })
            .on('mouseenter', function(d) {
              const s = style[d.style];
              this.style.background =
                (s.hover && s.hover.background) || s.background;
            })
            .on('mouseleave', function(d) {
              this.style.background = style[d.style].background;
            })
            .on('dblclick', function({ key, value }) {
              startEditing(key, value);
              inputRef = this;
            })
            .each(function({ type, field, key, text }) {
              if (inputRef === this) {
                this.style.padding = null;
                ReactDOM.render(
                  <Input
                    context={context}
                    dataKey={key.split('.')}
                    onBlur={invalid => {
                      stopEditing(invalid);
                      if (inputRef === this) inputRef = null;
                    }}
                    inputRef={elem => {
                      if (elem && inputRef === this) elem.focus();
                    }}
                    style={style.input}
                  />,
                  this,
                );
              } else {
                ReactDOM.unmountComponentAtNode(this);
                if (editing.key === key) {
                  this.textContent = context.config.printValue(editing.value, {
                    ...root.rgo.schema[type][field],
                    meta: {
                      ...root.rgo.schema[type][field],
                      ...((context.meta[type] && context.meta[type][field]) ||
                        {}),
                    },
                  });
                } else {
                  this.textContent = text;
                }
              }
            });

          allCells
            .filter(({ key }) => !key)
            .style({ cursor: null })
            .on('mouseenter', null)
            .on('mouseleave', null)
            .on('dblclick', null)
            .each(function({ text, link }) {
              ReactDOM.unmountComponentAtNode(this);
              this.textContent = link ? '' : text;
              if (link) {
                const a = document.createElement('a');
                a.textContent = text;
                a.href = link;
                a.target = '_blank';
                applyStyle(a, style.fileLink);
                this.appendChild(a);
              }
            });

          context.updateWidths();
        },
      );

      return () => {
        unlisten();
        d3.select(elem)
          .selectAll('tr')
          .selectAll('td')
          .each(function() {
            ReactDOM.unmountComponentAtNode(this);
          });
      };
    }, 'tbody'),
  );
