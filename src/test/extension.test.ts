import * as assert from 'assert';
import * as vscode from 'vscode';
import { SidebarProvider } from '../SidebarProvider';
import * as sinon from 'sinon';

suite('SidebarProvider Tests', () => {

  test('the colorFilePath set as the path in config.', async () => {
    // Arrange
    const extensionUri = vscode.Uri.file(__dirname);
    const sidebarProvider = new SidebarProvider(extensionUri);
    sidebarProvider['_baseFilePath'] = extensionUri.path;
    sinon.stub(vscode.workspace, 'getConfiguration').returns({
      get: () => '/test.css',
      has: function (section: string): boolean {
        throw new Error('Function not implemented.');
      },
      inspect: function <T>(section: string): { key: string; defaultValue?: T | undefined; globalValue?: T | undefined; workspaceValue?: T | undefined; workspaceFolderValue?: T | undefined; defaultLanguageValue?: T | undefined; globalLanguageValue?: T | undefined; workspaceLanguageValue?: T | undefined; workspaceFolderLanguageValue?: T | undefined; languageIds?: string[] | undefined; } | undefined {
        throw new Error('Function not implemented.');
      },
      update: function (section: string, value: any, configurationTarget?: boolean | vscode.ConfigurationTarget | null | undefined, overrideInLanguage?: boolean | undefined): Thenable<void> {
        throw new Error('Function not implemented.');
      }
    });

    // Act
    await sidebarProvider.registerColorFilePath();

    // Assert
    assert.strictEqual(sidebarProvider._colorFilePath, `${extensionUri.path}/test.css`);

  });
});