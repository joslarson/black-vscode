# Change Log

All notable changes to the "black-vscode" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.0.5] - 2018-05-08
### Fixed
- Implement workaround for vscode issue on macOS where locale info is stripped from env

## [2.0.4] - 2018-05-04
### Fixed
- Fixed possible unresolved promise in black version check

## [2.0.2] - 2018-04-02
### Added
- Added back black version check: new and improved (it actually works now).

## [2.0.1] - 2018-04-02
### Removed
- Removed broken black version check (may add back in later on).

## [2.0.0] - 2018-03-26
### Added
- Backwards incompatible changes to support black v18.3a4

## [1.3.1] - 2018-03-24
### Improved
- Adds missing support for "${workspaceFolder}" expansion in `python.pythonPath` and `black.path`.

## [1.3.0] - 2018-03-24
### Added
- Adds support for "${workspaceRoot}" expansion in `python.pythonPath` and `black.path`.

## [1.2.2] - 2018-03-23
### Improved
- Adds more debug mode information and moves debug info to dedicated output channel.

## [1.2.1] - 2018-03-22
### Added
- Adds support for relative `python.pythonPath` and `black.path` settings

### Improved
- Better test coverage, specifically relating to how the command is generated

## [1.2.0] - 2018-03-22
### Added
- Adds optional `black.path` setting to set absolute path to custom black version

## [1.1.0] - 2018-03-21
### Added
- Respects `python.pythonPath` setting when present to run black in virtual environments

## [1.0.2] - 2018-03-21
### Fixed
- Improved logic for when to apply formatting
- Helps avoid error messages on empty documents/selections
- Fixes issue where certain errors could result in the selection being replaced with nothing :/

## [1.0.1] - 2018-03-20
### Fixed
- Add safety check before replacing

## [1.0.0] - 2018-03-20
### Removed
- Remove warning about Black version from readme
- Remove market place preview flag

## [0.0.5] - 2018-03-20
### Added
- Fix command line install instructions in README

## [0.0.4] - 2018-03-20
### Added
- Fix README typo

## [0.0.3] - 2018-03-20
### Added
- Add Tests
- Add icon.png for marketplace

## [0.0.2] - 2018-03-20
### Added
- Add missing info to package.json
- Cleanup README.md

## [0.0.1] - 2018-03-20
- Initial release
