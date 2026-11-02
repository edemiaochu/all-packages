# @szewtwin/ivaults-access-backend-tests

Copyright © Szewec Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains tests for various classes in the [`@szewtwin/ivaults-access-backend`](../../szewtwin-platform-access/ivaults-access-backend/README.md) package.

**Note:** This package is not intended for outside use - it is internal and meant to be consumed only in internal pipelines or locally to verify correct code behavior.

## Running tests

- Create `.env` file in the current directory (`./tests/ivaults-access-backend-tests`). The following variables should be configured:
  - `TEST_SZEWTWIN_NAME`
  - `TEST_IVAULT_NAME`
  - `AUTH_AUTHORITY`
  - `AUTH_CLIENT_ID`
  - `AUTH_CLIENT_SECRET`
  - `AUTH_REDIRECT_URL`
  - `APIS_IVAULTS_BASE_URL`
  - `APIS_IVAULTS_VERSION`
  - `APIS_IVAULTS_SCOPES`
  - `APIS_SZEWTWINS_BASE_URL`
  - `APIS_SZEWTWINS_SCOPES`
  - `TEST_USERS_ADMIN1_EMAIL`
  - `TEST_USERS_ADMIN1_PASSWORD`
  - `TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL`
  - `TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD`
- Run `npm run test:integration` command or use "Backend iVaults Access Tests" launch configuration in VS Code.
