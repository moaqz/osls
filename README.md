## How to run it locally:

**Install dependencies:**

```bash
pnpm i
# or
npm i
```

**Setup D1**:

1. Copy the sample configuration file:

```bash
cp wrangler.sample.toml wrangler.toml
```

2. Create a new D1 database instance and replaced the `database_id` in the `wrangler.toml` file:

```bash
wrangler d1 create osls
```

3. Run migrations:

```bash
wrangler d1 execute osls --local --file=./src/schema.sql
```

**Generate Auth Secret:**

Generate a secure authentication secret and update the wrangler.toml file:

**Run server**

```bash
pnpm dev
# or
npm run dev
```

## How to deploy it

1. Run the migrations against the remote database:

```bash
wrangler d1 execute osls --file=./src/schema.sql
```

2. Deploy:

```bash
pnpm deploy
# or
npm run deploy
```