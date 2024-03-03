import * as vscode from "vscode";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _docText?: any;
  _baseColorFile?: string;

  constructor(private readonly _extensionUri: vscode.Uri ) {
    (async () => {
      this._docText = await this.getColorVariables();
    })();
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  public async getColorVariables() {
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

  private formatColorVariables(text: string) {
    const variableRegex = /(--color-.*:.*;)/g;  // TODO: 변수명 수정하기
    const colorVariables = text.matchAll(variableRegex);

    // TODO: 변수가 하나로 합쳐지는 문제 해결하기
    const colorVariableArr = colorVariables.toString();

    let colorText = [];
    for (const color of colorVariables) {
      const [key, value] = color.toString().split(":");
      colorText.push(`<p class="color-variable">
        <span class="color-variable__name">${key}</span>
        <span class="color-variable__value">${value}</span>
        <div style="width: 10px; height: 10px; background-color: ${value}"></div>
      </p>`);
    }
    return colorText.join("");
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
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
      // TODO: 검색 기능 추가하기
      // TODO: refresh 버튼 추가하기
      ${this._docText}
      </body>
    </html>`;
      
  }
}