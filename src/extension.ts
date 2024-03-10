import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';


export function activate(context: vscode.ExtensionContext) {
	const testCommand = vscode.commands.registerCommand('colorvariabletracker.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from colorVariableTracker!');
	});

	const sidebarProvider = new SidebarProvider(context.extensionUri);

	context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("colorVariableTrackerSidebar", sidebarProvider)
  );
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((e) => {
		sidebarProvider.update(e);
	}));

	context.subscriptions.push(testCommand);

}

export function deactivate() {}
