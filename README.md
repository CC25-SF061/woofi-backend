# Backend

This is the backend of woofi website

## instalation

Pull the repository

```
git pull https://github.com/CC25-SF061/woofi-backend
```

Run

```
npm install
```

Start the backend

```
node index.js
```

## Technology Used

### Database

-   Postgresql
    <p>Easy to host and use</p>

### Cloud Service

-   Cloudflare R2
    <p>For hosting Image file</p>
-   Supabase
    <p>For hosting Database</p>

### SMTP Provider

-   Brevo

### Core Library

-   AWS S3 Client (for cloudflare R2)
-   Casbin (rbac)
-   Hapi.js
-   Nodemailer
-   Kyselsy (Database Query Builder)
-   bcrypt
-   pg
-   dotenv

## API

start the backend and see the [/documentation](http://localhost:8070) route
or [this](https://backend.woofi.web.id/documentation)

## Commands

-   npm run migrate
    <p>For migrating database</p>
-   npm run migrate:down
    <p>Drop the database</p>
-   npm run migrate:reset
    <p>Drop the database and then migrate it</p>
