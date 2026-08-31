import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createAggregateSearchListApi,
  createAggregateSearchListController,
  type AggregateSearchListController,
  type AggregateSearchListRenderModel
} from './aggregate-search-list';

let controllers: AggregateSearchListController[] = [];

const model: AggregateSearchListRenderModel = {
  copy: {
    addLabel: '添加聚合搜索',
    autoGroupDescription: '使用关键词作为组名',
    autoGroupLabel: '自动创建标签页组',
    cancelLabel: '取消',
    confirmLabel: '确认',
    confirmMessage: '确认移除？',
    confirmMessageKey: 'confirm_remove_item',
    editLabel: '编辑',
    groupBadge: '聚合',
    maxSourcesError: '最多 10 个',
    minSourcesError: '至少 2 个',
    nameLabel: '名称',
    namePlaceholder: '例如：技术检索',
    nameRequiredError: '请输入名称',
    removeLabel: '移除',
    saveLabel: '保存',
    selectedCountLabel: '已选 {count}/{max}',
    sourcesLabel: '搜索源',
    unavailableGroupLabel: '不可用的搜索源',
    unavailableSourceLabel: '不可用的搜索源（{source}）'
  },
  items: [],
  maxNameLength: 80,
  maxSourceCount: 10,
  minSourceCount: 2,
  providers: [
    {
      available: true,
      group: 'engine',
      groupLabel: '搜索引擎',
      name: 'Google',
      sourceRef: 'builtin:gg'
    },
    {
      available: true,
      group: 'site',
      groupLabel: '站内搜索',
      name: 'GitHub',
      sourceRef: 'builtin:gh'
    },
    {
      available: true,
      group: 'site',
      groupLabel: '站内搜索',
      name: 'Docs',
      sourceRef: 'custom:docs'
    }
  ]
};

function createFixture(renderModel = model) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const options = {
    onRemove: vi.fn().mockResolvedValue(undefined),
    onSave: vi.fn().mockResolvedValue({ ok: true })
  };
  const controller = createAggregateSearchListController(host, options);
  controllers.push(controller);
  act(() => controller.render(renderModel));
  return { controller, host, options };
}

function setInputValue(input: HTMLInputElement | null, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set;
  setter?.call(input, value);
  input?.dispatchEvent(new Event('input', { bubbles: true }));
}

