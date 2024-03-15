import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';


export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);

	const registerCommand = vscode.commands.registerCommand('colorvariabletracker.register', () => {
		sidebarProvider.registerColorFilePath();
	});

	context.subscriptions.push(registerCommand);
	context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("colorVariableTrackerSidebar", sidebarProvider)
  );
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((e) => {
		sidebarProvider.update(e);
	}));

	// TODO: Think, do we need this?
	// context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((e) => {
	// 	const isSettingFile = e.uri.path === sidebarProvider._settingFilePath;
		
	// 	if (isSettingFile) sidebarProvider.registerColorFilePath();
	// }));

}

export function deactivate() {
	// nothing to do
}
