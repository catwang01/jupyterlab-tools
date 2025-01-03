import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { MarkdownCell, ICellModel } from '@jupyterlab/cells';

import { requestAPI } from './handler';

function splitMarkdownByHeaders(text: string): string[] {
  const lines = text.split('\n');
  const cells: string[] = [];
  let currentCell: string[] = [];

  lines.forEach(line => {
    if (line.match(/^#{1,6}\s/) && currentCell.length > 0) {
      cells.push(currentCell.join('\n'));
      currentCell = [];
    }
    currentCell.push(line);
  });

  if (currentCell.length > 0) {
    cells.push(currentCell.join('\n'));
  }

  return cells;
}

/**
 * Initialization data for the jupyterlab-tools extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-tools:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ISettingRegistry, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null,
    palette: ICommandPalette | null
  ) => {
    console.log('JupyterLab extension jupyterlab-tools is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyterlab-tools settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyterlab-tools.', reason);
        });
    }

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyterlab_tools server extension appears to be missing.\n${reason}`
        );
      });

    app.commands.addCommand('jupyterlab-tools:split-markdown-by-headers', {
      label: 'Split Markdown Cell by Headers',
      execute: async () => {
        const notebookWidget = tracker.currentWidget;
        if (!notebookWidget) {
          return;
        }

        const notebook = notebookWidget.content;
        const activeCell = notebook.activeCell;

        if (!activeCell || !(activeCell instanceof MarkdownCell)) {
          return;
        }

        const model = activeCell.model as ICellModel;
        const text = model.sharedModel.source;
        const cells = splitMarkdownByHeaders(text);
        
        // 使用 NotebookActions 来操作 cells
        const currentIndex = notebook.activeCellIndex;
        
        // 删除当前 cell
        NotebookActions.deleteCells(notebook);
        
        // 插入新的 cells
        cells.forEach(cellText => {
          NotebookActions.insertBelow(notebook);
          NotebookActions.changeCellType(notebook, 'markdown');
          const newCell = notebook.activeCell;
          if (newCell instanceof MarkdownCell) {
            const newModel = newCell.model as ICellModel;
            newModel.sharedModel.setSource(cellText);
          }
        });
        
        // 删除多余的空 cell
        notebook.activeCellIndex = currentIndex;
        NotebookActions.deleteCells(notebook);
      }
    });

    if (palette) {
      palette.addItem({
        command: 'jupyterlab-tools:split-markdown-by-headers',
        category: 'Notebook Operations'
      });
    }
  }
};

export default plugin;
