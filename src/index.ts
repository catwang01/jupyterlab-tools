import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { MarkdownCell, ICellModel } from '@jupyterlab/cells';
import { splitMarkdownByHeaders } from './utils';

import { requestAPI } from './handler';

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
        
        // 如果返回空数组，直接返回不做任何操作
        if (cells.length === 0) {
          return;
        }
        
        // 记住当前的位置
        const currentIndex = notebook.activeCellIndex;
        
        // 先插入新的 cells
        cells.forEach((cellText, index) => {
          if (index === 0) {
            // 第一个 cell 直接替换当前 cell
            model.sharedModel.setSource(cellText);
          } else {
            // 其他 cell 插入到下方
            NotebookActions.insertBelow(notebook);
            NotebookActions.changeCellType(notebook, 'markdown');
            const newCell = notebook.activeCell;
            if (newCell instanceof MarkdownCell) {
              const newModel = newCell.model as ICellModel;
              newModel.sharedModel.setSource(cellText);
            }
          }
        });

        // 选中第一个 cell
        notebook.activeCellIndex = currentIndex;
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
