# Change Log - @szewtwin/ivaults-client-management

This log was last generated on Wed, 10 Jun 2026 10:51:55 GMT and should not be manually modified.

## 6.2.1
Wed, 10 Jun 2026 10:51:55 GMT

### Updates

- Update axios

## 6.2.0
Thu, 23 Apr 2026 08:41:43 GMT

### Minor changes

- Add LockOperations.getList and BriefcaseOperations.release, moved from @szewtwin/ivaults-client-authoring
- Implement new release Locks in chunks operation

## 6.1.0
Thu, 15 Jan 2026 01:26:06 GMT

### Updates

- fix: update AtLeastOneProperty utility type to provide stronger type inference
- Add recent and favorite iVaults operations

## 6.0.2
Mon, 29 Sep 2025 09:21:51 GMT

_Version update only_

## 6.0.1
Thu, 26 Jun 2025 10:42:19 GMT

_Version update only_

## 6.0.0
Wed, 28 May 2025 07:15:31 GMT

### Breaking changes

- Export ESM modules

### Minor changes

- Add iVaultsError codes
- Add applications property to User response model
- Add state property for get szewTwin iVaults
- Add PUT Named Version Checkpoint endpoint
- Make AxiosRestClient part of the public API
- Drop support for Node.js versions older than 20.9.0.

## 5.10.0
Wed, 26 Mar 2025 11:41:32 GMT

### Minor changes

- Update documentation

### Updates

- Add support for setting horizontal CRS on
- Add continuation token to collection queries

## 5.9.0
Wed, 25 Sep 2024 14:09:09 GMT

### Updates

- Add user statistics

## 5.8.2
Mon, 19 Aug 2024 06:58:46 GMT

_Version update only_

## 5.8.1
Wed, 14 Aug 2024 14:41:07 GMT

### Updates

- Update dependency to axios.

## 5.8.0
Mon, 01 Jul 2024 14:05:44 GMT

### Minor changes

- Add failed HTTP request retry policy.
- Add ordering by multiple properties.
- Add ordering for User by GivenName and Surname.

### Updates

- Add `originalError` property to `IVaultsError`

## 5.7.0
Tue, 18 Jun 2024 11:18:40 GMT

### Minor changes

- Add `forkedFrom` response property in `CreateIVaultOperationDetails`.
- Add fork iVault operation.
- Add `containersEnabled` property.
- Fix consumer provided `timeOutInMs` not being respected in iVault operations.
- Add Named Version `$search` query parameter.
- Add iVault `$search` query parameter.
- Add HTTP status code to iVaultsError.
- Add Changeset Extended Data operations.
- Add ordering by `createdDateTime` for Named Versions.
- Add ordering by `acquiredDateTime` for Briefcases.
- Add latest checkpoint link to Briefcase entity
- Add Get Briefcase Checkpoint operation

## 5.0.0
Thu, 4 Apr 2024 13:39:29 GMT

### Breaking changes

- Update `RestClient` interface. Classes implementing `RestClient` interface must now return HTTP response headers in addition to the response body.
- Update `createFromTemplate` iVault operation error handling. If iVault initialization times out, the error code of the thrown error will now be `IVaultFromTemplateInitializationTimedOut` instead of `IVaultFromTemplateInitializationFailed`.

## 4.0.0
Tue, 23 May 2023 15:57:54 GMT

### Breaking changes

- Drop support for Node.js versions older than 18.12.0.

## 3.0.0
Thu, 23 Feb 2023 16:27:30 GMT

### Breaking changes

- Update client to use [iVaults API V2](https://developer.szewec.com/apis/ivaults-v2/overview/) by default. All references to the term 'Project' were updated to use 'szewTwin' (`projectId` -> `szewTwinId`, ...).

## 2.0.0
Fri, 22 July 2022 14:42:36 GMT

### Breaking changes

- Remove internal code exports from the main `index.ts` file that should not be used directly by package users. The following components are no longer part of the public package API: 
  - Operation classes (`IVaultOperations`, `ChangesetOperations`, etc.) 
  - Utility types (raw API response interfaces, etc.) 
  - Default IVaultsClient option implementations (`AxiosRestClient`) 
  - Default iVaults API parser class
- Change `_links` property type in entity interfaces from `Link` to `Link | null` as per iVaults API definition.

### Minor changes

- Surface more iVaults API operations. Please see the package documentation for an updated list of supported operations and entities: [link to docs](https://github.com/szewTwin/ivaults-clients/blob/main/docs/IVaultsClientAuthoring.md).

## 1.0.0
Tue, 18 Jan 2022 14:44:04 GMT

_Initial release_

