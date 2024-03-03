import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';


export function activate(context: vscode.ExtensionContext) {

	const testCommand = vscode.commands.registerCommand('colorvariabletracker.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from colorVariableTracker!');
	});


	const sidebarProvider = new SidebarProvider(context.extensionUri);

	// TODO: 이벤트 미감지 확인하기
	vscode.workspace.onDidChangeTextDocument((e) => {
		if (e.document.uri.path === sidebarProvider._baseColorFile) {
			sidebarProvider._docText = e.document.getText();
			sidebarProvider._view?.webview.postMessage({ type: "update", value: sidebarProvider._docText });
		}
	}
	);

	context.subscriptions.push(testCommand);
	context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("colorVariableTrackerSidebar", sidebarProvider)
  );

}

export function deactivate() {}
