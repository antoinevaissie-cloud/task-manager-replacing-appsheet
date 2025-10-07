"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { Task } from "@/types/task";
import { TaskItem } from "./TaskItem";
import { useTaskStore } from "@/lib/store/taskStore";
import { useTaskMutations } from "@/lib/hooks/useTasks";

interface TaskListProps {
  tasks: Task[];
  title?: string;
  emptyState?: string;
  enableSelection?: boolean;
  enableReorder?: boolean;
  onTaskClick?: (task: Task) => void;
  emptyAction?: ReactNode;
}

interface SortableTaskItemProps {
  task: Task;
  enableSelection: boolean;
  onTaskClick?: (task: Task) => void;
}

function SortableTaskItem({ task, enableSelection, onTaskClick }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        allowSelection={enableSelection}
        draggableHandle={handle}
        onClick={onTaskClick}
      />
    </div>
  );
}

export function TaskList({
  tasks,
  title,
  emptyState = "No tasks to display.",
  enableSelection = false,
  enableReorder = false,
  onTaskClick,
  emptyAction,
}: TaskListProps) {
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const { updateTask } = useTaskMutations();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyState}</p>
        {emptyAction ? <div className="mt-3 text-sm text-primary">{emptyAction}</div> : null}
      </div>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.sortOrder != null && b.sortOrder != null) {
      return a.sortOrder - b.sortOrder;
    }
    if (a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!enableReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedTasks.findIndex((task) => task.id === active.id);
    const newIndex = sortedTasks.findIndex((task) => task.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sortedTasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderTasks(reordered.map((task) => task.id));

    await Promise.all(
      reordered.map((task, index) =>
        updateTask.mutateAsync({
          id: task.id,
          updates: { sortOrder: index },
        }),
      ),
    );
  };

  return (
    <section className="space-y-4">
      {title ? <h2 className="text-lg font-medium tracking-tight">{title}</h2> : null}
      {enableReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {sortedTasks.map((task) => (
                <li key={task.id}>
                  <SortableTaskItem
                    task={task}
                    enableSelection={enableSelection}
                    onTaskClick={onTaskClick}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {sortedTasks.map((task) => (
            <li key={task.id}>
              <TaskItem task={task} allowSelection={enableSelection} onClick={onTaskClick} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
