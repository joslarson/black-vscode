# Black – Python code formatter for VS Code

VS Code extension to format Python code using [Black](https://github.com/ambv/black).

> **Note:** This extension currently depends on an unreleased feature of Black which allows piping stdin into the CLI, so if you want to start using this now you'll have to install black directly from github: `pip install git+git://github.com/ambv/black.git@10d8976a79f5a7f7e5e36369a81d9e5c983332d1#egg=black`. Once the feature lands stable I will remove the "preview" flag on this extension and give it a proper 1.0 release.


## Installation

Find this extension VS Code's extension marketplace by searching for "Black - Python code formatter" or install by running `ext install prettier-vscode`.


## Requirements

This extension is a simple wrapper for Black's CLI to enable document and selection formatting from within VS Code, therefor Black must be installed and available in your path for this extension to work.

> **Note:** Black requires a Python 3.6.0+ environment to run.


## Extension Settings

This extension contributes the following settings to configure Black's behavior:

* `black.lineLength`: sets the desired line length
* `black.fast`: skips temporary sanity checks


## Release Notes

### 0.0.1

Initial release.
