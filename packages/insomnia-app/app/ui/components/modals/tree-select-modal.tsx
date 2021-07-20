import React, { createRef, FC, PureComponent, useCallback } from 'react';
import Modal from '../base/modal';
import ModalBody from '../base/modal-body';
import ModalHeader from '../base/modal-header';
import ModalFooter from '../base/modal-footer';
import { autoBindMethodsForReact } from 'class-autobind-decorator';
import { AUTOBIND_CFG } from '../../../common/constants';
import { showModal } from '.';
import styled from 'styled-components';

interface TreeSelectOption {
  id: string;
  children?: TreeSelectOption[];
  checked: boolean;
}

export interface TreeSelectModalShowOptions {
  message: string | null;
  onCancel?: {
    label: string;
    action: () => void;
  };
  onDone?: {
    label: string;
    action: (ids: string[]) => void | Promise<void>;
  };
  options: TreeSelectOption[];
  title: string | null;
}

const initialState: TreeSelectModalShowOptions = {
  message: null,
  options: [],
  title: null,
};

const TreeWrapper = styled.div<{ $indent: number }>(({ $indent }) => ({
  marginLeft: $indent * 8,
}));

const TreeItemWrapper = styled.div({
  display: 'flex',
  alignItems: 'center',
  padding: 4,
  '&:hover': {
    backgroundColor: 'var(--hl-sm)',
  },
});

const TreeItemName = styled.div({
  display: 'flex',
  marginLeft: 6,
});

type UpdateNode = (update: Pick<TreeSelectOption, 'id' | 'checked'>) => void;

const TreeItem: FC<{
  indent: number,
  option: TreeSelectOption;
  updateNode: UpdateNode;
}> = ({
  option: {
    id,
    children,
    checked,
  },
  indent,
  updateNode,
}) => {
  const onChange = useCallback(() => {
    updateNode({ id, checked: !checked });
  }, [id, checked, updateNode]);

  return (
    <TreeItemWrapper key={id} onClick={onChange}>
      <input type="checkbox" checked={checked} onChange={onChange}/>
      <TreeItemName>{id}</TreeItemName>
      {children ? <Tree options={children} indent={indent + 1} updateNode={updateNode} /> : null}
    </TreeItemWrapper>
  );
};

const Tree: FC<{
  options?: TreeSelectOption[],
  indent?: number;
  updateNode: UpdateNode;
}> = ({ options, indent = 0, updateNode }) => {
  return (
    <TreeWrapper $indent={indent}>
      {options?.map(option => (
        <TreeItem
          indent={indent}
          key={option.id}
          option={option}
          updateNode={updateNode}
        />
      ))}
    </TreeWrapper>
  );
};

@autoBindMethodsForReact(AUTOBIND_CFG)
export class TreeSelectModal extends PureComponent<{}, TreeSelectModalShowOptions> {
  modal = createRef<Modal>();
  doneButton = createRef<HTMLButtonElement>();
  state: TreeSelectModalShowOptions = initialState;

  async onDone() {
    this.modal.current?.hide();
    const ids = this.state.options
      .filter(({ checked }) => checked)
      .map(({ id }) => id);

    await this.state.onDone?.action(ids);
  }

  async onCancel() {
    this.modal.current?.hide();
    await this.state.onCancel?.action();
  }

  updateNode({ id, checked }: Pick<TreeSelectOption, 'id' | 'checked'>) {
    const { options } = this.state;
    const index = options.findIndex(option => option.id === id);
    if (index === -1) {
      return;
    }
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      checked,
    };
    this.setState({ options: newOptions });
  }

  show({
    message,
    onCancel,
    onDone,
    options,
    title,
  }: TreeSelectModalShowOptions = initialState) {
    this.setState({
      message,
      onCancel,
      onDone,
      options,
      title,
    });

    this.modal.current?.show();

    setTimeout(() => {
      this.doneButton.current?.focus();
    }, 100);
  }

  setAll = (checked: boolean) => () => {
    const options = this.state.options.map(option => ({
      ...option,
      checked,
    }));
    this.setState({ options });
  }

  render() {
    const { title, options, onCancel, onDone } = this.state;

    return (
      <Modal ref={this.modal} onCancel={onCancel?.action}>
        <ModalHeader>{title || 'Confirm?'}</ModalHeader>
        <ModalBody className="wide pad">
          <button onClick={this.setAll(true)}>Select All</button>
          <button onClick={this.setAll(false)}>Select None</button>
          <Tree options={options} updateNode={this.updateNode} />
        </ModalBody>
        <ModalFooter>
          <button className="btn" onClick={this.onCancel}>
            {onCancel?.label ?? 'Cancel'}
          </button>
          <button ref={this.doneButton} className="btn" onClick={this.onDone}>
            {onDone?.label ?? 'Done'}
          </button>
        </ModalFooter>
      </Modal>
    );
  }
}

export const showTreeSelectModal = (options: TreeSelectModalShowOptions) => showModal(TreeSelectModal, options);
