import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Clock, User, Tag, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, Reorder } from "framer-motion";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  required_skills: string[];
  due_date: string | null;
  created_at: string;
  assignee?: {
    username: string;
    avatar_url: string;
  };
}

interface TaskBoardProps {
  teamId: string;
}

const columns = [
  { id: "todo", title: "To Do", color: "bg-muted" },
  { id: "doing", title: "In Progress", color: "bg-primary/10" },
  { id: "done", title: "Done", color: "bg-success/10" },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

export const TaskBoard = ({ teamId }: TaskBoardProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    required_skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!teamId) return;

    const fetchTasks = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/innovation/teams/${teamId}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch {}
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [teamId]);

  const createTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/teams/${teamId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          status: newTask.status,
          required_skills: newTask.required_skills,
        })
      });

      if (res.ok) {
        toast.success("Task created!");
        setIsAddingTask(false);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
          required_skills: [],
        });
      } else {
        toast.error("Failed to create task");
      }
    } catch {
      toast.error("Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/innovation/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch {}
  };

  const addSkill = () => {
    if (skillInput.trim() && !newTask.required_skills.includes(skillInput.trim())) {
      setNewTask((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setNewTask((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((s) => s !== skill),
    }));
  };

  const getTasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Task Board</h3>
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title</Label><Input id="title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Task title..."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label><Textarea id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Task description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) =>
                      setNewTask((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="doing">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add skill..."
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newTask.required_skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={createTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`relative rounded-lg p-4 ${column.color} min-h-[300px]`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{column.title}</h4>
              <Badge variant="outline">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>
            <div className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm">{task.title}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {task.required_skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {task.required_skills.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{task.required_skills.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          className={`text-xs ${priorityColors[task.priority]}`}
                        >
                          {task.priority}
                        </Badge>
                        {task.assignee && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      {column.id !== "done" && (
                        <div className="flex gap-1 pt-2">
                          {column.id === "todo" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-6"
                              onClick={() => updateTaskStatus(task.id, "doing")}
                            >
                              Start
                            </Button>
                          )}
                          {column.id === "doing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-6"
                              onClick={() => updateTaskStatus(task.id, "done")}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
