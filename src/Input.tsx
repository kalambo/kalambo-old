import * as React from 'react';
import r from 'refluent';
import { Input } from 'elmnt';
import { isValid } from 'common';
import { restyle, root } from 'common-client';

export default r
  .do('dataKey', 'context', (dataKey, context) => {
    const { meta = {}, ...field } = root.rgo.schema[dataKey[0]][dataKey[2]];
    const rules = {
      ...field,
      ...meta,
      ...((context.meta[dataKey[0]] && context.meta[dataKey[0]][dataKey[2]]) ||
        {}),
      optional: true,
    };
    const { scalar, isList, file, ...info } = rules;
    return {
      ...info,
      type: `${file ? 'file' : scalar || 'string'}${isList ? 'list' : ''}`,
      ...(!isList && Array.isArray(info.options)
        ? {
            options:
              info.options &&
              (!info.options.includes(null)
                ? [...info.options, null]
                : info.options),
            labels:
              info.labels &&
              (!info.options.includes(null)
                ? [...info.labels, '-- None --']
                : info.labels),
          }
        : {}),
      rules,
      dataKey: undefined,
    };
  })
  .do(
    restyle('type', 'options', (type, options, style) => {
      const input = Array.isArray(options)
        ? style.merge({ layout: 'modal' })
        : style;
      return {
        margin: input.scale({
          margin: {
            borderWidth: -1,
            ...(type === 'boolean' ? { padding: 0.6 } : {}),
          },
        }),
        fill: input
          .scale({
            top: {
              borderTopWidth: -1,
              ...(type === 'boolean' ? { paddingTop: 0.6 } : {}),
            },
            right: {
              borderRightWidth: -1,
              ...(type === 'boolean' ? { paddingRight: 0.6 } : {}),
            },
            bottom: {
              borderBottomWidth: -1,
              ...(type === 'boolean' ? { paddingBottom: 0.6 } : {}),
            },
            left: {
              borderLeftWidth: -1,
              ...(type === 'boolean' ? { paddingLeft: 0.6 } : {}),
            },
          })
          .merge({ position: 'absolute' }),
      };
    }),
  )
  .do('context', (context, push) => {
    push({
      onChange: value =>
        context.store.update('editing', v => ({ ...v, value })),
      onTextChange: text => {
        push({ text });
        setTimeout(() => context.updateWidths());
      },
    });
    let lastValue = context.store.get('editing').value;
    return context.store.listen('editing', (editing = {} as any) =>
      push({
        value:
          Object.keys(editing).length > 0
            ? (lastValue = editing.value)
            : lastValue,
      }),
    );
  })
  .do('value', 'rules', 'onBlur', (value, rules, onBlur) => {
    const invalid = !isValid(rules, value, {});
    return {
      invalid,
      onBlur: () => onBlur(invalid),
      onKeyDown: e => (e.keyCode === 13 || e.keyCode === 27) && onBlur(invalid),
      rules: undefined,
    };
  })
  .yield(
    ({
      context: _,
      value,
      onChange,
      text,
      onTextChange,
      onBlur,
      onKeyDown,
      inputRef,
      style,
      ...props
    }) => (
      <div onKeyDown={onKeyDown}>
        <Input
          value={['int', 'float', 'date'].includes(props.type) ? text : value}
          onChange={onChange}
          style={style.margin}
          spellCheck={false}
          {...props}
          {...(['int', 'float', 'date'].includes(props.type)
            ? { type: 'string' }
            : {})}
          {...(props.type === 'date' ? { iconRight: 'tick' } : {})}
        />
        <Input
          value={value}
          onChange={onChange}
          onTextChange={onTextChange}
          style={style.fill}
          spellCheck={false}
          onBlur={onBlur}
          ref={inputRef}
          {...props}
        />
      </div>
    ),
  );
