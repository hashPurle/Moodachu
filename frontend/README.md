# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

## Optional: NLP demo server (backend)

We provide a small demo NLP backend in `/nlp_demo` that implements `/nlp/detect` and `/pet/mood` endpoints for testing the UI integration.

To run it locally:

1. Install the dependencies for the demo server:
```
cd nlp_demo
npm install
```
2. Start the demo server:
```
npm start
```
3. In a new terminal, start the frontend dev server and set the backend URL environment variable:
```
VITE_BACKEND_URL=http://localhost:4000 npm run dev
```

If `VITE_BACKEND_URL` is set, the frontend will send detected text to `/nlp/detect` and persist mood at `/pet/mood` when the "Send Signal" button is pressed. Otherwise the frontend falls back to a local client-side keyword mapping.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
