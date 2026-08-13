import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  GitFork,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  Trash2,
  Edit3,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Layers,
  BookOpen,
  Check,
  Link2,
  X,
  HelpCircle,
  BarChart3,
  ChevronRight,
  Sliders,
  Share2,
  Download,
  AlertCircle,
  FileText,
  ListTodo,
  Target,
  Award,
  CheckSquare,
  Square,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Star,
  Crown,
  Lock,
  Unlock,
  PartyPopper,
  Trophy,
} from "lucide-react";
import { Subject, TopicNode, TopicEdge, TopicNodeStatus, SubTopicItem, SubTopicStatus, RoadmapBadge } from "../../types";
import { storageService, DEFAULT_TOPIC_NODES, DEFAULT_TOPIC_EDGES } from "../../services/storage";
import { audioSynth } from "../../services/audioSynth";

interface CurriculumMapScreenProps {
  subjects: Subject[];
  activeSubjectFilter?: string | null;
  onSelectSubjectFilter?: (subjectId: string | null) => void;
  onNavigateToNotes?: (subjectId?: string) => void;
  onNavigateToQuiz?: (topicTitle?: string) => void;
}

export const MILESTONE_BADGES_CONFIG = [
  {
    id: "badge_25",
    threshold: 25,
    title: "Bronze Explorer",
    subtitle: "25% Milestone Reached",
    description: "Completed 25% of the roadmap topics! First major milestone achieved.",
    perk: "+100 XP Bonus & Initiator Title",
    tier: "bronze" as const,
    icon: Zap,
    gradient: "from-amber-500 to-amber-700",
    border: "border-amber-400 dark:border-amber-600",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500 text-white",
  },
  {
    id: "badge_50",
    threshold: 50,
    title: "Silver Scholar",
    subtitle: "50% Halfway Mark",
    description: "Halfway through the subject roadmap! Demonstrated consistent focus.",
    perk: "+250 XP Bonus & Pioneer Title",
    tier: "silver" as const,
    icon: ShieldCheck,
    gradient: "from-slate-300 via-cyan-500 to-slate-500",
    border: "border-cyan-400 dark:border-cyan-600",
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-600 text-white",
  },
  {
    id: "badge_75",
    threshold: 75,
    title: "Gold Specialist",
    subtitle: "75% Mastery Achieved",
    description: "75% of roadmap mastered! Advanced topic comprehension.",
    perk: "+500 XP Bonus & Specialist Title",
    tier: "gold" as const,
    icon: Star,
    gradient: "from-amber-400 via-yellow-400 to-amber-600",
    border: "border-yellow-400 dark:border-yellow-500",
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
    badgeBg: "bg-amber-500 text-white",
  },
  {
    id: "badge_100",
    threshold: 100,
    title: "Diamond Conqueror",
    subtitle: "100% Roadmap Mastery",
    description: "100% Roadmap Mastery! Every single topic and sub-topic fully conquered.",
    perk: "+1000 XP Grandmaster Bonus & Legend Badge",
    tier: "diamond" as const,
    icon: Crown,
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    border: "border-purple-400 dark:border-purple-500",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-gradient-to-r from-indigo-600 to-pink-600 text-white",
  },
];

