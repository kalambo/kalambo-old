import * as React from 'react';
import { css, Div, Icon, Input } from 'elmnt';
import r from 'refluent';
import { clickOutsideRef, restyle } from 'common-client';

import icons from '../icons';

export default r
  .do('context', 'path', (context, path, push) =>
    context.store.listen(`${path}_filter`, (text = '') => push({ text })),
  )
  .do((props$, _) => {
    let inputElem;
    let filter;
    props$('text', text => ({ invalid: text && !filter }));
    return {
      setInputElem: e => (inputElem = e),
      setText: text => {
        const { context, type, path } = props$();
        filter = context.config.parseFilter(text, type);
        context.store.set(`${path}_filter`, text);
      },
      onMouseMove: () => {
        const { context, path } = props$();
        context.setActive({ type: 'filter', path });
      },
      onMouseLeave: () => {
        const { context } = props$();
        context.setActive(null);
      },
      onClick: () => {
        const { context, path } = props$();
        context.setActive({ type: 'filter', path }, true);
        inputElem && inputElem.focus();
      },
      onClickOutside: () => {
        const { context, path, focused, $invalid } = props$();
        if (focused) {
          if (!$invalid) {
            context.query.filter(path, filter);
            context.setActive(null, true);
          }
          return true;
        }
      },
      onKeyDown: event => {
        const { context, path, focused, $invalid } = props$();
        if (focused && event.keyCode === 13 && !$invalid) {
          context.query.filter(path, filter);
          context.setActive(null, true);
          (document.activeElement as HTMLElement).blur();
        }
      },
    };
  })
  .do(
    restyle(
      'active',
      'focused',
      'invalid',
      (active, focused, invalid, style) => {
        const input = style.base.mergeKeys({
          input: true,
          hover: active,
          focus: focused,
          invalid,
        });
        return {
          ...style,
          input,
          div: input
            .scale({ margin: { padding: -1 } })
            .filter('margin', 'background')
            .merge({ position: 'relative' }),
          bar: input
            .scale({ minWidth: { fontSize: 5 } })
            .filter('minWidth')
            .merge({
              layout: 'bar',
              position: 'relative',
              zIndex: focused ? 30 : 5,
            }),
          filterIcon: input
            .scale({ fontSize: 0.8 })
            .filter('color', 'fontSize', 'padding'),
          iconWidth: input.scale({
            width: { fontSize: 0.8, paddingLeft: 0.5, paddingRight: 0.5 },
          }),
          text: input
            .filter(...css.groups.text, 'padding')
            .scale({ paddingRight: 2 }),
        };
      },
    ),
  )
  .do((props$, _) => ({
    setClickElem: clickOutsideRef(() => props$().onClickOutside()),
  }))
  .yield(
    ({
      live,
      text,
      setText,
      focused,
      onMouseMove,
      onMouseLeave,
      onClick,
      setClickElem,
      onKeyDown,
      setInputElem,
      style,
    }) => (
      <div onKeyDown={onKeyDown} style={style.div} ref={setClickElem}>
        <Div style={style.bar}>
          <div style={{ width: style.iconWidth.width }}>
            <Icon {...icons.filter} style={style.filterIcon} />
          </div>
          <Input
            type="string"
            value={text}
            onChange={setText}
            spellCheck={false}
            style={style.text}
            ref={setInputElem}
          />
        </Div>
        {live &&
          !focused && (
            <div
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
              onClick={onClick}
              style={{
                position: 'absolute',
                top:
                  -(style.base.paddingTop + style.div.marginTop) -
                  style.base.borderTopWidth -
                  style.icon.radius,
                right:
                  -(style.base.paddingRight + style.div.marginRight) -
                  style.base.borderRightWidth,
                bottom:
                  -(style.base.paddingBottom + style.div.marginBottom) -
                  style.base.borderBottomWidth,
                left:
                  -(style.base.paddingLeft + style.div.marginLeft) -
                  style.base.borderLeftWidth,
                cursor: 'pointer',
                // background: 'rgba(255,0,0,0.1)',
                zIndex: 5,
              }}
            />
          )}
      </div>
    ),
  );
