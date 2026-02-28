'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ICategory } from '@/interfaces';
import { SortableTab } from './SortableTab';

interface DraggableTabsProps {
  categories: ICategory[];
  currentBrandName: string;
  onTabClick: (brandName: string) => void;
  onReorder: (newCategories: ICategory[]) => void;
}

export function DraggableTabs({
  categories,
  currentBrandName,
  onTabClick,
  onReorder,
}: DraggableTabsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(
        (cat) => cat.brandName === active.id
      );
      const newIndex = categories.findIndex((cat) => cat.brandName === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(categories, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((cat) => cat.brandName)}
        strategy={horizontalListSortingStrategy}
      >
        <div className='flex overflow-x-auto border-b border-gray-200'>
          {categories.map((category) => (
            <SortableTab
              key={category.brandName}
              category={category}
              isActive={currentBrandName === category.brandName}
              onClick={() => onTabClick(category.brandName)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
