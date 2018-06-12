# DEPRECATED

Use Microsoft's official [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) instead. This extension was created as a stop-gap until Black support inevitably landed there. That day [has come](https://marketplace.visualstudio.com/items/ms-python.python/changelog#user-content-2018.5.0-(05-jun-2018)) :)

---

# Black – Python code formatter for VS Code

VS Code extension to format Python code using [ambv/black](https://github.com/ambv/black).


## Installation

Find this extension in VS Code's extension marketplace by searching for [Black - Python code formatter](https://marketplace.visualstudio.com/items?itemName=joslarson.black-vscode), or to install it from the command line run the following:

```
code --install-extension joslarson.black-vscode
```

> **Note:** If you're using Microsoft's official Python extension, you'll likely want to to set `python.formatting.provider` to `"none"` so that this extension can handle the formatting of Python files exclusively.

## Formatting in Visual Studio Code

Execute this extension using `cmd/ctrl` + `shift` + `p` and searching for “Format Document” or “Format Selection”. To execute the extension on save, set `editor.formatOnSave` to `true`.

## Requirements

This extension does not install Black for you. For it to work Black must be installed and either (1) be available in your activated Python environment or (2) have the `black.path` explicitly set. Virtual environments are supported by way of the official Python extension's `python.pythonPath` setting. Also be aware that Black requires a Python v3.6.0+ environment to run, so if you want to use it to format code in < Python 3.6.0 environments, you'll have to set the `black.path` to point to a 3.6.0+ environments black instance directly.


## Extension Settings

This extension contributes the following settings to configure Black's behavior:

* `black.lineLength`: Sets the desired line length.
* `black.fast`: Skips temporary sanity checks.
* `black.path`: Custom path to black. If you want to use the same instance of black for all your workspaces (like for projects using < Python 3.6.0), modify this setting to include the full path.
* `black.debug`: Set to true to enable extension debugging output.
