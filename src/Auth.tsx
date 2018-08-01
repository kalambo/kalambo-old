declare const SERVER_URL: string;

import * as React from 'react';
import r, { branch } from 'refluent';
import { Div, Hover, Input, Modal, Txt } from 'elmnt';
import { Spinner } from 'common-client';

import colors from './colors';

const icon = require('./icon.png');

const textStyle = {
  fontFamily: 'Ubuntu, sans-serif',
  fontSize: 16,
  color: colors.black,
};

const fieldStyle = {
  ...textStyle,
  borderColor: '#ccc',
  borderWidth: 1,
  borderStyle: 'solid',
  padding: 10,
  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.15)',
  spacing: '10px 25px',
  focus: {
    borderColor: colors.green,
    active: {
      borderColor: colors.greenDark,
      background: colors.greenFaint,
    },
  },
  invalid: {
    background: colors.redExtraFaint,
    borderColor: colors.red,
    focus: {
      borderColor: colors.redDark,
      active: {
        background: colors.redFaint,
        borderColor: colors.redDark,
      },
    },
  },
};

export default r
  .do((_, push) => ({
    token:
      typeof localStorage !== 'undefined' && localStorage.getItem('authToken'),
    setToken: token => push({ token }),
    logOut: () => {
      localStorage.removeItem('authToken');
      window.rgo.flush();
      push({ token: null });
    },
  }))
  .yield(
    branch(
      ({ token }) => !token,
      r
        .do((_, push) => ({
          state: null,
          setState: state => push({ state }),
        }))
        .yield(({ state, next }) => (
          <Div style={{ layout: 'bar', width: '100%', height: '100%' }}>
            <Div style={{ layout: 'stack', spacing: 35, marginTop: -150 }}>
              <div>
                <img
                  src={icon}
                  style={{
                    width: 'auto',
                    height: 60,
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </div>
              <Div
                style={{
                  layout: 'stack',
                  background: 'white',
                  width: 420,
                  margin: '0 auto',
                  spacing: 35,
                  padding: '35px 50px',
                  boxShadow: '0 1px 3px rgba(0,0,0,.13)',
                }}
              >
                <Txt
                  style={{
                    ...textStyle,
                    textAlign: 'center',
                    color: colors.green,
                    fontSize: 50,
                    fontWeight: 'bold',
                  }}
                >
                  Kalambo
                </Txt>
                {state === 'processing' ? (
                  <Spinner style={{ color: colors.green, height: 218 }} />
                ) : (
                  next()
                )}
              </Div>
            </Div>
          </Div>
        ))
        .do((props$, push) => {
          const submit = async () => {
            const { setToken, setState } = props$();
            const { email, password } = props$(true);
            if (email && password) {
              setState('processing');
              const result = await fetch(`${SERVER_URL}/auth`, {
                method: 'POST',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ username: email, password }),
              });
              const token = await result.text();
              if (result.ok && token) {
                localStorage.setItem('authToken', token);
                setToken(token);
              } else {
                push({ email: null, password: null });
                setState(null);
              }
            } else {
              setState('attempted');
            }
          };
          return {
            email: null,
            setEmail: email => push({ email }),
            password: null,
            setPassword: password => push({ password }),
            submit,
            onKeyDown: event => event.keyCode === 13 && submit(),
          };
        })
        .yield(
          ({
            state,
            email,
            setEmail,
            password,
            setPassword,
            onKeyDown,
            submit,
          }) => (
            <Div
              onKeyDown={onKeyDown}
              style={{
                maxWidth: 500,
                margin: '0 auto',
                layout: 'stack',
                width: '100%',
                spacing: 35,
              }}
            >
              <Div style={{ layout: 'stack', spacing: 15 }}>
                <Div style={{ layout: 'stack', spacing: 5 }}>
                  <Txt style={{ ...textStyle, color: '#888' }}>Email</Txt>
                  <Input
                    type="string"
                    value={email}
                    onChange={setEmail}
                    spellCheck={false}
                    rows={-1}
                    invalid={state === 'attempted' && !email}
                    style={fieldStyle}
                  />
                </Div>
                <Div style={{ layout: 'stack', spacing: 5 }}>
                  <Txt style={{ ...textStyle, color: '#888' }}>Password</Txt>
                  <Input
                    type="string"
                    value={password}
                    onChange={setPassword}
                    password
                    invalid={state === 'attempted' && !password}
                    style={fieldStyle}
                  />
                </Div>
              </Div>
              <Hover
                style={{
                  ...textStyle,
                  fontSize: 20,
                  color: 'white',
                  fontWeight: 'bold' as 'bold',
                  userSelect: 'none',
                  cursor: 'pointer',
                  background: colors.green,
                  padding: 15,
                  textAlign: 'center',
                  width: 180,
                  margin: '0 auto',
                  hover: { background: colors.greenDark },
                }}
              >
                {({ hoverProps, style }) => (
                  <Txt {...hoverProps} onClick={submit} style={style}>
                    Log In
                  </Txt>
                )}
              </Hover>
            </Div>
          ),
        ),
    ),
  )
  .yield(
    r
      .do((props$, push, commit) => {
        if (commit) {
          let countdownTimer;
          const openPrompt = () => {
            push({ isOpen: true, countdown: 60 });
            countdownTimer = setInterval(() => {
              const current = props$(true).countdown;
              if (current === 1) props$().logOut();
              else push({ countdown: props$(true).countdown - 1 });
            }, 1000);
          };
          push({
            isOpen: false,
            dismiss: () => {
              clearInterval(countdownTimer);
              push({ isOpen: false });
            },
          });

          let inactivityTimer;
          const resetInactivity = () => {
            if (!props$(true).isOpen) {
              clearTimeout(inactivityTimer);
              inactivityTimer = setTimeout(openPrompt, 600000);
            }
          };
          resetInactivity();
          ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'].forEach(e =>
            window.addEventListener(e, resetInactivity),
          );
          return () => {
            clearInterval(countdownTimer);
            clearTimeout(inactivityTimer);
            ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'].forEach(
              e => window.removeEventListener(e, resetInactivity),
            );
          };
        }
      })
      .yield(({ isOpen, countdown, dismiss, logOut, next }) => (
        <Modal
          isOpen={isOpen}
          style={{ fontSize: 0, maxWidth: 420, background: 'white' }}
          next={() => next(props => ({ ...props, logOut }))}
        >
          <Div style={{ padding: '35px 50px', spacing: 35 }}>
            <Txt
              style={{
                ...textStyle,
                fontWeight: 'bold',
                textAlign: 'center',
                color: colors.green,
                fontSize: 30,
              }}
            >
              Automatic logout due to inactivity
            </Txt>
            <Div style={{ layout: 'stack', spacing: 10 }}>
              <Txt style={{ ...textStyle, textAlign: 'center' }}>
                You will be logged out in:
              </Txt>
              <Txt
                style={{
                  ...textStyle,
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                {countdown} seconds
              </Txt>
            </Div>
            <Hover
              style={{
                ...textStyle,
                fontSize: 20,
                color: 'white',
                fontWeight: 'bold' as 'bold',
                userSelect: 'none',
                cursor: 'pointer',
                background: colors.green,
                padding: 15,
                textAlign: 'center',
                width: 180,
                margin: '0 auto',
                hover: { background: colors.greenDark },
              }}
            >
              {({ hoverProps, style }) => (
                <Txt onClick={dismiss} {...hoverProps} style={style}>
                  Close
                </Txt>
              )}
            </Hover>
          </Div>
        </Modal>
      )),
  );
