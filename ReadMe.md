# Appwrite database explorer

Appwrite is a great tool, but it lacks a proper DB explorer.

This simple front-end leverages MUI's data grid to:
- search through collections (full-text, equals, greater than, less than...)
- sort a collection
- quickly visualize a relationship
- quickly edit data

## How to use

```sh
git clone https://github.com/ScalaeStudio/appwrite-db-explorer
cd appwrite-db-explorer
yarn dev
```

Once the server is running, go to `http://localhost:5173/` and enter your Appwrite credentials.

Alternatively, you can go to an hosted version here: `https://appwrite-db-explorer.vercel.app`.

> ⚠️ If you want to use the hosted version, you'll need to add vercel as a registered web app in Appwrite dashboard.
