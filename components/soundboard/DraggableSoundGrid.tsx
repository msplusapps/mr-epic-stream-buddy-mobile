import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Move,
} from 'lucide-react-native';
import { SoundAsset, ThemePalette } from '@/types';
import { triggerHaptic } from '@/utils/haptics';

const { width } = Dimensions.get('window');

const NUM_COLUMNS = 3;
const GRID_PADDING = 16;
const GAP = 10;
const PAD_WIDTH = Math.floor((width - GRID_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);
const PAD_HEIGHT = 86;
const STEP_X = PAD_WIDTH + GAP;
const STEP_Y = PAD_HEIGHT + GAP;

const ACTIVE_PAD_COLOR = ['#10b981', '#059669'];

interface DraggableSoundGridProps {
  sounds: SoundAsset[];
  currentSound: SoundAsset | null;
  isPlaying: boolean;
  padBlinkAnim: Animated.Value;
  theme: ThemePalette;
  isReorderMode: boolean;
  setIsReorderMode: (val: boolean) => void;
  onTriggerSound: (sound: SoundAsset) => void;
  onReorder: (newSounds: SoundAsset[]) => void;
  setIsDraggingParent?: (dragging: boolean) => void;
}

export const DraggableSoundGrid: React.FC<DraggableSoundGridProps> = ({
  sounds,
  currentSound,
  isPlaying,
  padBlinkAnim,
  theme,
  isReorderMode,
  setIsReorderMode,
  onTriggerSound,
  onReorder,
  setIsDraggingParent,
}) => {
  const [items, setItems] = useState<SoundAsset[]>(sounds);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Sync internal state with external sounds list
  useEffect(() => {
    setItems(sounds);
  }, [sounds]);

  const idlePadColors = [theme.primary, theme.vibrant || theme.primary];

  // Pan animation values for dragging
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const longPressTimer = useRef<any>(null);

  // Calculate layout coordinates
  const getSlotPosition = (index: number) => {
    const col = index % NUM_COLUMNS;
    const row = Math.floor(index / NUM_COLUMNS);
    return {
      x: col * STEP_X,
      y: row * STEP_Y,
    };
  };

  const totalRows = Math.ceil(items.length / NUM_COLUMNS);
  const totalGridHeight = totalRows * STEP_Y;

  // Move item in array helper
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
      return items;
    }
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
    return updated;
  };

  // Nudge item left
  const handleNudgeLeft = (index: number) => {
    if (index <= 0) return;
    triggerHaptic('light');
    const updated = moveItem(index, index - 1);
    onReorder(updated);
  };

  // Nudge item right
  const handleNudgeRight = (index: number) => {
    if (index >= items.length - 1) return;
    triggerHaptic('light');
    const updated = moveItem(index, index + 1);
    onReorder(updated);
  };

  // Create PanResponder factory for a specific pad index
  const createPanResponder = (index: number, sound: SoundAsset) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => isReorderMode,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          isReorderMode ||
          Math.abs(gestureState.dx) > 8 ||
          Math.abs(gestureState.dy) > 8
        );
      },
      onPanResponderGrant: () => {
        triggerHaptic('medium');
        setDraggingIndex(index);
        setHoverIndex(index);
        pan.setValue({ x: 0, y: 0 });
        if (setIsDraggingParent) setIsDraggingParent(true);
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Calculate which slot center is closest to dragged position
        const currentPos = getSlotPosition(index);
        const touchX = currentPos.x + gestureState.dx + PAD_WIDTH / 2;
        const touchY = currentPos.y + gestureState.dy + PAD_HEIGHT / 2;

        const targetCol = Math.min(
          NUM_COLUMNS - 1,
          Math.max(0, Math.floor(touchX / STEP_X))
        );
        const targetRow = Math.min(
          totalRows - 1,
          Math.max(0, Math.floor(touchY / STEP_Y))
        );
        const targetIndex = Math.min(
          items.length - 1,
          Math.max(0, targetRow * NUM_COLUMNS + targetCol)
        );

        if (targetIndex !== hoverIndex) {
          triggerHaptic('selection');
          setHoverIndex(targetIndex);
        }
      },
      onPanResponderRelease: () => {
        handleEndDrag(index);
      },
      onPanResponderTerminate: () => {
        handleEndDrag(index);
      },
    });
  };

  const handleEndDrag = (fromIndex: number) => {
    if (setIsDraggingParent) setIsDraggingParent(false);

    if (hoverIndex !== null && hoverIndex !== fromIndex) {
      triggerHaptic('success');
      const updated = moveItem(fromIndex, hoverIndex);
      onReorder(updated);
    } else {
      triggerHaptic('light');
    }

    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start(() => {
      setDraggingIndex(null);
      setHoverIndex(null);
    });
  };

  return (
    <View style={styles.container}>
      {/* Arrange Mode Instructions / Header Indicator */}
      {isReorderMode && (
        <View style={[styles.arrangeModeBanner, { borderColor: theme.border }]}>
          <View style={styles.arrangeModeLeft}>
            <Move size={16} color={theme.primary} />
            <View>
              <Text style={styles.arrangeModeTitle}>Arrange Mode Active</Text>
              <Text style={styles.arrangeModeDesc}>
                Drag & drop pads to sort their hotkey positions
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              setIsReorderMode(false);
            }}
            style={[styles.doneBtn, { backgroundColor: theme.primary }]}
          >
            <Check size={14} color="#ffffff" strokeWidth={3} />
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      )}

      {/* Grid Canvas */}
      <View style={[styles.gridCanvas, { height: totalGridHeight }]}>
        {items.map((sound, index) => {
          const isThisPlaying = currentSound?.id === sound.id && isPlaying;
          const isBeingDragged = draggingIndex === index;
          const slot = getSlotPosition(index);
          const panResponder = createPanResponder(index, sound);

          // If this item is being dragged, add pan values to its transform
          const transform = isBeingDragged
            ? [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: 1.08 },
              ]
            : [{ scale: 1 }];

          const isTargetHover = hoverIndex === index && draggingIndex !== null && !isBeingDragged;

          return (
            <Animated.View
              key={sound.id}
              style={[
                styles.padPositionWrap,
                {
                  left: slot.x,
                  top: slot.y,
                  width: PAD_WIDTH,
                  height: PAD_HEIGHT,
                  zIndex: isBeingDragged ? 999 : 1,
                  transform,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Pressable
                onPress={() => {
                  if (isReorderMode) {
                    triggerHaptic('light');
                  } else {
                    onTriggerSound(sound);
                  }
                }}
                onLongPress={() => {
                  triggerHaptic('heavy');
                  setIsReorderMode(true);
                }}
                delayLongPress={220}
                style={styles.pressablePad}
              >
                <Animated.View
                  style={[
                    styles.padAnimatedWrap,
                    isThisPlaying && { opacity: padBlinkAnim },
                  ]}
                >
                  <LinearGradient
                    colors={isThisPlaying ? (ACTIVE_PAD_COLOR as any) : (idlePadColors as any)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.soundPad,
                      isThisPlaying
                        ? styles.soundPadActiveGreen
                        : [
                            styles.soundPadDefault,
                            { borderColor: theme.border || 'rgba(168, 85, 247, 0.22)' },
                          ],
                      isBeingDragged && styles.soundPadDragging,
                      isTargetHover && styles.soundPadHoverTarget,
                    ]}
                  >
                    {/* Top Row: PAD # and Status/Drag Grip */}
                    <View style={styles.padTopLine}>
                      <View style={styles.hotkeyTagRow}>
                        <Text style={[styles.padHotkey, isThisPlaying && styles.padHotkeyActive]}>
                          PAD {index + 1}
                        </Text>
                      </View>

                      {isThisPlaying && (
                        <View style={styles.padPlayingIndicatorGreen}>
                          <Play size={10} color="#059669" fill="#059669" />
                        </View>
                      )}

                      {isReorderMode && (
                        <View style={styles.dragGripBadge}>
                          <GripVertical size={12} color="#ffffff" />
                        </View>
                      )}
                    </View>

                    {/* Sound Title */}
                    <Text
                      style={[styles.padTitle, isThisPlaying && styles.padTitleActive]}
                      numberOfLines={2}
                    >
                      {sound.name}
                    </Text>

                    {/* Reorder Mode Arrows: Instant 1-slot nudge */}
                    {isReorderMode && (
                      <View style={styles.nudgeArrowsRow}>
                        <Pressable
                          onPress={() => handleNudgeLeft(index)}
                          disabled={index === 0}
                          style={[styles.nudgeBtn, index === 0 && { opacity: 0.3 }]}
                        >
                          <ChevronLeft size={14} color="#ffffff" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleNudgeRight(index)}
                          disabled={index === items.length - 1}
                          style={[
                            styles.nudgeBtn,
                            index === items.length - 1 && { opacity: 0.3 },
                          ]}
                        >
                          <ChevronRight size={14} color="#ffffff" />
                        </Pressable>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  arrangeModeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 12,
  },
  arrangeModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  arrangeModeTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  arrangeModeDesc: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    marginTop: 1,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  gridCanvas: {
    position: 'relative',
    width: '100%',
  },
  padPositionWrap: {
    position: 'absolute',
  },
  pressablePad: {
    flex: 1,
  },
  padAnimatedWrap: {
    flex: 1,
  },
  soundPad: {
    flex: 1,
    borderRadius: 16,
    padding: 9,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  soundPadDefault: {
    borderWidth: 1.5,
  },
  soundPadActiveGreen: {
    borderWidth: 2,
    borderColor: '#34d399',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  soundPadDragging: {
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 16,
  },
  soundPadHoverTarget: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  padTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotkeyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  padHotkey: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
  },
  padHotkeyActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  dragGripBadge: {
    padding: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
  },
  padPlayingIndicatorGreen: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  padTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  padTitleActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  nudgeArrowsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  nudgeBtn: {
    padding: 2,
  },
});
