declare const SERVER_URL: string;
declare const SITE_URL: string;

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Helmet from 'react-helmet';
import { config, cssBase, root, Spinner } from 'common-client';
import r from 'refluent';
import * as webfont from 'webfontloader';
import rgo, { resolvers } from 'rgo';

import Auth from './Auth';
import colors from './colors';
import Explorer from './explorer';
import Input from './Input';
import types from './types';

const fontsLoadedEvent = document.createEvent('Event');
fontsLoadedEvent.initEvent('fontsLoaded', true, true);
webfont.load({
  monotype: { projectId: '72859cf7-87d3-4cf1-99f8-703be01b01a8' },
  active: () => window.dispatchEvent(fontsLoadedEvent),
});

const style = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  lineHeight: 1.5,
  color: colors.black,
  padding: 10,
  background: '#eee',
  border: '1px solid #ccc',
  header: {
    fontWeight: 'bold',
    alt: {
      background: '#e0e0e0',
    },
    empty: {
      color: colors.green,
      active: { color: colors.white, background: colors.green },
    },
    sort: { color: colors.green },
    remove: { color: colors.red },
    icon: {
      color: 'white',
      background: '#aaa',
      active: { background: colors.green },
      remove: { background: colors.red },
    },
    input: {
      background: 'transparent',
      color: '#aaa',
      padding: 5,
      hover: {
        color: colors.green,
        background: 'rgba(0,0,0,0.1)',
        focus: {
          color: 'white',
          background: colors.green,
          connect: { color: colors.green },
          invalid: {
            background: colors.red,
            connect: { color: colors.red },
          },
        },
      },
    },
    modal: {
      background: 'white',
      padding: '4px 0',
    },
    item: {
      fontWeight: 'normal',
      padding: '7px 14px',
      background: 'white',
      active: { color: 'black' },
      relation: { fontWeight: 'bold' },
      hover: { color: 'white', background: colors.green },
    },
  },
  data: {
    fontSize: 12,
    padding: '9px 10px',
    background: 'white',
    maxWidth: 400,
    fileLink: {
      color: colors.green,
      fontWeight: 'bold',
    },
    hover: { background: '#eee' },
    null: { color: '#ccc', hover: { background: 'white' } },
    empty: { background: '#fafafa' },
    changed: {
      color: colors.green,
      background: colors.greenFaint,
      fontStyle: 'italic',
      fontWeight: 'bold',
    },
    input: {
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.15)',
      placeholder: { color: 'rgba(0,0,0,0.35)' },
      selected: { fontWeight: 'bold' },
      group: { fontWeight: 'bold', fontStyle: 'italic' },
      none: { fontStyle: 'italic' },
      focus: {
        borderColor: colors.green,
        active: { background: colors.greenFaint },
      },
      invalid: {
        background: colors.redExtraFaint,
        borderColor: colors.red,
        focus: {
          borderColor: colors.redDark,
          active: { background: colors.redFaint },
        },
      },
      processing: {
        backgroundColor: '#f2f2f2',
        backgroundImage: `linear-gradient(45deg, ${[
          `${colors.processing} 25%`,
          'transparent 25%',
          'transparent 50%',
          `${colors.processing} 50%`,
          `${colors.processing} 75%`,
          'transparent 75%',
          'transparent',
        ].join(',')})`,
        backgroundSize: '40px 40px',
        animation: 'upload-bar 1s linear infinite',
        focus: { backgroundColor: colors.greenFaint },
      },
      // button: {
      //   textAlign: 'center',
      //   color: colors.white,
      //   fontWeight: 'bold' as 'bold',
      //   letterSpacing: 0.5,
      //   width: 120,
      //   boxShadow: 'none',
      //   background: colors.green,
      //   hover: { background: colors.greenDark },
      //   focus: {
      //     active: {
      //       background: colors.green,
      //       hover: { background: colors.greenDark },
      //     },
      //   },
      // },
    },
  },
  link: {
    fontWeight: 'bold',
    color: colors.green,
    hover: { color: colors.white, background: colors.green },
  },
  button: {
    fontWeight: 'bold',
    color: colors.white,
    background: colors.green,
    hover: { background: colors.greenDark },
    cancel: { background: '#aaa', hover: { background: '#999' } },
  },
};

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const now = new Date();
const availabilityOptions = Array.from({ length: 24 }).map(
  (_, i) => new Date(now.getFullYear(), now.getMonth() + i),
);
const availabilityLabels = availabilityOptions.map(
  d =>
    `${months[d.getMonth()]} ${d
      .getFullYear()
      .toString()
      .slice(2)}`,
);

const App = r
  .yield(Auth)
  .do((_a, _b, commit) => {
    if (commit) {
      window.onbeforeunload = () => 'Changes that you made may not be saved.';
      return () => (window.onbeforeunload = null);
    }
  })
  .yield(({ logOut }) => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        zIndex: 10,
        padding: 10,
      }}
    >
      <Explorer
        config={config}
        types={types}
        meta={{
          ww_people: {
            availability: {
              options: availabilityOptions,
              labels: availabilityLabels,
            },
          },
        }}
        editable={(type, field) => {
          const { scalar, isList, meta = {} } = root.rgo.schema[type][
            field
          ] as any;
          return (
            !meta.file &&
            !meta.formula &&
            (['string'].includes(scalar) ||
              (!isList && ['boolean', 'int', 'float', 'date'].includes(scalar)))
          );
        }}
        input={Input}
        permalink={SITE_URL}
        logOut={logOut}
        fileServer={SERVER_URL}
        resize={resize => window.addEventListener('fontsLoaded', resize)}
        style={style}
        loader={() => <Spinner style={{ color: colors.green }} />}
      />
    </div>
  ));

root.rgo = rgo(
  resolvers.fetch(SERVER_URL, () => {
    const token =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : null;
  }),
  process.env.NODE_ENV !== 'production',
);

const div = document.createElement('div');
div.style.height = '100%';
document.body.appendChild(div);
ReactDOM.render(
  <>
    <Helmet title="Kalambo">
      <link
        href="https://fonts.googleapis.com/css?family=Open+Sans:400,700,800|Ubuntu:400,700,900"
        rel="stylesheet"
      />
      <style>
        {`
        ${cssBase}
        html {
          background: #f6f6f6;
        }
        `}
      </style>
    </Helmet>
    <App />
  </>,
  div,
);
