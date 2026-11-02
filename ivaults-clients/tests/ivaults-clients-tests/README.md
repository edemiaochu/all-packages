# @szewtwin/ivaults-clients-tests

Copyright © Szewec Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains tests for various classes in the [`@szewtwin/ivaults-client-management`](../../clients/ivaults-client-management/README.md) and [`@szewtwin/ivaults-client-authoring`](../../clients/ivaults-client-authoring/README.md) packages.

**Note:** This package is not intended for outside use - it is internal and meant to be consumed only in internal pipelines or locally to verify correct code behavior.

## Running tests

- Create `.env` file in the current directory (`./tests/ivaults-clients-tests`). The following variables should be configured:
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
  - `TEST_BEHAVIOR_OPTIONS_RECREATE_IVAULT` - set this option to "1" to recreate reusable test IVault.
- Run `npm run test:integration` command or use "iVaults Clients Tests" launch configuration in VS Code.