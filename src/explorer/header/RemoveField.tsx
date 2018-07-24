import * as React from 'react';
import { Icon } from 'elmnt';
import r from 'refluent';

import icons from '../icons';

export default r
  .do((props$, _) => ({
    onMouseMove: () => {
      const { context, path } = props$();
      context.setActive({ type: 'remove', path });
    },
    onMouseLeave: () => {
      const { context } = props$();
      context.setActive(null);
    },
    onClick: () => {
      const { context, path } = props$();
      context.query.remove(path);
      context.setActive(null);
    },
  }))
  .yield(({ relation, active, onMouseMove, onMouseLeave, onClick, style }) => (
    <>
      {active && (
        <Icon
          {...icons.cross}
          style={{
            ...style.icon,
            position: 'absolute',
            left: '50%',
            marginLeft: -style.icon.radius,
            ...(relation
              ? { top: style.icon.radius * 0.7 }
              : { bottom: style.base.borderBottomWidth }),
          }}
        />
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
    </>
  ));
