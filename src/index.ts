import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { MarkdownCell, ICellModel } from '@jupyterlab/cells';
import { splitMarkdownByHeaders } from './utils';
import { WidgetTracker } from '@jupyterlab/apputils';
import { TOCPanel } from './toc_panel';
import { LabIcon } from '@jupyterlab/ui-components';
import listOlSvgstr from '../style/icons/list-ol.svg';

import { requestAPI } from './handler';

function indentHeader(text: string): string {
  return text.replace(/^(#{1,5})\s/, '#$1 ');
}

function dedentHeader(text: string): string {
  return text.replace(/^(#{2,6})\s/, (match) => match.slice(1));
}

// 创建 TOC 图标
const tocIcon = new LabIcon({
  name: 'jupyterlab-tools:toc',
  svgstr: listOlSvgstr
});

/**
 * Initialization data for the jupyterlab-tools extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-tools:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ISettingRegistry, ICommandPalette, ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null
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

    // 添加缩进命令
    app.commands.addCommand('jupyterlab-tools:indent-markdown-header', {
      label: 'Indent Markdown Header',
      execute: async () => {
        const notebookWidget = tracker.currentWidget;
        if (!notebookWidget) return;

        const notebook = notebookWidget.content;
        const activeCell = notebook.activeCell;

        if (!activeCell || !(activeCell instanceof MarkdownCell)) return;

        const model = activeCell.model as ICellModel;
        const text = model.sharedModel.source;
        const lines = text.split('\n');
        const cursorPosition = activeCell.editor?.getCursorPosition();
        
        if (!cursorPosition) return;

        // 获取光标所在行
        const line = lines[cursorPosition.line];
        if (!line?.match(/^#{1,5}\s/)) return;

        // 更新该行
        lines[cursorPosition.line] = indentHeader(line);
        model.sharedModel.setSource(lines.join('\n'));
      }
    });

    // 添加反缩进命令
    app.commands.addCommand('jupyterlab-tools:dedent-markdown-header', {
      label: 'Dedent Markdown Header',
      execute: async () => {
        const notebookWidget = tracker.currentWidget;
        if (!notebookWidget) return;

        const notebook = notebookWidget.content;
        const activeCell = notebook.activeCell;

        if (!activeCell || !(activeCell instanceof MarkdownCell)) return;

        const model = activeCell.model as ICellModel;
        const text = model.sharedModel.source;
        const lines = text.split('\n');
        const cursorPosition = activeCell.editor?.getCursorPosition();
        
        if (!cursorPosition) return;

        // 获取光标所在行
        const line = lines[cursorPosition.line];
        if (!line?.match(/^#{2,6}\s/)) return;

        // 更新该行
        lines[cursorPosition.line] = dedentHeader(line);
        model.sharedModel.setSource(lines.join('\n'));
      }
    });

    // 添加键盘快捷键
    app.commands.addKeyBinding({
      command: 'jupyterlab-tools:indent-markdown-header',
      keys: ['Tab'],
      selector: '.jp-MarkdownCell-editor'
    });

    app.commands.addKeyBinding({
      command: 'jupyterlab-tools:dedent-markdown-header',
      keys: ['Shift Tab'],
      selector: '.jp-MarkdownCell-editor'
    });

    // 创建 TOC 面板
    const tocPanel = new TOCPanel(tracker);
    tocPanel.title.icon = tocIcon;  // 设置图标
    const tocTracker = new WidgetTracker<TOCPanel>({
      namespace: 'jupyterlab-toc'
    });

    // 添加到主区域
    tocPanel.id = 'jupyterlab-toc';
    app.shell.add(tocPanel, 'left', { rank: 200 });

    // 如果提供了 restorer，注册面板以便恢复布局
    if (restorer) {
      void restorer.restore(tocTracker, {
        command: 'jupyterlab-tools:show-toc-panel',
        name: () => 'jupyterlab-toc'
      });
    }

    void tocTracker.add(tocPanel);

    // 添加命令以显示/隐藏面板
    app.commands.addCommand('jupyterlab-tools:show-toc-panel', {
      label: 'Show TOC Panel',
      execute: () => {
        if (!tocPanel.isAttached) {
          app.shell.add(tocPanel, 'left', { rank: 200 });
        }
        app.shell.activateById(tocPanel.id);
      }
    });

    // 添加到命令面板
    if (palette) {
      palette.addItem({
        command: 'jupyterlab-tools:show-toc-panel',
        category: 'Notebook Operations'
      });
    }

    app.commands.addKeyBinding({
      command: 'jupyterlab-tools:show-toc',
      keys: ['Accel T'],
      selector: '.jp-Notebook'
    });
  }
};

export default plugin;
