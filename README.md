# Black – Python code formatter for VS Code

VS Code extension to format Python code using [ambv/black](https://github.com/ambv/black).


## Requirements

This extension is a simple wrapper for Black's CLI to enable document and selection formatting from within VS Code, therefor Black must be installed and available in your `PATH` for this extension to work.

Also note that Black requires a Python v3.6.0+ environment to run.


## Installation

Find this extension in VS Code's extension marketplace by searching for "Black - Python code formatter" or install by running the following:

```
code --install-extension joslarson.black-vscode
```


## Extension Settings

This extension contributes the following settings to configure Black's behavior:

* `black.lineLength`: sets the desired line length
* `black.fast`: skips temporary sanity checks
