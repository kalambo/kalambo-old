import * as React from 'react';
import { Icon } from 'elmnt';
import r from 'refluent';

import icons from '../icons';

export default r
  .do('context', 'path', (context, path, push) => {
    const unlistens = [
      context.store.listen(`${path}_start`, (start = 1) => push({ start })),
      context.store.listen(`${path}_end`, (end = null) => push({ end })),
    ];
    return () => unlistens.forEach(u => u());
  })
  .do('up', 'start', 'end', (up, start, end) => ({
    show: up ? start && start > 1 && end : end,
  }))
  .do((props$, _) => ({
    onMouseMove: () => {
      const { context, path, up } = props$();
      context.setActive({
        type: up ? 'pageup' : 'pagedown',
        path,
      });
    },
    onMouseLeave: () => {
      const { context } = props$();
      context.setActive(null);
    },
    onClick: () => {
      const { context, path, up, start, end } = props$();
      const move = up
        ? -Math.min(start - 1, end - (start || 1) + 1)
        : end - (start || 1) + 1;
      const newStart = (start || 1) + move;
      const newEnd = end + move;
      context.store.set(`${path}_start`, newStart);
      context.store.set(`${path}_end`, newEnd);
      context.query.limit(path, newStart - 1, newEnd);
    },
  }))
  .yield(({ show, next }) => (show ? next() : null))
  .yield(({ up, active, onMouseMove, onMouseLeave, onClick, style }) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 21,
        ...(up
          ? { top: 0, height: style.base.paddingTop * 2.2 }
          : { bottom: 0, height: style.base.paddingBottom * 2.2 }),
      }}
    >
      {active && (
        <>
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              left: 0,
              height: style.base.borderBottomWidth * 3,
              background: style.icon.background,
              ...(up ? { top: 0 } : { bottom: 0 }),
            }}
          />
          <Icon
            {...(up ? icons.up : icons.down)}
            style={{
              ...style.icon,
              position: 'absolute',
              left: '50%',
              marginLeft: -style.icon.radius,
              ...(up
                ? { top: style.base.borderTopWidth }
                : { bottom: style.base.borderBottomWidth }),
            }}
          />
        </>
      )}
      <div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onDoubleClick={onClick}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          cursor: 'pointer',
          // background: 'rgba(255,0,255,0.1)',
        }}
      />
    </div>
  ));
