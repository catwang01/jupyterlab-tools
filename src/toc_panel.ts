import { Widget } from '@lumino/widgets';
import { INotebookTracker } from '@jupyterlab/notebook';
import { MarkdownCell, ICellModel } from '@jupyterlab/cells';
import { getHeaders, HeaderInfo } from './utils';
import { Signal } from '@lumino/signaling';

interface TOCItem extends HeaderInfo {
  cellIndex: number;
}

export class TOCPanel extends Widget {
  constructor(tracker: INotebookTracker) {
    super();
    this.addClass('jp-TOC-Panel');
    this.id = 'jupyterlab-toc';
    this.title.closable = true;
    this._tracker = tracker;

    // 监听笔记本变化
    this._tracker.currentChanged.connect(this._onNotebookChanged, this);
    this._tracker.activeCellChanged.connect(this._onActiveCellChanged, this);

    // 移除面板级别的 Tab 事件阻止
    // 改为在 _handleKeyDown 中处理
    this.node.addEventListener('keydown', this._handleKeyDown.bind(this));

    this._selectedItems = new Set<string>();
  }

  private _getItemKey(header: TOCItem): string {
    return `${header.cellIndex}-${header.lineNumber}`;
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('jp-TOC-Item')) return;

    switch (event.key) {
      case 'Tab': {
        event.preventDefault();
        event.stopPropagation();
        
        // 获取所有选中的项目
        const selectedItems = Array.from(this.node.querySelectorAll<HTMLElement>('.jp-TOC-Item'))
          .filter(item => {
            const header = this._getHeaderFromElement(item);
            return header && this._selectedItems.has(this._getItemKey(header));
          });

        if (selectedItems.length === 0) return;

        const notebook = this._tracker.currentWidget?.content;
        if (!notebook) return;

        let updated = false;
        // 保存当前选中的项目的键
        const selectedKeys = new Set(this._selectedItems);

        // 处理所有选中的项目
        selectedItems.forEach(item => {
          const header = this._getHeaderFromElement(item);
          if (!header) return;

          const cell = notebook.widgets[header.cellIndex] as MarkdownCell;
          if (!cell) return;

          const text = cell.model.sharedModel.source;
          const lines = text.split('\n');
          
          if (event.shiftKey) {
            // 减少缩进
            if (header.level > 1) {
              lines[header.lineNumber] = lines[header.lineNumber].substring(1);
              cell.model.sharedModel.setSource(lines.join('\n'));
              updated = true;
            }
          } else {
            // 增加缩进
            if (header.level < 8) {
              lines[header.lineNumber] = '#' + lines[header.lineNumber];
              cell.model.sharedModel.setSource(lines.join('\n'));
              updated = true;
            }
          }
        });
        
        if (updated) {
          // 刷新 TOC
          this._refreshTOC();
          
          // 恢复选择状态并聚焦到原始目标项目
          requestAnimationFrame(() => {
            // 恢复所有选中的项目
            this._selectedItems = selectedKeys;
            this._updateSelectionVisuals();

            // 聚焦到原始目标项目
            const header = this._getHeaderFromElement(target);
            if (!header) return;
            
            const updatedItem = this.node.querySelector(
              `.jp-TOC-Item[data-cell-index="${header.cellIndex}"][data-line-number="${header.lineNumber}"]`
            ) as HTMLElement;
            if (updatedItem) {
              updatedItem.focus();
            }
          });
        }
        break;
      }
      case 'ArrowUp':
        event.preventDefault();
        this._focusPreviousItem(target);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this._focusNextItem(target);
        break;
      case 'Enter':
        event.preventDefault();
        target.click();
        break;
      case ' ': // 空格键用于选择
        event.preventDefault();
        this._toggleSelection(target, event.shiftKey, event.metaKey || event.ctrlKey);
        break;
    }
  }

  private _focusPreviousItem(item: HTMLElement): void {
    // 获取所有可聚焦的项目
    const items = Array.from(this.node.querySelectorAll('.jp-TOC-Item')) as HTMLElement[];
    const currentIndex = items.indexOf(item);
    if (currentIndex > 0) {
      items[currentIndex - 1].focus();
    }
  }

  private _focusNextItem(item: HTMLElement): void {
    // 获取所有可聚焦的项目
    const items = Array.from(this.node.querySelectorAll('.jp-TOC-Item')) as HTMLElement[];
    const currentIndex = items.indexOf(item);
    if (currentIndex < items.length - 1) {
      items[currentIndex + 1].focus();
    }
  }

  private _getHeaderFromElement(element: HTMLElement): TOCItem | null {
    const dataset = element.dataset;
    if (!dataset.cellIndex || !dataset.lineNumber || !dataset.level) return null;

    return {
      cellIndex: parseInt(dataset.cellIndex),
      lineNumber: parseInt(dataset.lineNumber),
      level: parseInt(dataset.level),
      text: element.textContent || ''
    };
  }

  private _onNotebookChanged(): void {
    this._refreshTOC();
  }

  private _onActiveCellChanged(): void {
    this._refreshTOC();
  }

  private _refreshTOC(): void {
    // 清空当前内容
    this.node.innerHTML = '';

    const notebook = this._tracker.currentWidget?.content;
    if (!notebook) return;

    // 收集所有 markdown cells 的标题
    const allHeaders: TOCItem[] = [];
    notebook.widgets.forEach((cell, index) => {
      if (cell instanceof MarkdownCell) {
        const model = cell.model as ICellModel;
        const text = model.sharedModel.source;
        const headers = getHeaders(text);
        headers.forEach(header => {
          allHeaders.push({
            ...header,
            cellIndex: index
          });
        });
      }
    });

    if (allHeaders.length === 0) {
      const noHeaders = document.createElement('div');
      noHeaders.textContent = 'No headers found in notebook';
      noHeaders.className = 'jp-TOC-Empty';
      this.node.appendChild(noHeaders);
      return;
    }

    // 创建根容器
    const rootContainer = document.createElement('div');
    rootContainer.className = 'jp-TOC-Container';

    // 创建虚拟根节点
    const rootHeader = document.createElement('div');
    rootHeader.className = 'jp-TOC-Header';
    rootHeader.textContent = 'Table of Contents';
    rootContainer.appendChild(rootHeader);

    const rootUL = document.createElement('ul');
    rootUL.className = 'jp-TOC-List';
    rootContainer.appendChild(rootUL);

    // 直接将所有标题添加到根列表中
    allHeaders.forEach(header => {
      const li = this._createTOCItem(header);
      rootUL.appendChild(li);
    });

    this.node.appendChild(rootContainer);
  }

  private _createTOCItem(header: TOCItem): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'jp-TOC-Item';
    li.tabIndex = 0;
    
    // 存储标题信息
    li.dataset.cellIndex = header.cellIndex.toString();
    li.dataset.lineNumber = header.lineNumber.toString();
    li.dataset.level = header.level.toString();
    
    // 设置缩进
    li.style.paddingLeft = `${(header.level - 1) * 10 + 12}px`;  // 基础padding 12px + 每级增加10px
    
    // 创建标题文本容器
    const contentDiv = document.createElement('div');
    contentDiv.style.display = 'flex';
    contentDiv.style.alignItems = 'center';
    
    // 创建标题文本
    const titleSpan = document.createElement('span');
    titleSpan.textContent = header.text;
    titleSpan.className = 'jp-TOC-Item-Text';
    contentDiv.appendChild(titleSpan);

    // 添加 level 标签
    const levelSpan = document.createElement('span');
    levelSpan.textContent = `H${header.level}`;
    levelSpan.className = 'jp-TOC-Item-Level';
    contentDiv.appendChild(levelSpan);

    li.appendChild(contentDiv);

    // 检查是否应该高亮
    this._updateItemHighlight(li, header);
    
    // 点击处理
    li.addEventListener('click', (event) => {
      event.stopPropagation();
      this._toggleSelection(li, event.shiftKey, event.metaKey || event.ctrlKey);
      
      // 如果只选择了一个项目，则跳转到该项目
      if (this._selectedItems.size === 1) {
        const notebook = this._tracker.currentWidget?.content;
        if (!notebook) return;

        notebook.activeCellIndex = header.cellIndex;
        const activeCell = notebook.activeCell;
        
        if (activeCell instanceof MarkdownCell && activeCell.editor) {
          const position = {
            line: header.lineNumber,
            column: 0
          };
          activeCell.editor.setCursorPosition(position);

          const coords = activeCell.editor.getCoordinateForPosition(position);
          if (coords) {
            const editorNode = activeCell.editor.host;
            editorNode.scrollTop = coords.top - editorNode.clientHeight / 2;
          }

          this._updateItemHighlight(li, header);
        }
      }
    });

    // 添加键盘事件监听
    li.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        li.click();
      }
    });

    // 添加焦点样式
    li.addEventListener('focus', () => {
      li.classList.add('jp-mod-focused');
    });

    li.addEventListener('blur', () => {
      li.classList.remove('jp-mod-focused');
    });

    return li;
  }

  private _updateItemHighlight(li: HTMLLIElement, header: TOCItem): void {
    const notebook = this._tracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    
    if (activeCell instanceof MarkdownCell && activeCell.editor) {
      const cursorPosition = activeCell.editor.getCursorPosition();
      const text = activeCell.model.sharedModel.source;
      const lines = text.split('\n');
      const currentLine = lines[cursorPosition.line] || '';
      
      // 检查光标是否在标题行上，并且是否匹配当前标题
      if (notebook?.activeCellIndex === header.cellIndex && 
          cursorPosition.line === header.lineNumber &&
          currentLine.match(/^#{1,8}\s/)) {
        li.classList.add('jp-mod-active');
      } else {
        li.classList.remove('jp-mod-active');
      }
    }
  }

  private _toggleSelection(item: HTMLElement, isShiftKey: boolean, isCtrlKey: boolean): void {
    const header = this._getHeaderFromElement(item);
    if (!header) return;

    const itemKey = this._getItemKey(header);
    const items = Array.from(this.node.querySelectorAll('.jp-TOC-Item')) as HTMLElement[];

    if (isShiftKey && this._lastSelectedItem) {
      // Shift 键实现范围选择
      const currentIndex = items.indexOf(item);
      const lastIndex = items.findIndex(el => {
        const h = this._getHeaderFromElement(el);
        return h && this._getItemKey(h) === this._lastSelectedItem;
      });

      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);

      // 清除之前的选择
      if (!isCtrlKey) {
        this._selectedItems.clear();
      }

      // 选择范围内的所有项目
      for (let i = start; i <= end; i++) {
        const h = this._getHeaderFromElement(items[i]);
        if (h) {
          this._selectedItems.add(this._getItemKey(h));
        }
      }
    } else if (isCtrlKey) {
      // Ctrl/Cmd 键实现切换选择
      if (this._selectedItems.has(itemKey)) {
        this._selectedItems.delete(itemKey);
      } else {
        this._selectedItems.add(itemKey);
      }
    } else {
      // 普通点击，清除其他选择只选择当前项
      this._selectedItems.clear();
      this._selectedItems.add(itemKey);
    }

    this._lastSelectedItem = itemKey;
    this._updateSelectionVisuals();
  }

  private _updateSelectionVisuals(): void {
    const items = Array.from(this.node.querySelectorAll<HTMLElement>('.jp-TOC-Item'));
    items.forEach(item => {
      const header = this._getHeaderFromElement(item);
      if (header) {
        const itemKey = this._getItemKey(header);
        if (this._selectedItems.has(itemKey)) {
          item.classList.add('jp-mod-selected');
        } else {
          item.classList.remove('jp-mod-selected');
        }
      }
    });
  }

  readonly headerClicked = new Signal<this, { cellIndex: number; header: HeaderInfo }>(this);
  private _tracker: INotebookTracker;
  private _selectedItems: Set<string>;
  private _lastSelectedItem: string | null = null;
} 