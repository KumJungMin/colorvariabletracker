import * as vscode from "vscode";

/** Regular expression to match color variables in CSS code */
function getColorVariableObj(cssCode: string, searchText?: string) {
    const pattern = /(--[\w-]+|\$[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\));/g;
    const matches = cssCode.matchAll(pattern);
    const filteredMatches = Array.from(matches).filter((match) => {
      if (!searchText) return true;
      return match[1].includes(searchText) || match[2].includes(searchText);
    });

    const colorVariable: { [key: string]: string } = {};
    for (const match of filteredMatches) {
      colorVariable[match[1]] = match[2];
    }
    return colorVariable;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _docText?: any;
  _baseColorFile?: string;
  _searchText?: string;

  constructor(private readonly _extensionUri: vscode.Uri ) {
    this.init();
  }

  private async init() {
    /** if variable is initialized in the constructor, function can access the variable  */
    this._docText = await this.getColorVariables();
    this._doc = vscode.workspace.textDocuments.find((doc) => doc.uri.path === this._baseColorFile);
    this._searchText = '';
    this._view;

    if (this._view) {
      this._view.webview.html = this.getHtmlForWebview(this._view.webview);
    }
  }

  public update(doc?: vscode.TextDocument) {
    if (!doc) return;
    else if (doc.uri.path !== this._baseColorFile) return;

    this._doc = doc;
    this._docText = this.formatColorVariables(doc.getText());



    if (this._view) {
      this._view.webview.html = this.getHtmlForWebview(this._view.webview);
    }
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private async getColorVariables() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const rootPath = vscode.workspace.workspaceFolders?.[0];

      // TODO: 파일 찾는 로직 수정하기 - 외부에서 파일 경로를 지정할 수 있게
      const baseColorFiles = [
        `${rootPath?.uri.path}/color.scss`,
        `${rootPath?.uri.path}/src/colors.scss`,
        `${rootPath?.uri.path}/src/styles/color.scss`,
      ];
      const colorFile = baseColorFiles.find((file) => {
        return vscode.workspace.textDocuments.find((doc) =>  doc.uri.path === file);
      });
      if (colorFile) {
        this._baseColorFile = colorFile;
        const document = await vscode.workspace.openTextDocument(colorFile);
        return this.formatColorVariables(document.getText());
      }
    }
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    /** class this binding: it is necessary to bind the class to the function  */ 
    webviewView.webview.onDidReceiveMessage(this.onReceiveMessage.bind(this));
  }

  private async onReceiveMessage(data: { type: string; value?: any }) {
    switch (data.type) {
      case "copyToClipboard": {
        if (!data.value) return;
        
        vscode.env.clipboard.writeText(data.value);
        vscode.window.showInformationMessage(`Copied ${data.value} to clipboard`);
        break;
      }

      // TODO: 파일 찾는 로직 수정하기 - 외부에서 파일 경로를 지정할 수 있게
      case "openFile": {
        if (!this._baseColorFile) {
          vscode.window.showErrorMessage("Color file not found");
          return;
        }
        vscode.workspace.openTextDocument(this._baseColorFile);
        break;
      }
      
      case "onUpdate": {
        this.update(this._doc);
        break;
      }

      case "onInput": {
        this._searchText = data.value;
        break;
      }
      
      case "onError": {
        if (!data.value) return;

        vscode.window.showErrorMessage(data.value);
        break;
      }
    }
  }

  private formatColorVariables(text: string) {
    const colorObj = getColorVariableObj(text, this._searchText);
    const colorText: string[] = [];
    
    Object.keys(colorObj).forEach((key) => {
      const row = `
        <tr>
          <td>${key}</td>
          <td>
            <button class="colorBox" 
              style="background-color:${colorObj[key]}" 
              title="${colorObj[key]}" 
              data-color="${colorObj[key]}"
              >
            </button>
          </td>
        </tr>`;
      colorText.push(row);
      }
    );
    
    return colorText.join("");
  };


  private getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel='stylesheet' href='${styleResetUri}' />
        <link rel='stylesheet' href='${styleVSCodeUri}' />
        <title>Welcome to GitOps - New User Guide</title>
      </head>
      <body>
      <div class="search-bar">
        <div class="input-wrapper">
          <input type="text" id="searchInput" value="${this._searchText}" placeholder="search color...">
          <button type="button" id="btnClear">X</button>
        </div>
        <button type="button" id="btnSearch">Search</button>
      </div>
      <table>
        <thead>
            <tr>
              <th>Variable Name</th>
              <th>Color Value</th>
            </tr>
        </thead>
        <button id="btnOpen">Open Color File</button>
        <tbody>
          ${this._docText}
        </tbody>
      </table>
      <script>
        (function() {
            const vscode = acquireVsCodeApi();
            const colorBoxes = document.querySelectorAll('.colorBox');
            const btnOpen = document.getElementById('btnOpen');
            const btnSearch = document.getElementById('btnSearch');
            const btnClear = document.getElementById('btnClear');
            const searchInput = document.getElementById('searchInput');

            btnOpen.addEventListener('click', () => {
              vscode.postMessage({ type: 'openFile' });
            });

            colorBoxes.forEach((box) => {
              box.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                vscode.postMessage({ type: 'copyToClipboard', value: color });
              });
            });
            
            btnSearch.addEventListener('click', () => {
              vscode.postMessage({ type: 'onInput', value: searchInput.value });
              vscode.postMessage({ type: 'onUpdate' });
            });
            
            btnClear.addEventListener('click', () => {
              if (searchInput.value === '') return;

              searchInput.value = '';
              vscode.postMessage({ type: 'onInput', value: '' });
              vscode.postMessage({ type: 'onUpdate' });
            });

            searchInput.addEventListener('keyup', (e) => {
              vscode.postMessage({ type: 'onInput', value: searchInput.value });
              if (e.key === 'Enter') vscode.postMessage({ type: 'onUpdate' });
            });

            let lastInputTime = 0;
            searchInput.addEventListener('input', (e) => {
              const currentTime = Date.now();
              if (currentTime - lastInputTime >= 200) {
                vscode.postMessage({ type: 'onInput', value: e.target.value });
                lastInputTime = currentTime;
              }
            });

        }())
    </script>
      </body>
    </html>`;
      
  }
}