async function clickSave(host: HTMLElement) {
  await act(async () => {
    host.querySelector<HTMLButtonElement>(
      '._x_extension_aggregate_search_editor_2026_unique_ ._x_extension_shortcut_save_2024_unique_'
    )?.click();
    await Promise.resolve();
  });
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function openAddEditorWithValidDraft(host: HTMLElement) {
  act(() => {
    host.querySelector<HTMLButtonElement>(
      '._x_extension_aggregate_search_add_2026_unique_'
    )?.click();
  });
  act(() => {
    setInputValue(
      host.querySelector<HTMLInputElement>('[data-aggregate-field="name"]'),
      '技术检索'
    );
    host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gg"]')
      ?.click();
    host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gh"]')
      ?.click();
  });
}

afterEach(() => {
  act(() => controllers.forEach((controller) => controller.destroy()));
  controllers = [];
  document.body.textContent = '';
});

describe('Options aggregate-search React island', () => {
  it('creates an aggregate with at least two sources and the group preference', async () => {
    const { host, options } = createFixture();

    expect(createAggregateSearchListApi().implementation).toBe('react');
    expect(host.dataset.reactIsland).toBe('options-aggregate-search-list');
    expect(host.querySelector(
      '._x_extension_settings_placeholder_2024_unique_'
    )).toBeNull();
    const addButton = host.querySelector<HTMLButtonElement>(
      '._x_extension_aggregate_search_add_2026_unique_'
    );
    const addForm = addButton?.closest<HTMLElement>(
      '._x_extension_shortcut_form_2024_unique_'
    );
    expect(addForm?.dataset.expanded).toBe('false');
    expect(addButton?.parentElement?.classList.contains(
      '_x_extension_shortcut_form_trigger_2024_unique_'
    )).toBe(true);

    act(() => {
      addButton?.click();
    });
    expect(addForm?.dataset.expanded).toBe('true');
    expect(host.querySelector('[data-aggregate-field="name"]')?.closest(
      '._x_extension_shortcut_form_fields_2024_unique_'
    )).toBe(addForm?.querySelector(
      '._x_extension_shortcut_form_fields_2024_unique_'
    ));
    expect(host.querySelector<HTMLInputElement>('[data-aggregate-field="name"]')
      ?.maxLength).toBe(80);
    expect(addForm?.querySelector<HTMLButtonElement>(
      '._x_extension_shortcut_save_2024_unique_'
    )?.textContent).toBe(model.copy.addLabel);
    act(() => {
      setInputValue(
        host.querySelector<HTMLInputElement>('[data-aggregate-field="name"]'),
        ' 技术检索 '
      );
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gg"]')
        ?.click();
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gh"]')
        ?.click();
      host.querySelector<HTMLInputElement>(
        '._x_extension_switch_2024_unique_ input'
      )?.click();
    });
    await clickSave(host);

    expect(options.onSave).toHaveBeenCalledWith(null, {
      autoCreateTabGroup: true,
      name: '技术检索',
      sourceRefs: ['builtin:gg', 'builtin:gh']
    });
  });

  it('shows required-name and minimum-source validation before saving', async () => {
    const { host, options } = createFixture();
    act(() => {
      host.querySelector<HTMLButtonElement>(
        '._x_extension_aggregate_search_add_2026_unique_'
      )?.click();
    });

    await clickSave(host);
    expect(host.querySelector('[role="alert"]')?.textContent)
      .toBe(model.copy.nameRequiredError);
    expect(host.querySelector('[data-aggregate-field="name"]')
      ?.getAttribute('aria-invalid')).toBe('true');

    act(() => {
      setInputValue(
        host.querySelector<HTMLInputElement>('[data-aggregate-field="name"]'),
        '技术检索'
      );
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gg"]')
        ?.click();
    });
    await clickSave(host);

    expect(options.onSave).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent)
      .toBe(model.copy.minSourcesError);
    expect(host.querySelector('._x_extension_aggregate_search_sources_2026_unique_')
      ?.getAttribute('aria-invalid')).toBe('true');
  });

  it('prevents selecting more than the configured maximum', () => {
    const limitModel = {
      ...model,
      copy: {
        ...model.copy,
        maxSourcesError: '最多 2 个'
      },
      maxSourceCount: 2
    };
    const { host } = createFixture(limitModel);
    act(() => {
      host.querySelector<HTMLButtonElement>(
        '._x_extension_aggregate_search_add_2026_unique_'
      )?.click();
    });
    act(() => {
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gg"]')
        ?.click();
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gh"]')
        ?.click();
    });
    act(() => {
      host.querySelector<HTMLInputElement>('[data-source-ref="custom:docs"]')
        ?.click();
    });

    expect(host.querySelector<HTMLInputElement>('[data-source-ref="custom:docs"]')
      ?.checked).toBe(false);
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('最多 2 个');
    expect(host.querySelector('._x_extension_aggregate_search_count_2026_unique_')
      ?.textContent).toBe('已选 2/2');
  });

  it('keeps the editor open and shows a rejected save error', async () => {
    const { host, options } = createFixture();
    options.onSave.mockRejectedValueOnce(new Error('存储暂时不可用'));
    openAddEditorWithValidDraft(host);

    await clickSave(host);

    expect(host.querySelector('[role="alert"]')?.textContent)
      .toBe('存储暂时不可用');
    expect(host.querySelector('[data-aggregate-field="name"]')).not.toBeNull();
    expect(host.querySelector<HTMLButtonElement>(
      '._x_extension_shortcut_save_2024_unique_'
    )?.disabled).toBe(false);
  });

  it('keeps the editor open and shows an unsuccessful save result', async () => {
    const { host, options } = createFixture();
    options.onSave.mockResolvedValueOnce({
      ok: false,
      error: '名称已被使用'
    });
    openAddEditorWithValidDraft(host);

    await clickSave(host);

    expect(host.querySelector('[role="alert"]')?.textContent)
      .toBe('名称已被使用');
    expect(host.querySelector('[data-aggregate-field="name"]')).not.toBeNull();
  });

  it('prevents a second save while the first save is pending', async () => {
    const deferred = createDeferred<{ ok: boolean }>();
    const { host, options } = createFixture();
    options.onSave.mockReturnValueOnce(deferred.promise);
    openAddEditorWithValidDraft(host);
    const saveButton = host.querySelector<HTMLButtonElement>(
      '._x_extension_shortcut_save_2024_unique_'
    );

    await act(async () => {
      saveButton?.click();
      await Promise.resolve();
    });
    expect(saveButton?.disabled).toBe(true);
    expect(saveButton?.getAttribute('aria-busy')).toBe('true');

    act(() => {
      saveButton?.click();
    });
    expect(options.onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ ok: true });
      await deferred.promise;
    });
    expect(host.querySelector('[data-aggregate-field="name"]')).toBeNull();
  });

  it('keeps a selected source visible and removable if it disappears while editing', async () => {
    const unavailableItem = {
      autoCreateTabGroup: false,
      id: 'aggregate:needs-repair',
      name: '待修复聚合',
      sourceRefs: ['builtin:gg', 'custom:docs'],
      sourceSummary: '2 个搜索源 · 1 个不可用'
    };
    const initialModel = {
      ...model,
      items: [unavailableItem]
    };
    const { controller, host, options } = createFixture(initialModel);
    act(() => {
      host.querySelector<HTMLButtonElement>(
        '._x_extension_shortcut_edit_2024_unique_'
      )?.click();
    });

    act(() => controller.render({
      ...initialModel,
      providers: initialModel.providers.filter(
        (provider) => provider.sourceRef !== 'custom:docs'
      )
    }));
    const unavailableInput = host.querySelector<HTMLInputElement>(
      '[data-source-ref="custom:docs"]'
    );
    expect(unavailableInput?.checked).toBe(true);
    expect(unavailableInput?.disabled).toBe(false);
    expect(unavailableInput?.closest('label')?.dataset.available).toBe('false');
    expect(unavailableInput?.closest('[role="group"]')
      ?.getAttribute('aria-label')).toBe(model.copy.unavailableGroupLabel);
    expect(unavailableInput?.closest('label')?.textContent)
      .toContain('不可用的搜索源（custom:docs）');

    act(() => {
      unavailableInput?.click();
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gh"]')
        ?.click();
    });
    await clickSave(host);

    expect(options.onSave).toHaveBeenCalledWith(unavailableItem.id, {
      autoCreateTabGroup: false,
      name: unavailableItem.name,
      sourceRefs: ['builtin:gg', 'builtin:gh']
    });
  });

  it('restores focus after cancelling or successfully saving an unmounted editor', async () => {
    const item = {
      autoCreateTabGroup: false,
      id: 'aggregate:focus',
      name: '焦点测试',
      sourceRefs: ['builtin:gg', 'builtin:gh'],
      sourceSummary: '2 个搜索源'
    };
    const { host } = createFixture({
      ...model,
      items: [item]
    });
    const editButton = host.querySelector<HTMLButtonElement>(
      '._x_extension_shortcut_edit_2024_unique_'
    );
    const addButton = host.querySelector<HTMLButtonElement>(
      '._x_extension_aggregate_search_add_2026_unique_'
    );

    act(() => editButton?.click());
    const editCancelButton = host.querySelector<HTMLButtonElement>(
      '._x_extension_aggregate_search_editor_2026_unique_ '
      + '._x_extension_shortcut_secondary_2024_unique_'
    );
    act(() => {
      editCancelButton?.focus();
      editCancelButton?.click();
    });
    expect(host.querySelector('[data-aggregate-field="name"]')).toBeNull();
    expect(document.activeElement).toBe(editButton);

    act(() => editButton?.click());
    await clickSave(host);
    expect(host.querySelector('[data-aggregate-field="name"]')).toBeNull();
    expect(document.activeElement).toBe(editButton);

    act(() => addButton?.click());
    const addCancelButton = host.querySelector<HTMLButtonElement>(
      '._x_extension_shortcut_form_fields_2024_unique_ '
      + '._x_extension_shortcut_secondary_2024_unique_'
    );
    act(() => {
      addCancelButton?.focus();
      addCancelButton?.click();
    });
    expect(host.querySelector('[data-aggregate-field="name"]')).toBeNull();
    expect(document.activeElement).toBe(addButton);

    openAddEditorWithValidDraft(host);
    await clickSave(host);
    expect(host.querySelector('[data-aggregate-field="name"]')).toBeNull();
    expect(document.activeElement).toBe(addButton);
  });

  it('focuses the adjacent edit action, then Add, after confirmed removals unmount items', async () => {
    const items = [
      {
        autoCreateTabGroup: false,
        id: 'aggregate:first',
        name: '第一个',
        sourceRefs: ['builtin:gg', 'builtin:gh'],
        sourceSummary: '2 个搜索源'
      },
      {
        autoCreateTabGroup: false,
        id: 'aggregate:second',
        name: '第二个',
        sourceRefs: ['builtin:gg', 'builtin:gh'],
        sourceSummary: '2 个搜索源'
      }
    ];
    const renderModel = { ...model, items };
    const { controller, host, options } = createFixture(renderModel);
    let remainingItems = items;
    options.onRemove.mockImplementation(async (id: string) => {
      remainingItems = remainingItems.filter((item) => item.id !== id);
      controller.render({ ...renderModel, items: remainingItems });
    });

    const confirmRemoval = async (itemId: string) => {
      const card = host.querySelector<HTMLElement>(
        `[data-aggregate-id="${itemId}"]`
      );
      act(() => card?.querySelector<HTMLButtonElement>(
        '._x_extension_shortcut_remove_2024_unique_'
      )?.click());
      const confirmButton = card?.querySelectorAll<HTMLButtonElement>(
        '._x_extension_popconfirm_actions_2024_unique_ button'
      )[1];
      await act(async () => {
        confirmButton?.focus();
        confirmButton?.click();
        await Promise.resolve();
        await Promise.resolve();
      });
    };

    await confirmRemoval(items[0].id);
    expect(host.querySelector(`[data-aggregate-id="${items[0].id}"]`))
      .toBeNull();
    expect(document.activeElement).toBe(host.querySelector(
      `[data-aggregate-id="${items[1].id}"] `
      + '._x_extension_shortcut_edit_2024_unique_'
    ));

    await confirmRemoval(items[1].id);
    expect(host.querySelector(`[data-aggregate-id="${items[1].id}"]`))
      .toBeNull();
    expect(document.activeElement).toBe(host.querySelector(
      '._x_extension_aggregate_search_add_2026_unique_'
    ));
  });

  it('edits, toggles, and removes an existing aggregate', async () => {
    const item = {
      autoCreateTabGroup: false,
      id: 'aggregate:tech',
      name: '技术检索',
      sourceRefs: ['builtin:gg', 'builtin:gh'],
      sourceSummary: '2 个搜索源 · 不创建标签页组'
    };
    const { host, options } = createFixture({
      ...model,
      items: [item]
    });
    const aggregateCard = host.querySelector<HTMLElement>('[data-aggregate-id="aggregate:tech"]');
    expect(aggregateCard?.querySelector(
      '._x_extension_shortcut_editor_2024_unique_[aria-hidden="true"]'
    )).not.toBeNull();
    expect(aggregateCard?.querySelector('[data-aggregate-field="name"]')).toBeNull();

    act(() => {
      host.querySelector<HTMLButtonElement>(
        '._x_extension_shortcut_edit_2024_unique_'
      )?.click();
    });
    expect(aggregateCard?.querySelector<HTMLButtonElement>(
      '._x_extension_shortcut_editor_actions_2024_unique_ ._x_extension_shortcut_save_2024_unique_'
    )?.textContent).toBe(model.copy.saveLabel);
    act(() => {
      setInputValue(
        host.querySelector<HTMLInputElement>('[data-aggregate-field="name"]'),
        '开发检索'
      );
      host.querySelector<HTMLInputElement>('[data-source-ref="builtin:gh"]')
        ?.click();
      host.querySelector<HTMLInputElement>('[data-source-ref="custom:docs"]')
        ?.click();
      host.querySelector<HTMLInputElement>(
        '._x_extension_switch_2024_unique_ input'
      )?.click();
    });
    await clickSave(host);

    expect(options.onSave).toHaveBeenCalledWith(item.id, {
      autoCreateTabGroup: true,
      name: '开发检索',
      sourceRefs: ['builtin:gg', 'custom:docs']
    });

    act(() => {
      host.querySelector<HTMLButtonElement>(
        '._x_extension_shortcut_remove_2024_unique_'
      )?.click();
    });
    const confirmButtons = host.querySelectorAll<HTMLButtonElement>(
      '._x_extension_popconfirm_actions_2024_unique_ button'
    );
    await act(async () => {
      confirmButtons[1]?.click();
      await Promise.resolve();
    });

    expect(options.onRemove).toHaveBeenCalledWith(item.id);
  });
});
