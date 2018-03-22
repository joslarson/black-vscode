# Black – Python code formatter for VS Code

VS Code extension to format Python code using [ambv/black](https://github.com/ambv/black).


## Installation

Find this extension in VS Code's extension marketplace by searching for [Black - Python code formatter](https://marketplace.visualstudio.com/items?itemName=joslarson.black-vscode), or to install it from the command line run the following:

```
code --install-extension joslarson.black-vscode
```


## Requirements

This extension is a simple wrapper for Black's CLI to enable document and selection formatting from within VS Code, therefor Black must be installed and available in your Python environment for this extension to work. Virtual environments are supported by way of the official Python extension's `python.pythonPath` setting. Be aware that Black requires a Python v3.6.0+ environment to run.


## Extension Settings

This extension contributes the following settings to configure Black's behavior:

* `black.lineLength`: Sets the desired line length.
* `black.fast`: Skips temporary sanity checks.
* `black.path` (optional): Custom path to black. If you want to use the same instance of black for all your workspaces (like for projects using < Python 3.6.0), modify this setting to include the full path.
