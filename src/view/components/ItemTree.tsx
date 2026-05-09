'use client';

import React from 'react';
import { ItemNode } from '@/types/item';
import { ItemTreeNode } from './item-tree/ItemTreeNode';
import '../styles/item-tree.css';

interface ItemTreeProps {
  node: ItemNode;
  isRoot?: boolean;
}

export const ItemTree: React.FC<ItemTreeProps> = ({ node, isRoot = false }) => {
  return <ItemTreeNode node={node} isRoot={isRoot} />;
};