export const CurriculumMapScreen: React.FC<CurriculumMapScreenProps> = ({
  subjects,
  activeSubjectFilter,
  onSelectSubjectFilter,
  onNavigateToNotes,
  onNavigateToQuiz,
}) => {
  // 0. Primary View Mode State (Study Roadmap vs Interactive Node Graph)
  const [activeViewMode, setActiveViewMode] = useState<"roadmap" | "map">("roadmap");
  const [subTopicFilter, setSubTopicFilter] = useState<string>("all");
  const [newSubTopicInputs, setNewSubTopicInputs] = useState<Record<string, string>>({});

  // Digital Milestone Badges State
  const [unlockedBadges, setUnlockedBadges] = useState<RoadmapBadge[]>(() =>
    storageService.getUnlockedBadges()
  );
  const [inspectedBadge, setInspectedBadge] = useState<typeof MILESTONE_BADGES_CONFIG[0] | null>(null);
  const [celebrationBadge, setCelebrationBadge] = useState<typeof MILESTONE_BADGES_CONFIG[0] | null>(null);

  // 1. Data State
  const [nodes, setNodes] = useState<TopicNode[]>(() => storageService.getTopicNodes());
  const [edges, setEdges] = useState<TopicEdge[]>(() => storageService.getTopicEdges());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    activeSubjectFilter || "all"
  );

  // Sync selectedSubjectId if activeSubjectFilter prop changes
  useEffect(() => {
    if (activeSubjectFilter) {
      setSelectedSubjectId(activeSubjectFilter);
    }
  }, [activeSubjectFilter]);

  // Save to storage on state change
  useEffect(() => {
    storageService.saveTopicNodes(nodes);
  }, [nodes]);

  useEffect(() => {
    storageService.saveTopicEdges(edges);
  }, [edges]);

  // 2. Interactive Canvas State
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging Node State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection & Connection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConnectingMode, setIsConnectingMode] = useState<boolean>(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState<boolean>(false);
  const [isAddEdgeModalOpen, setIsAddEdgeModalOpen] = useState<boolean>(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // New Node Form State
  const [newNodeTitle, setNewNodeTitle] = useState<string>("");
  const [newNodeDesc, setNewNodeDesc] = useState<string>("");
  const [newNodeSubject, setNewNodeSubject] = useState<string>(
    subjects[0]?.id || "s_cs101"
  );
  const [newNodeStatus, setNewNodeStatus] = useState<TopicNodeStatus>("not_started");
  const [newNodeHours, setNewNodeHours] = useState<number>(3);
  const [newNodeDifficulty, setNewNodeDifficulty] = useState<
    "Beginner" | "Intermediate" | "Advanced"
  >("Intermediate");

  // New Connection Form State
  const [edgeSourceId, setEdgeSourceId] = useState<string>("");
  const [edgeTargetId, setEdgeTargetId] = useState<string>("");
  const [edgeLabel, setEdgeLabel] = useState<string>("Prerequisite");
  const [edgeType, setEdgeType] = useState<"prerequisite" | "related" | "subtopic">(
    "prerequisite"
  );

  // AI Generator Prompt
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiSubjectId, setAiSubjectId] = useState<string>(subjects[0]?.id || "s_cs101");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Canvas Reference
  const canvasRef = useRef<HTMLDivElement>(null);

  // Filtered Nodes & Edges
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchSubject =
        selectedSubjectId === "all" || node.subjectId === selectedSubjectId;
      const matchSearch =
        !searchQuery ||
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === "all" || node.status === statusFilter;
      return matchSubject && matchSearch && matchStatus;
    });
  }, [nodes, selectedSubjectId, searchQuery, statusFilter]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId));
  }, [edges, filteredNodes]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Dependent/Prerequisite Node Set for Highlighting
  const highlightedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();

    const set = new Set<string>([selectedNodeId]);
    // Ancestors (Prerequisites)
    const findParents = (currId: string) => {
      edges.forEach((e) => {
        if (e.targetId === currId && !set.has(e.sourceId)) {
          set.add(e.sourceId);
          findParents(e.sourceId);
        }
      });
    };
    // Downstream (Children/Unlocks)
    const findChildren = (currId: string) => {
      edges.forEach((e) => {
        if (e.sourceId === currId && !set.has(e.targetId)) {
          set.add(e.targetId);
          findChildren(e.targetId);
        }
      });
    };

    findParents(selectedNodeId);
    findChildren(selectedNodeId);
    return set;
  }, [selectedNodeId, edges]);

  // Sub-Topic Status Handlers
  const handleUpdateSubTopicStatus = (nodeId: string, subTopicId: string, newStatus: SubTopicStatus) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== nodeId) return node;
        const currentSubTopics = node.subTopics || [];
        const updatedSubTopics = currentSubTopics.map((st) =>
          st.id === subTopicId ? { ...st, status: newStatus } : st
        );

        // Auto recalculate parent topic status based on sub-topics
        const total = updatedSubTopics.length;
        const completedCount = updatedSubTopics.filter((st) => st.status === "completed").length;
        const inProgressCount = updatedSubTopics.filter((st) => st.status === "in_progress").length;

        let calculatedNodeStatus = node.status;
        if (total > 0) {
          if (completedCount === total) {
            calculatedNodeStatus = "mastered";
          } else if (completedCount > 0 || inProgressCount > 0) {
            calculatedNodeStatus = "in_progress";
          } else {
            calculatedNodeStatus = "not_started";
          }
        }

        return {
          ...node,
          status: calculatedNodeStatus,
          subTopics: updatedSubTopics,
        };
      })
    );
  };

  const handleAddSubTopic = (nodeId: string, title: string) => {
    if (!title.trim()) return;
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== nodeId) return node;
        const currentSubTopics = node.subTopics || [];
        const newSubTopic: SubTopicItem = {
          id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: title.trim(),
          status: "not_started",
        };
        return {
          ...node,
          subTopics: [...currentSubTopics, newSubTopic],
        };
      })
    );
    setNewSubTopicInputs((prev) => ({ ...prev, [nodeId]: "" }));
  };

  const handleDeleteSubTopic = (nodeId: string, subTopicId: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== nodeId) return node;
        const updatedSubTopics = (node.subTopics || []).filter((st) => st.id !== subTopicId);
        return {
          ...node,
          subTopics: updatedSubTopics,
        };
      })
    );
  };

  // Progression Stats
  const stats = useMemo(() => {
    const subjectNodes =
      selectedSubjectId === "all"
        ? nodes
        : nodes.filter((n) => n.subjectId === selectedSubjectId);

    const total = subjectNodes.length;
    const mastered = subjectNodes.filter((n) => n.status === "mastered").length;
    const inProgress = subjectNodes.filter((n) => n.status === "in_progress").length;
    const notStarted = subjectNodes.filter((n) => n.status === "not_started").length;

    const totalHours = subjectNodes.reduce((acc, n) => acc + (n.estimatedHours || 0), 0);
    const masteredHours = subjectNodes
      .filter((n) => n.status === "mastered")
      .reduce((acc, n) => acc + (n.estimatedHours || 0), 0);

    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    // Sub-topic level aggregate metrics
    const allSubTopics = subjectNodes.flatMap((n) => n.subTopics || []);
    const totalSubTopics = allSubTopics.length;
    const completedSubTopics = allSubTopics.filter((st) => st.status === "completed").length;
    const inProgressSubTopics = allSubTopics.filter((st) => st.status === "in_progress").length;
    const notStartedSubTopics = allSubTopics.filter((st) => st.status === "not_started").length;
    const subTopicPercent = totalSubTopics > 0 ? Math.round((completedSubTopics / totalSubTopics) * 100) : 0;

    return {
      total,
      mastered,
      inProgress,
      notStarted,
      totalHours,
      masteredHours,
      percent,
      totalSubTopics,
      completedSubTopics,
      inProgressSubTopics,
      notStartedSubTopics,
      subTopicPercent,
    };
  }, [nodes, selectedSubjectId]);

  // Auto-Unlock Digital Milestone Badges when stats.percent crosses 25%, 50%, 75%, or 100%
  useEffect(() => {
    if (stats.total === 0) return;

    const currentSubjectId = selectedSubjectId || "all";
    const currentPercent = stats.percent;

    let updatedList = [...unlockedBadges];
    let newlyUnlockedBadge: typeof MILESTONE_BADGES_CONFIG[0] | null = null;

    MILESTONE_BADGES_CONFIG.forEach((badgeConfig) => {
      const badgeKey = `${badgeConfig.id}_${currentSubjectId}`;
      const isAlreadyUnlocked = updatedList.some(
        (b) => b.id === badgeKey || (b.id === badgeConfig.id && b.subjectId === currentSubjectId)
      );

      if (currentPercent >= badgeConfig.threshold && !isAlreadyUnlocked) {
        const newRecord: RoadmapBadge = {
          id: badgeKey,
          threshold: badgeConfig.threshold,
          title: badgeConfig.title,
          subtitle: badgeConfig.subtitle,
          description: badgeConfig.description,
          perk: badgeConfig.perk,
          tier: badgeConfig.tier,
          iconName: badgeConfig.id,
          unlockedAt: new Date().toISOString(),
          subjectId: currentSubjectId,
        };
        updatedList.push(newRecord);
        newlyUnlockedBadge = badgeConfig;
      }
    });

    if (newlyUnlockedBadge) {
      setUnlockedBadges(updatedList);
      storageService.saveUnlockedBadges(updatedList);
      setCelebrationBadge(newlyUnlockedBadge);
      audioSynth.playChime("success");
    }
  }, [stats.percent, selectedSubjectId, stats.total]);

  // Helper getters for badge unlock status
  const isBadgeUnlocked = (badgeConfig: typeof MILESTONE_BADGES_CONFIG[0], subjectId: string) => {
    const badgeKey = `${badgeConfig.id}_${subjectId}`;
    return unlockedBadges.some(
      (b) => b.id === badgeKey || (b.id === badgeConfig.id && b.subjectId === subjectId)
    );
  };

  const getBadgeUnlockedDate = (badgeConfig: typeof MILESTONE_BADGES_CONFIG[0], subjectId: string) => {
    const badgeKey = `${badgeConfig.id}_${subjectId}`;
    const found = unlockedBadges.find(
      (b) => b.id === badgeKey || (b.id === badgeConfig.id && b.subjectId === subjectId)
    );
    return found?.unlockedAt;
  };

  const unlockedForSubjectCount = useMemo(() => {
    return MILESTONE_BADGES_CONFIG.filter((b) => isBadgeUnlocked(b, selectedSubjectId)).length;
  }, [unlockedBadges, selectedSubjectId]);

  const nextBadgeConfig = useMemo(() => {
    return MILESTONE_BADGES_CONFIG.find((b) => !isBadgeUnlocked(b, selectedSubjectId));
  }, [unlockedBadges, selectedSubjectId]);

  // Handle Canvas Pan Mouse Events
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains("canvas-bg")) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const newX = (e.clientX - canvasRect.left - panOffset.x) / zoom - dragOffset.x;
      const newY = (e.clientY - canvasRect.top - panOffset.y) / zoom - dragOffset.y;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? { ...node, x: Math.max(20, Math.round(newX)), y: Math.max(20, Math.round(newY)) }
            : node
        )
      );
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: TopicNode) => {
    e.stopPropagation();
    if (isConnectingMode) {
      if (!connectSourceId) {
        setConnectSourceId(node.id);
      } else if (connectSourceId !== node.id) {
        // Create Edge
        const newEdge: TopicEdge = {
          id: `te_${Date.now()}`,
          sourceId: connectSourceId,
          targetId: node.id,
          label: "Prerequisite",
          type: "prerequisite",
        };
        setEdges((prev) => [...prev, newEdge]);
        setConnectSourceId(null);
        setIsConnectingMode(false);
      }
      return;
    }

    setSelectedNodeId(node.id);
    setIsInspectorOpen(true);
    setDraggingNodeId(node.id);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const mouseCanvasX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const mouseCanvasY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
      setDragOffset({
        x: mouseCanvasX - node.x,
        y: mouseCanvasY - node.y,
      });
    }
  };

  // Cycle Node Status
  const handleCycleStatus = (e: React.MouseEvent, node: TopicNode) => {
    e.stopPropagation();
    const statusCycle: TopicNodeStatus[] = ["not_started", "in_progress", "mastered"];
    const nextIndex = (statusCycle.indexOf(node.status) + 1) % statusCycle.length;
    const newStatus = statusCycle[nextIndex];

    setNodes((prev) =>
      prev.map((n) => (n.id === node.id ? { ...n, status: newStatus } : n))
    );
  };

  // Add Custom Node
  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;

    // Calculate position near viewport center
    const x = Math.round((300 - panOffset.x) / zoom) + Math.floor(Math.random() * 80);
    const y = Math.round((200 - panOffset.y) / zoom) + Math.floor(Math.random() * 80);

    const newNode: TopicNode = {
      id: `tn_${Date.now()}`,
      subjectId: newNodeSubject,
      title: newNodeTitle.trim(),
      description: newNodeDesc.trim() || undefined,
      status: newNodeStatus,
      estimatedHours: Number(newNodeHours) || 2,
      difficulty: newNodeDifficulty,
      x: Math.max(40, x),
      y: Math.max(40, y),
      tags: ["Custom"],
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setIsAddNodeModalOpen(false);
    setNewNodeTitle("");
    setNewNodeDesc("");
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setIsInspectorOpen(false);
    }
  };

  // Auto Organize Hierarchy Presets
  const handleAutoLayout = () => {
    const currentSubjectNodes =
      selectedSubjectId === "all"
        ? nodes
        : nodes.filter((n) => n.subjectId === selectedSubjectId);

    // Simple topological rank-based auto-positioning
    const inDegrees: Record<string, number> = {};
    currentSubjectNodes.forEach((n) => (inDegrees[n.id] = 0));

    edges.forEach((e) => {
      if (inDegrees[e.targetId] !== undefined) {
        inDegrees[e.targetId] = (inDegrees[e.targetId] || 0) + 1;
      }
    });

    const levels: Record<string, number> = {};
    const assignLevels = (id: string, depth: number) => {
      levels[id] = Math.max(levels[id] || 0, depth);
      edges
        .filter((e) => e.sourceId === id)
        .forEach((e) => assignLevels(e.targetId, depth + 1));
    };

    currentSubjectNodes
      .filter((n) => inDegrees[n.id] === 0)
      .forEach((n) => assignLevels(n.id, 0));

    // Group nodes by level
    const levelGroups: Record<number, TopicNode[]> = {};
    currentSubjectNodes.forEach((n) => {
      const lvl = levels[n.id] || 0;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(n);
    });

    const updatedMap: Record<string, { x: number; y: number }> = {};
    Object.keys(levelGroups).forEach((lvlStr) => {
      const lvl = Number(lvlStr);
      const group = levelGroups[lvl];
      group.forEach((node, idx) => {
        updatedMap[node.id] = {
          x: 120 + lvl * 260,
          y: 100 + idx * 150,
        };
      });
    });

    setNodes((prev) =>
      prev.map((n) => (updatedMap[n.id] ? { ...n, ...updatedMap[n.id] } : n))
    );
  };

  // AI Curriculum Generator Simulation / API Handler
  const handleAIGenerateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiGenerating(true);

    try {
      // Create a set of AI generated nodes
      const subj = subjects.find((s) => s.id === aiSubjectId);
      const subjectName = subj ? subj.name : "Curriculum";
      const topicTopic = aiPrompt.trim();

      const aiGeneratedNodes: TopicNode[] = [
        {
          id: `tn_ai_${Date.now()}_1`,
          subjectId: aiSubjectId,
          title: `Foundations of ${topicTopic}`,
          description: `Core concepts, history, and basic terminology of ${topicTopic}.`,
          status: "mastered",
          estimatedHours: 2,
          difficulty: "Beginner",
          x: 100,
          y: 150,
          tags: ["AI Generated", "Foundations"],
        },
        {
          id: `tn_ai_${Date.now()}_2`,
          subjectId: aiSubjectId,
          title: `${topicTopic} Key Principles`,
          description: `Mathematical & logical mechanics underlying ${topicTopic}.`,
          status: "in_progress",
          estimatedHours: 4,
          difficulty: "Intermediate",
          x: 360,
          y: 100,
          tags: ["AI Generated", "Theory"],
        },
        {
          id: `tn_ai_${Date.now()}_3`,
          subjectId: aiSubjectId,
          title: `Practical Application & Tools`,
          description: `Hands-on problem solving and implementation strategies for ${topicTopic}.`,
          status: "in_progress",
          estimatedHours: 5,
          difficulty: "Intermediate",
          x: 360,
          y: 280,
          tags: ["AI Generated", "Practice"],
        },
        {
          id: `tn_ai_${Date.now()}_4`,
          subjectId: aiSubjectId,
          title: `Advanced ${topicTopic} Synthesis`,
          description: `Complex case studies, edge-case optimization, and real-world mastery.`,
          status: "not_started",
          estimatedHours: 6,
          difficulty: "Advanced",
          x: 640,
          y: 180,
          tags: ["AI Generated", "Mastery"],
        },
      ];

      const aiGeneratedEdges: TopicEdge[] = [
        {
          id: `te_ai_${Date.now()}_1`,
          sourceId: aiGeneratedNodes[0].id,
          targetId: aiGeneratedNodes[1].id,
          label: "Prerequisite",
          type: "prerequisite",
        },
        {
          id: `te_ai_${Date.now()}_2`,
          sourceId: aiGeneratedNodes[0].id,
          targetId: aiGeneratedNodes[2].id,
          label: "Subtopic",
          type: "subtopic",
        },
        {
          id: `te_ai_${Date.now()}_3`,
          sourceId: aiGeneratedNodes[1].id,
          targetId: aiGeneratedNodes[3].id,
          label: "Prerequisite",
          type: "prerequisite",
        },
        {
          id: `te_ai_${Date.now()}_4`,
          sourceId: aiGeneratedNodes[2].id,
          targetId: aiGeneratedNodes[3].id,
          label: "Integrates",
          type: "related",
        },
      ];

      setNodes((prev) => [...prev, ...aiGeneratedNodes]);
      setEdges((prev) => [...prev, ...aiGeneratedEdges]);
      setSelectedSubjectId(aiSubjectId);
      setIsAIGeneratorOpen(false);
      setAiPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Subject Object Helper
  const getSubjectObj = (subjectId: string) => {
    return (
      subjects.find((s) => s.id === subjectId) || {
        id: "default",
        name: "General Subject",
        color: "bg-indigo-500 text-white",
      }
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Controls & Progression Header */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-xs z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Subject Selector */}
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Study Roadmap & Curriculum Path
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                    Path to Mastery
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track sub-topics, mark progression milestones, and visualize your step-by-step path to mastery.
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs mr-1">
              <button
                onClick={() => setActiveViewMode("roadmap")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeViewMode === "roadmap"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Study Roadmap</span>
              </button>
              <button
                onClick={() => setActiveViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeViewMode === "map"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Node Graph</span>
              </button>
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSubjectId(val);
                if (onSelectSubjectFilter) {
                  onSelectSubjectFilter(val === "all" ? null : val);
                }
              }}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Subjects Roadmap</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>

            {/* AI Auto-Generate Button */}
            <button
              onClick={() => setIsAIGeneratorOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Map Generator</span>
            </button>

            {/* Add Node Button */}
            <button
              onClick={() => setIsAddNodeModalOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>

            {/* Link Topics (only relevant in map mode) */}
            {activeViewMode === "map" && (
              <button
                onClick={() => {
                  setIsConnectingMode(!isConnectingMode);
                  setConnectSourceId(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  isConnectingMode
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs shadow-amber-500/30 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title={
                  isConnectingMode
                    ? "Click Source Topic, then Click Target Topic to link!"
                    : "Click to enter Link Mode"
                }
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isConnectingMode ? "Linking Active" : "Link Topics"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progression Stats Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Topics Mastery:
              </span>
              <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {stats.percent}% ({stats.mastered}/{stats.total})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Sub-topics Progress:
              </span>
              <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.subTopicPercent}%` }}
                />
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {stats.subTopicPercent}% ({stats.completedSubTopics}/{stats.totalSubTopics})
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-4 text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <strong className="text-slate-800 dark:text-slate-200">{stats.mastered}</strong> Mastered
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <strong className="text-slate-800 dark:text-slate-200">{stats.inProgress}</strong> In Progress
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-indigo-500" />
                <strong className="text-slate-800 dark:text-slate-200">{stats.masteredHours}/{stats.totalHours} hrs</strong>
              </span>
            </div>
          </div>

          {/* Quick Search & Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or sub-topic..."
                className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>

            {activeViewMode === "map" && (
              <button
                onClick={handleAutoLayout}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-all"
                title="Auto-Align Nodes Hierarchically"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Content View Area */}
      {activeViewMode === "roadmap" ? (
        /* STUDY ROADMAP VIEW MODE */
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* DIGITAL MILESTONE BADGES REWARDS SHOWCASE BAR */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
              {/* Ambient background glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        Visual Rewards & Milestone Badges
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                          {unlockedForSubjectCount} / 4 Badges Unlocked
                        </span>
                      </h2>
                      <p className="text-xs text-slate-300">
                        Earn digital badges at 25%, 50%, 75%, and 100% roadmap completion!
                      </p>
                    </div>
                  </div>

                  {/* Progress to Next Badge */}
                  {nextBadgeConfig && (
                    <div className="text-right shrink-0 hidden sm:block">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Next Target: {nextBadgeConfig.title}
                      </span>
                      <span className="text-xs font-semibold text-amber-300">
                        {stats.percent}% / {nextBadgeConfig.threshold}% ({Math.max(0, nextBadgeConfig.threshold - stats.percent)}% remaining)
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges Grid (4 Milestone Threshold Cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {MILESTONE_BADGES_CONFIG.map((badgeConfig) => {
                    const isUnlocked = isBadgeUnlocked(badgeConfig, selectedSubjectId);
                    const unlockedDate = getBadgeUnlockedDate(badgeConfig, selectedSubjectId);
                    const IconComp = badgeConfig.icon;
                    const progressPercent = Math.min(100, Math.round((stats.percent / badgeConfig.threshold) * 100));

                    return (
                      <div
                        key={badgeConfig.id}
                        onClick={() => setInspectedBadge(badgeConfig)}
                        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isUnlocked
                            ? `bg-slate-800/80 hover:bg-slate-800 ${badgeConfig.border} shadow-lg shadow-amber-500/5`
                            : "bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/50 text-slate-400"
                        }`}
                      >
                        <div className="flex flex-col h-full justify-between space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                                isUnlocked
                                  ? `bg-gradient-to-br ${badgeConfig.gradient} text-white ${badgeConfig.border} shadow-md`
                                  : "bg-slate-800 border-slate-700 text-slate-500"
                              }`}
                            >
                              {isUnlocked ? <IconComp className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                            </div>

                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                isUnlocked ? badgeConfig.badgeBg : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {badgeConfig.threshold}%
                            </span>
                          </div>

                          <div>
                            <h3 className={`text-xs font-bold ${isUnlocked ? "text-white" : "text-slate-300"}`}>
                              {badgeConfig.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {badgeConfig.subtitle}
                            </p>
                          </div>

                          <div className="pt-1.5 border-t border-white/5">
                            {isUnlocked ? (
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Unlocked
                                </span>
                                {unlockedDate && (
                                  <span className="text-slate-400 font-mono text-[9px]">
                                    {new Date(unlockedDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] text-slate-400">
                                  <span>Progress</span>
                                  <span>{stats.percent}% / {badgeConfig.threshold}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                                  <div
                                    className="bg-indigo-400 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sub-topics Status Filter Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Filter Sub-topics:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "completed", label: "Completed" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "not_started", label: "Not Started" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSubTopicFilter(f.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        subTopicFilter === f.id
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>
                  {stats.completedSubTopics} of {stats.totalSubTopics} Sub-topics Completed
                </span>
              </div>
            </div>

            {/* Level Tier Progression Sections */}
            {(["Beginner", "Intermediate", "Advanced"] as const).map((difficultyLevel, levelIdx) => {
              const levelNodes = filteredNodes.filter(
                (n) => (n.difficulty || "Intermediate") === difficultyLevel
              );

              if (levelNodes.length === 0) return null;

              const levelMasteredCount = levelNodes.filter((n) => n.status === "mastered").length;
              const isLevelComplete = levelMasteredCount === levelNodes.length && levelNodes.length > 0;

              return (
                <div key={difficultyLevel} className="space-y-4">
                  {/* Level Stage Header Banner */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
                          difficultyLevel === "Beginner"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : difficultyLevel === "Intermediate"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        }`}
                      >
                        L{levelIdx + 1}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Level {levelIdx + 1}: {difficultyLevel} Foundations & Modules
                          {isLevelComplete && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Tier Mastered
                            </span>
                          )}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {levelMasteredCount} of {levelNodes.length} topics mastered in this level
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {levelNodes.length} Topics
                    </div>
                  </div>

                  {/* Level Topics Cards List */}
                  <div className="grid grid-cols-1 gap-4">
                    {levelNodes.map((node) => {
                      const subject = getSubjectObj(node.subjectId);
                      const subTopicsList = node.subTopics || [];
                      const filteredSubTopics = subTopicsList.filter((st) =>
                        subTopicFilter === "all" ? true : st.status === subTopicFilter
                      );

                      const totalST = subTopicsList.length;
                      const completedST = subTopicsList.filter((st) => st.status === "completed").length;
                      const stRatio = totalST > 0 ? Math.round((completedST / totalST) * 100) : 0;

                      // Check Prerequisite edges
                      const prereqEdges = edges.filter(
                        (e) => e.targetId === node.id && e.type === "prerequisite"
                      );
                      const prereqNodes = prereqEdges
                        .map((e) => nodes.find((n) => n.id === e.sourceId))
                        .filter(Boolean) as TopicNode[];
                      const unmasteredPrereqs = prereqNodes.filter((p) => p.status !== "mastered");

                      return (
                        <div
                          key={node.id}
                          className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden ${
                            node.status === "mastered"
                              ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10"
                              : node.status === "in_progress"
                              ? "border-amber-300 dark:border-amber-800/80"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {/* Accent Left Bar */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              node.status === "mastered"
                                ? "bg-emerald-500"
                                : node.status === "in_progress"
                                ? "bg-amber-500"
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          />

                          {/* Topic Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pl-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${subject.color}`}>
                                  {subject.name}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {node.estimatedHours || 3} hrs est.
                                </span>
                                {node.tags?.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {node.title}
                              </h3>
                              {node.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
                                  {node.description}
                                </p>
                              )}
                            </div>

                            {/* Main Topic Status Selector */}
                            <div className="shrink-0 flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:inline">
                                Topic Status:
                              </span>
                              <select
                                value={node.status}
                                onChange={(e) => {
                                  const st = e.target.value as TopicNodeStatus;
                                  setNodes((prev) =>
                                    prev.map((n) => (n.id === node.id ? { ...n, status: st } : n))
                                  );
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                  node.status === "mastered"
                                    ? "bg-emerald-500 text-white border-emerald-600"
                                    : node.status === "in_progress"
                                    ? "bg-amber-500 text-white border-amber-600"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="mastered">Mastered</option>
                              </select>
                            </div>
                          </div>

                          {/* Prerequisites Status Alert Banner */}
                          {prereqNodes.length > 0 && (
                            <div className="mt-3 pl-2">
                              {unmasteredPrereqs.length > 0 ? (
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span>
                                      <strong>Prerequisite Warning:</strong> Master{" "}
                                      {unmasteredPrereqs.map((p) => p.title).join(", ")} first for best comprehension.
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>All prerequisites satisfied ({prereqNodes.map((p) => p.title).join(", ")})</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sub-Topics Checklist Section */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 pl-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Sub-topics & Milestone Checklist
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  ({completedST}/{totalST} completed)
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden hidden sm:block">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${stRatio}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {stRatio}%
                                </span>
                              </div>
                            </div>

                            {/* Sub-topics list */}
                            <div className="space-y-2 mt-2">
                              {filteredSubTopics.map((sub) => (
                                <div
                                  key={sub.id}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border text-xs gap-2 transition-all ${
                                    sub.status === "completed"
                                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                                      : sub.status === "in_progress"
                                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80"
                                  }`}
                                >
                                  <span
                                    className={`font-semibold ${
                                      sub.status === "completed"
                                        ? "line-through text-slate-500 dark:text-slate-400"
                                        : "text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {sub.title}
                                  </span>

                                  {/* Sub-topic 3-Way Status Toggle Buttons */}
                                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                                    {(["not_started", "in_progress", "completed"] as SubTopicStatus[]).map(
                                      (stStatus) => (
                                        <button
                                          key={stStatus}
                                          onClick={() =>
                                            handleUpdateSubTopicStatus(node.id, sub.id, stStatus)
                                          }
                                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                                            sub.status === stStatus
                                              ? stStatus === "completed"
                                                ? "bg-emerald-500 text-white shadow-xs"
                                                : stStatus === "in_progress"
                                                ? "bg-amber-500 text-white shadow-xs"
                                                : "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 shadow-xs"
                                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                          }`}
                                        >
                                          {stStatus.replace("_", " ")}
                                        </button>
                                      )
                                    )}

                                    <button
                                      onClick={() => handleDeleteSubTopic(node.id, sub.id)}
                                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                                      title="Delete Sub-topic"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {subTopicsList.length === 0 && (
                                <p className="text-xs text-slate-400 italic py-1">
                                  No sub-topics added yet. Add your first sub-topic below!
                                </p>
                              )}
                            </div>

                            {/* Inline Add Sub-topic Form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAddSubTopic(node.id, newSubTopicInputs[node.id] || "");
                              }}
                              className="flex items-center gap-2 mt-3"
                            >
                              <input
                                type="text"
                                value={newSubTopicInputs[node.id] || ""}
                                onChange={(e) =>
                                  setNewSubTopicInputs((prev) => ({
                                    ...prev,
                                    [node.id]: e.target.value,
                                  }))
                                }
                                placeholder="Add new sub-topic or milestone..."
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </form>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 pl-2">
                            <button
                              onClick={() => {
                                setSelectedNodeId(node.id);
                                setIsInspectorOpen(true);
                                setActiveViewMode("map");
                              }}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                            >
                              <GitFork className="w-3.5 h-3.5" />
                              <span>Focus Node on Mind Map Graph →</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {onNavigateToNotes && (
                                <button
                                  onClick={() => onNavigateToNotes(node.subjectId)}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Notes</span>
                                </button>
                              )}
                              {onNavigateToQuiz && (
                                <button
                                  onClick={() => onNavigateToQuiz(node.title)}
                                  className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/80 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Quiz</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* INTERACTIVE NODE GRAPH VIEW MODE */
        <div className="relative flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950/80">
          {/* Canvas Background & Drag Surface */}
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            className="canvas-bg absolute inset-0 cursor-grab active:cursor-grabbing select-none overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.25) 1px, transparent 1px)`,
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          >
            {/* SVG Connection Lines Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <marker
                  id="arrow-prereq"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                </marker>
                <marker
                  id="arrow-related"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
              </defs>

              {filteredEdges.map((edge) => {
                const source = filteredNodes.find((n) => n.id === edge.sourceId);
                const target = filteredNodes.find((n) => n.id === edge.targetId);
                if (!source || !target) return null;

                const x1 = (source.x + 100) * zoom + panOffset.x;
                const y1 = (source.y + 45) * zoom + panOffset.y;
                const x2 = (target.x + 100) * zoom + panOffset.x;
                const y2 = (target.y + 45) * zoom + panOffset.y;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const curveStrength = Math.min(Math.abs(dx) * 0.5, 120);

                const pathD = `M ${x1} ${y1} C ${x1 + curveStrength} ${y1}, ${
                  x2 - curveStrength
                } ${y2}, ${x2} ${y2}`;

                const isEdgeHighlighted =
                  selectedNodeId &&
                  highlightedNodeIds.has(edge.sourceId) &&
                  highlightedNodeIds.has(edge.targetId);

                const strokeColor = isEdgeHighlighted
                  ? "#10b981"
                  : edge.type === "prerequisite"
                  ? "#6366f1"
                  : "#f59e0b";

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isEdgeHighlighted ? 3 * zoom : 2 * zoom}
                      strokeDasharray={isEdgeHighlighted ? "6 3" : "none"}
                      markerEnd={
                        edge.type === "prerequisite" ? "url(#arrow-prereq)" : "url(#arrow-related)"
                      }
                      className={isEdgeHighlighted ? "animate-pulse" : "opacity-75"}
                    />
                    {edge.label && (
                      <text
                        x={midX}
                        y={midY - 8}
                        fill="#64748b"
                        fontSize={10 * zoom}
                        textAnchor="middle"
                        className="bg-white px-1 font-semibold pointer-events-none dark:fill-slate-400"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Render Interactive Topic Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHighlighted = highlightedNodeIds.has(node.id);
              const subject = getSubjectObj(node.subjectId);

              const nodeScreenX = node.x * zoom + panOffset.x;
              const nodeScreenY = node.y * zoom + panOffset.y;

              const totalST = (node.subTopics || []).length;
              const completedST = (node.subTopics || []).filter((st) => st.status === "completed").length;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  style={{
                    transform: `translate3d(${nodeScreenX}px, ${nodeScreenY}px, 0px) scale(${zoom})`,
                    transformOrigin: "top left",
                    width: "220px",
                  }}
                  className={`absolute left-0 top-0 cursor-pointer select-none rounded-2xl p-3 border transition-all duration-150 z-10 ${
                    node.status === "mastered"
                      ? "bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 shadow-md shadow-emerald-500/10"
                      : node.status === "in_progress"
                      ? "bg-amber-50/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 shadow-md shadow-amber-500/10"
                      : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-md"
                  } ${
                    isSelected
                      ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 z-30"
                      : isHighlighted
                      ? "ring-1 ring-emerald-400 shadow-lg"
                      : "hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                >
                  {/* Node Header Badges */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${subject.color}`}
                    >
                      {subject.name}
                    </span>

                    {/* Status Toggle Badge */}
                    <button
                      onClick={(e) => handleCycleStatus(e, node)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-transform active:scale-95 ${
                        node.status === "mastered"
                          ? "bg-emerald-500 text-white"
                          : node.status === "in_progress"
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                      title="Click to cycle status"
                    >
                      {node.status === "mastered" ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Mastered</span>
                        </>
                      ) : node.status === "in_progress" ? (
                        <>
                          <Clock className="w-2.5 h-2.5" />
                          <span>In Progress</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>To Learn</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Node Title & Description */}
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                    {node.title}
                  </h3>
                  {node.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {node.description}
                    </p>
                  )}

                  {/* Sub-topics Counter Pill */}
                  {totalST > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <CheckSquare className="w-3 h-3 text-emerald-500" />
                      <span>
                        {completedST}/{totalST} Sub-topics ({Math.round((completedST / totalST) * 100)}%)
                      </span>
                    </div>
                  )}

                  {/* Node Footer Info */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {node.estimatedHours || 2}h est.
                    </span>
                    {node.difficulty && (
                      <span
                        className={`font-semibold ${
                          node.difficulty === "Beginner"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : node.difficulty === "Intermediate"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {node.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Floating Canvas Zoom & View Controls */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-lg space-x-1 text-slate-700 dark:text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-slate-600 dark:text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto" />
            <button
              onClick={() => {
                setZoom(1.0);
                setPanOffset({ x: 40, y: 40 });
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Reset Canvas View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Node Inspector Drawer (Right Side Overlay) */}
          {selectedNode && isInspectorOpen && (
            <div className="absolute top-4 right-4 z-30 w-84 max-h-[calc(100%-32px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 overflow-y-auto flex flex-col justify-between space-y-4 animate-in slide-in-from-right-5 duration-200">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      getSubjectObj(selectedNode.subjectId).color
                    }`}
                  >
                    {getSubjectObj(selectedNode.subjectId).name}
                  </span>
                  <button
                    onClick={() => setIsInspectorOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedNode.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedNode.description || "No description provided for this topic."}
                  </p>
                </div>

                {/* Status Switcher Buttons */}
                <div className="mt-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Update Topic Status
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["not_started", "in_progress", "mastered"] as TopicNodeStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id ? { ...n, status: st } : n
                              )
                            )
                          }
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold capitalize flex items-center justify-center gap-1 border transition-all ${
                            selectedNode.status === st
                              ? st === "mastered"
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : st === "in_progress"
                                ? "bg-amber-500 text-white border-amber-600"
                                : "bg-slate-800 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {st === "mastered" && <Check className="w-3 h-3" />}
                          {st.replace("_", " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Sub-Topics Inspector Checklist */}
                <div className="mt-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Sub-Topics Checklist
                  </label>
                  <div className="space-y-1.5">
                    {(selectedNode.subTopics || []).map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-1"
                      >
                        <span
                          className={`truncate font-medium ${
                            sub.status === "completed" ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {sub.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {(["not_started", "in_progress", "completed"] as SubTopicStatus[]).map(
                            (stStatus) => (
                              <button
                                key={stStatus}
                                onClick={() =>
                                  handleUpdateSubTopicStatus(selectedNode.id, sub.id, stStatus)
                                }
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  sub.status === stStatus
                                    ? stStatus === "completed"
                                      ? "bg-emerald-500 text-white"
                                      : stStatus === "in_progress"
                                      ? "bg-amber-500 text-white"
                                      : "bg-slate-700 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {stStatus === "not_started"
                                  ? "Not"
                                  : stStatus === "in_progress"
                                  ? "Prog"
                                  : "Done"}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                    {(selectedNode.subTopics || []).length === 0 && (
                      <p className="text-xs text-slate-400 italic">No sub-topics added.</p>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Study Notes & Memory Aids
                  </label>
                  <textarea
                    value={selectedNode.notes || ""}
                    onChange={(e) =>
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNode.id ? { ...n, notes: e.target.value } : n
                        )
                      )
                    }
                    placeholder="Write key formulas, memory triggers, or study steps..."
                    className="w-full h-20 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>

                {/* Connected Prerequisite Dependencies */}
                <div className="mt-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Prerequisites & Related Topics
                  </label>
                  <div className="space-y-1.5">
                    {edges
                      .filter((e) => e.targetId === selectedNode.id)
                      .map((e) => {
                        const srcNode = nodes.find((n) => n.id === e.sourceId);
                        return (
                          <div
                            key={e.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              ← {srcNode?.title || "Topic"}
                            </span>
                            <button
                              onClick={() =>
                                setEdges((prev) => prev.filter((edge) => edge.id !== e.id))
                              }
                              className="p-1 text-slate-400 hover:text-rose-500"
                              title="Remove Link"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    {edges.filter((e) => e.targetId === selectedNode.id).length === 0 && (
                      <p className="text-xs text-slate-400 italic">No prerequisites linked yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {onNavigateToNotes && (
                    <button
                      onClick={() => onNavigateToNotes(selectedNode.subjectId)}
                      className="py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Notes</span>
                    </button>
                  )}
                  {onNavigateToQuiz && (
                    <button
                      onClick={() => onNavigateToQuiz(selectedNode.title)}
                      className="py-2 px-3 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Quiz Me</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Topic Node</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Add Custom Node */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                Add New Topic Node
              </h2>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  placeholder="e.g., Dijkstra's Shortest Path Algorithm"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject
                </label>
                <select
                  value={newNodeSubject}
                  onChange={(e) => setNewNodeSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                  placeholder="Key concepts or overview..."
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Est. Study Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newNodeHours}
                    onChange={(e) => setNewNodeHours(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={newNodeDifficulty}
                    onChange={(e) => setNewNodeDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddNodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20"
                >
                  Create Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: AI Auto-Generate Mind Map */}
      {isAIGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Curriculum Map Generator
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automatically structure prerequisites & study path for any topic.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAIGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAIGenerateMap} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Subject
                </label>
                <select
                  value={aiSubjectId}
                  onChange={(e) => setAiSubjectId(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Enter Course or Curriculum Topic *
                </label>
                <input
                  type="text"
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Quantum Mechanics, Machine Learning, Organic Chemistry"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2">
                <Zap className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                <span>
                  The AI will generate foundational, intermediate, and advanced topic nodes with prerequisite dependency vectors automatically laid out.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAIGeneratorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAiGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center gap-2"
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Map...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Node Graph</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Badge Inspection Details Modal */}
      {inspectedBadge && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <button
              onClick={() => setInspectedBadge(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const isUnlocked = isBadgeUnlocked(inspectedBadge, selectedSubjectId);
              const unlockedDate = getBadgeUnlockedDate(inspectedBadge, selectedSubjectId);
              const IconComp = inspectedBadge.icon;

              return (
                <div className="text-center space-y-4 pt-2">
                  <div
                    className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border-2 shadow-xl ${
                      isUnlocked
                        ? `bg-gradient-to-br ${inspectedBadge.gradient} text-white ${inspectedBadge.border}`
                        : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    {isUnlocked ? <IconComp className="w-10 h-10" /> : <Lock className="w-8 h-8" />}
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase tracking-wider mb-2">
                      <Award className="w-3.5 h-3.5" />
                      <span>{inspectedBadge.threshold}% Milestone Badge</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {inspectedBadge.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {inspectedBadge.subtitle}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {inspectedBadge.description}
                    </p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Reward Perk: {inspectedBadge.perk}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Status:
                    </span>
                    {isUnlocked ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Unlocked {unlockedDate && `on ${new Date(unlockedDate).toLocaleDateString()}`}
                      </span>
                    ) : (
                      <span className="font-bold text-slate-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Requires {inspectedBadge.threshold}% Mastery (Current: {stats.percent}%)
                      </span>
                    )}
                  </div>

                  <div className="pt-3 flex gap-2">
                    {isUnlocked && (
                      <button
                        type="button"
                        onClick={() => audioSynth.playChime("success")}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                      >
                        <PartyPopper className="w-4 h-4" />
                        <span>Play Chime</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setInspectedBadge(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: Newly Unlocked Badge Celebration Modal */}
      {celebrationBadge && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative text-center overflow-hidden">
            {/* Sparkles backdrop */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest animate-bounce">
                <PartyPopper className="w-4 h-4" />
                <span>Milestone Badge Unlocked!</span>
              </div>

              {/* Large Metallic Badge Icon */}
              <div className="relative mx-auto w-24 h-24 my-2">
                <div className="absolute inset-0 rounded-3xl bg-amber-400/30 animate-ping" />
                <div
                  className={`relative w-24 h-24 rounded-3xl flex items-center justify-center border-2 shadow-2xl bg-gradient-to-br ${celebrationBadge.gradient} ${celebrationBadge.border}`}
                >
                  {React.createElement(celebrationBadge.icon, { className: "w-12 h-12 text-white" })}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">
                  {celebrationBadge.title}
                </h2>
                <p className="text-xs text-amber-300 font-semibold mt-1">
                  {celebrationBadge.threshold}% Roadmap Mastery Reached!
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                {celebrationBadge.description}
              </p>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Bonus Perk: {celebrationBadge.perk}</span>
              </div>

              <button
                onClick={() => setCelebrationBadge(null)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold text-sm shadow-xl transition-all cursor-pointer"
              >
                Claim Reward & Keep Learning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
