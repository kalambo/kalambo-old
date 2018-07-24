import * as React from 'react';
import { css, Div, Icon, Txt } from 'elmnt';
import r from 'refluent';
import { restyle } from 'common-client';

import icons from '../icons';

import AddField from './AddField';
import FilterField from './FilterField';
import LimitField from './LimitField';
import RemoveField from './RemoveField';
import SortField from './SortField';
import PageField from './PageField';

export default r
  .yield(({ next }) => next(props => props))
  .do(
    restyle(
      'alt',
      props => props.name === '',
      props => props.isPathSort || props.isSiblingSort,
      props => props.isPathRemove || props.isChildRemove,
      props =>
        props.isPathAdd ||
        props.isLastPathAdd ||
        props.isPathSort ||
        props.isSiblingSort ||
        props.isPathRemove ||
        props.isChildRemove ||
        props.isPathPageUp ||
        props.isPathPageDown,
      (alt, empty, sort, remove, active, style) =>
        style.mergeKeys({ header: true, alt, empty, sort, remove, active }),
    ),
  )
  .do(
    restyle(
      'name',
      'path',
      'span',
      'firstCol',
      'lastCol',
      (name, path, span, firstCol, lastCol, style) => ({
        base: style,
        td: style
          .scale({
            paddingTop: {
              paddingTop: 1,
              borderTopWidth: span || name.startsWith('#') ? -1 : 0,
            },
            paddingLeft: {
              paddingLeft: 1,
              borderLeftWidth: span ? 1 : 0,
            },
            borderTopWidth: span || name.startsWith('#') ? 2 : 1,
            borderRightWidth: !lastCol && name === '#2' ? 1 : 0,
            borderBottomWidth: !span ? 2 : 0,
            borderLeftWidth:
              (!firstCol && (name === '#1' ? 2 : !span && 1)) || 0,
            ...(name === '' && path.indexOf('.') === -1
              ? {
                  borderTopWidth: 2,
                  borderRightWidth: 0,
                  borderBottomWidth: 0,
                  borderLeftWidth: 0,
                }
              : {}),
          })
          .merge({ position: 'relative', verticalAlign: 'top' }),
        fill: style
          .scale({
            top: { borderTopWidth: span || name.startsWith('#') ? -2 : -1 },
            right: {
              borderRightWidth: (!lastCol && (name === '#2' ? -2 : -1)) || 0,
            },
            bottom: { borderBottomWidth: !span ? -2 : -1 },
            left: {
              borderLeftWidth:
                (!firstCol && (name === '#1' ? -2 : !span && -1)) || 0,
            },
          })
          .filter('top', 'right', 'bottom', 'left')
          .merge({ position: 'absolute' }),
        icon: style
          .mergeKeys('icon')
          .filter(...css.groups.text, 'background')
          .scale({
            fontSize: 0.6,
            padding: { fontSize: 0.15 },
            radius: { fontSize: 0.375 },
          })
          .merge({ borderRadius: 100 }),
        text: style.filter(...css.groups.text).merge({
          cursor: 'default',
          position: 'relative',
          userSelect: 'none',
          MozUserSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
        }),
      }),
    ),
  )
  .do(
    'context',
    'live',
    ({ name, path }) => `${path}_${name}_width`,
    (context, live, key, push) =>
      live
        ? context.store.listen(key, width => push({ width }))
        : {
            setWidthElem: Object.assign(
              elem => context.setWidthElem(key, elem),
              { noCache: true },
            ),
          },
  )
  .yield(
    ({
      context,
      rowSpan,
      name,
      type,
      isList,
      span,
      path,
      sort,
      last,
      firstCol,
      lastCol,
      text,
      live,
      focused,
      isPathAdd,
      isLastPathAdd,
      isPathSort,
      isSiblingSort,
      isPathRemove,
      isChildRemove,
      isPathLimit,
      isPathFilter,
      isPathPageUp,
      isPathPageDown,
      setWidthElem,
      width,
      style,
    }) => (
      <td
        style={{ ...style.td, ...(live && !span ? { minWidth: width } : {}) }}
        colSpan={span || 1}
        rowSpan={rowSpan}
        ref={!span ? setWidthElem : undefined}
      >
        {live && (
          <div style={style.fill}>
            {span && (
              <div
                style={{
                  position: 'absolute',
                  top: style.base.borderTopWidth * 2,
                  right: 0,
                  bottom: style.base.borderBottomWidth,
                  width: style.base.borderLeftWidth,
                  background: style.td.background,
                  zIndex: 1,
                }}
              />
            )}
            {!span &&
              name !== '#2' &&
              !firstCol && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    ...(name
                      ? { width: style.base.borderLeftWidth }
                      : { right: 0 }),
                    bottom: 0,
                    left: 0,
                    zIndex: name ? 20 : 5,
                  }}
                >
                  <AddField
                    context={context}
                    wide={!name}
                    type={type}
                    path={path}
                    active={isPathAdd}
                    focused={isPathAdd && focused}
                    empty={name === ''}
                    style={style}
                  />
                </div>
              )}
            {last &&
              !lastCol && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: style.base.borderRightWidth,
                    zIndex: 20,
                  }}
                >
                  <AddField
                    context={context}
                    type={type}
                    path={last}
                    active={isLastPathAdd}
                    focused={isLastPathAdd && focused}
                    style={style}
                  />
                </div>
              )}
            {isSiblingSort && (
              <div
                style={{
                  position: 'absolute',
                  top: -style.base.borderTopWidth,
                  left: 0,
                  right: 0,
                  height: style.base.borderLeftWidth * 3,
                  background: style.icon.background,
                  zIndex: 10,
                }}
              />
            )}
            {name &&
              !isList &&
              !span &&
              !name.startsWith('#') && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    zIndex: 10,
                  }}
                >
                  <SortField
                    context={context}
                    sort={sort}
                    path={path}
                    active={isPathSort}
                    activeSibling={isSiblingSort}
                    style={style}
                  />
                </div>
              )}
            {!span &&
              isChildRemove && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    left: 0,
                    height: style.base.borderBottomWidth * 3,
                    background: style.icon.background,
                    zIndex: 1,
                  }}
                />
              )}
            {name &&
              !name.startsWith('#') && (
                <div
                  style={{
                    position: 'absolute',
                    ...(span
                      ? {
                          left: -style.base.paddingLeft,
                          right: -style.base.paddingRight,
                          top: -style.icon.radius,
                          bottom: style.base.borderTopWidth + style.icon.radius,
                        }
                      : { left: 0, right: 0, bottom: 0, height: '50%' }),
                    zIndex: span ? 4 : 10,
                  }}
                >
                  <RemoveField
                    context={context}
                    relation={span}
                    path={path}
                    active={isPathRemove}
                    style={style}
                  />
                </div>
              )}
            {name === '#1' &&
              isList && (
                <>
                  <PageField
                    up
                    context={context}
                    path={path}
                    active={isPathPageUp}
                    style={style}
                  />
                  <PageField
                    context={context}
                    path={path}
                    active={isPathPageDown}
                    style={style}
                  />
                </>
              )}
          </div>
        )}

        {name === '#1' &&
          isList && (
            <LimitField
              context={context}
              live={live}
              path={path}
              active={isPathLimit}
              focused={isPathLimit && focused}
              style={style}
            />
          )}
        {!name.startsWith('#') && (
          <Div
            style={{ spacing: style.base.paddingRight * 1.5, layout: 'bar' }}
          >
            {name === '' && path !== '0' && path.indexOf('.') === -1 ? (
              <Icon {...icons.plus} style={style.text} />
            ) : (
              <Txt style={style.text}>{text}</Txt>
            )}
            {span && (
              <FilterField
                context={context}
                live={live}
                type={type}
                path={path}
                active={isPathFilter}
                focused={isPathFilter && focused}
                style={style}
              />
            )}
          </Div>
        )}
      </td>
    ),
  );
