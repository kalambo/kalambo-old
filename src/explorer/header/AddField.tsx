import * as React from 'react';
import { Div, Icon, Modal, Txt } from 'elmnt';
import r from 'refluent';
import { restyle, root, watchHover } from 'common-client';

import icons from '../icons';

const Item = r
  .do('onClick', 'field', (onClick, field) => ({
    onClick: () => onClick(field),
  }))
  .do(watchHover)
  .do(
    restyle('relation', 'isHovered', (relation, isHovered, style) =>
      style
        .mergeKeys({ item: true, relation, hover: isHovered })
        .merge({ border: 'none', cursor: 'pointer' }),
    ),
  )
  .yield(({ context, type, field, onClick, hoverProps, style }) => (
    <Txt onClick={onClick} {...hoverProps} style={style}>
      {type
        ? context.types[type].fields.find(x => x[0] === field)[1]
        : context.types[field].name}
    </Txt>
  ));

export default r
  .do(
    restyle(style => ({
      ...style,
      modal: style.base
        .mergeKeys('modal')
        .filter('fontSize', 'background', 'padding'),
    })),
  )
  .do((props$, _) => ({
    onMouseMove: () => {
      const { context, path } = props$();
      context.setActive({ type: 'add', path });
    },
    onMouseLeave: () => {
      const { context } = props$();
      context.setActive(null);
    },
    onClick: () => {
      const { context, path } = props$();
      context.setActive({ type: 'add', path }, true);
    },
    onClickItem: field => {
      const { context, type, path } = props$();
      context.query.add(path, type, field);
      context.setActive(null, true);
    },
  }))
  .do((props$, _) => ({
    onModalClose: () => {
      if (props$().focused) {
        props$().context.setActive(null, true);
        return true;
      }
    },
  }))
  .yield(
    ({ context, type, onClickItem, focused, onModalClose, style, next }) => (
      <Modal
        isOpen={focused}
        onClose={onModalClose}
        getBase={({ top, left, height, width }) => ({
          top: top + height,
          left: left + width * 0.5 - 150,
          width: 303,
        })}
        style={style.modal}
        next={next}
      >
        <Div style={style.modal}>
          {(type
            ? context.types[type].fields.map(x => x[0])
            : Object.keys(context.types).sort()
          ).map((f, i) => (
            <Item
              context={context}
              type={type}
              field={f}
              relation={
                f !== 'id' && (!type || (root.rgo.schema[type][f] as any).type)
              }
              onClick={onClickItem}
              style={style.base}
              key={i}
            />
          ))}
        </Div>
      </Modal>
    ),
  )
  .yield(
    ({
      wide,
      setModalBase,
      active,
      focused,
      onMouseMove,
      onMouseLeave,
      onClick,
      empty,
      style,
    }) => (
      <>
        {(active || focused) && (
          <>
            <div
              style={{
                position: 'absolute',
                ...(wide
                  ? {
                      right: 0,
                      bottom: 0,
                      left: 0,
                      height: style.base.borderBottomWidth * 3,
                    }
                  : {
                      top: 0,
                      left: -style.base.borderLeftWidth,
                      bottom: 0,
                      width: style.base.borderLeftWidth * 3,
                    }),
                background: !empty && style.icon.background,
              }}
              ref={setModalBase}
            />
            {!empty && (
              <Icon
                {...icons.plus}
                style={{
                  ...style.icon,
                  position: 'absolute',
                  ...(wide
                    ? {
                        left: '50%',
                        marginLeft: -style.icon.radius,
                        bottom: style.base.borderBottomWidth,
                      }
                    : {
                        bottom: '50%',
                        left: -style.icon.radius,
                        marginBottom: -style.icon.radius,
                      }),
                }}
              />
            )}
          </>
        )}
        <div
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          style={{
            position: 'absolute',
            top: -style.icon.radius,
            left: wide ? 0 : -style.base.paddingLeft,
            right: wide ? 0 : -style.base.paddingRight,
            bottom: 0,
            cursor: 'pointer',
            // background: 'rgba(0,255,0,0.1)',
          }}
        />
      </>
    ),
  );
