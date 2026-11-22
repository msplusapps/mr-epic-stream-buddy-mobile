import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Check,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { api } from '@/services/api';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { InputField } from '@/components/forms/InputField';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();

  const [newTaskText, setNewTaskText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [adding, setAdding] = useState(false);

  const {
    data: todos,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.getTodos(),
  });

  const totalCount = todos?.length || 0;
  const completedCount = (todos || []).filter((t) => !!t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressRatio = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredTodos = useMemo(() => {
    if (!todos) return [];
    if (filter === 'pending') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => !!t.completed);
    return todos;
  }, [todos, filter]);

  const handleToggle = async (id: number, currentCompleted: boolean) => {
    triggerHaptic('medium');
    try {
      await api.toggleTodo(id, !currentCompleted);
      refetch();
    } catch { }
  };

  const handleCreate = async () => {
    if (!newTaskText.trim()) return;
    try {
      setAdding(true);
      triggerHaptic('success');
      await api.createTodo(newTaskText.trim());
      setNewTaskText('');
      refetch();
    } catch { } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    triggerHaptic('warning');
    try {
      await api.deleteTodo(id);
      refetch();
    } catch { }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Header
        title="Stream Checklist"
        subtitle={`${completedCount}/${totalCount} goals completed`}
      />

      {/* Progress & Stats Banner */}
      <View style={styles.bannerWrap}>
        <Card variant="glow" style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={[styles.progressLabel, { color: theme.textDim }]}>
                STREAM READINESS
              </Text>
              <Text style={[styles.progressNumber, { color: theme.primary }]}>
                {Math.round(progressRatio)}%
              </Text>
            </View>
            <View style={styles.ratioBox}>
              <Text style={[styles.ratioDone, { color: theme.success }]}>
                {completedCount} Done
              </Text>
              <Text style={[styles.ratioPending, { color: theme.warning }]}>
                {pendingCount} Pending
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressRatio}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
        </Card>
      </View>

      {/* Add Task Input Row */}
      <View style={styles.addInputRow}>
        <View style={{ flex: 1 }}>
          <InputField
            placeholder="Add new stream goal or to-do..."
            value={newTaskText}
            onChangeText={setNewTaskText}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
        </View>
        <Pressable
          onPress={handleCreate}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Plus size={22} color="#000" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed'] as const).map((f) => {
          const isSelected = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => {
                triggerHaptic('selection');
                setFilter(f);
              }}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? theme.primary : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? '#000' : theme.textDim },
                ]}
              >
                {f.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Todo List */}
      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isDone = !!item.completed;
          return (
            <Card
              active={isDone}
              variant={isDone ? 'flat' : 'glow'}
              style={styles.taskCard}
            >
              <View style={styles.taskRow}>
                <Pressable
                  onPress={() => handleToggle(item.id, isDone)}
                  style={styles.checkBtn}
                >
                  {isDone ? (
                    <CheckCircle2 size={24} color={theme.success} />
                  ) : (
                    <Circle size={24} color={theme.textMuted} />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => handleToggle(item.id, isDone)}
                  style={{ flex: 1 }}
                >
                  <Text
                    style={[
                      styles.taskText,
                      {
                        color: isDone ? theme.textMuted : theme.text,
                        textDecorationLine: isDone ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.task}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(item.id)}
                  style={styles.delBtn}
                >
                  <Trash2 size={16} color={theme.danger} />
                </Pressable>
              </View>
            </Card>
          );
        }}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              triggerHaptic('light');
              refetch();
            }}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<CheckSquare size={32} color={theme.primary} />}
              title="All Goals Completed"
              description="No tasks in this category. You are stream ready!"
            />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressCard: {
    padding: 18,
    marginVertical: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  ratioBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  ratioDone: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratioPending: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  taskCard: {
    padding: 16,
    marginVertical: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBtn: {
    padding: 2,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  delBtn: {
    padding: 6,
  },
});
